import { CheerioCrawler } from 'crawlee';
import { leverBoards } from '../../jobList.js';
import { MongoClient } from "mongodb";
import { Company, JobPost, Status, FeaturedMedia, Meta } from '../../JobPost.type.js';

import dotenv from 'dotenv'

interface Listing { title: string; url: string; dateFound: string }

interface PostData {
  url?: string;
  title: string;
  location: string;
  department: string;
  workplaceType: string;
}

dotenv.config();

const client = new MongoClient(process.env.mongo_url || '');
const db = client.db('evhunt');
const board = "https://jobs.lever.co/lucidmotors";
const leverCollection = client.db('evhunt').collection(Company.lucid);

const readBoard = () => {
  const urls: string[] = [];
  // leverBoards.forEach(b => urls.push(b.urls[0])); // combine all urls into a single array for searching
  const companyListingsUpdated: string[] = [];
  const finalArray: PostData[] = [];

  const cheerio = new CheerioCrawler({
    minConcurrency: 5,
    maxConcurrency: 10,

    // On error, retry each page at most once.
    maxRequestRetries: 1,

    // Increase the timeout for processing of each page.
    requestHandlerTimeoutSecs: 30,

    async requestHandler({ $ }) {
      const postings = Array.from($('.posting'));

      console.debug('found Length: ', postings.length)

      postings.forEach((post) => {
        const _html = $.load(post);
        const url = _html('.posting-title').attr('href');
        const postData = {
          url,
          title: _html('.posting-title h5').text(),
          location: _html('.posting-title .posting-categories .location').text(),
          department: _html('.posting-title .posting-categories .department').text(),
          workplaceType: _html('.posting-title .posting-categories .workplaceTypes').text(),
          dateFound: Date.now(),
          close: false,
          published: false
        };

        if (url) finalArray.push(postData);
      })

      // push found companies into holding array for message queue processing
      // companyListingsUpdated.push(company);

      // insert job if its not found in db
      console.debug('preparing to push: ', finalArray.length);
      finalArray.forEach(job => {
        console.log('pushing: ', job.title)
        leverCollection.updateOne({ url: job.url }, { $set: job }, { upsert: true })
      })
    },

    // This function is called if the page processing failed more than maxRequestRetries + 1 times.
    failedRequestHandler({ request }) {
      console.debug(`Request ${request.url} failed twice.`);
    },
  });

  cheerio.run([leverBoards[0].url]).then(() => {
    // if (companyListingsUpdated.length) {
    //     client.db('evhunt').collection('messages').insertOne({ companyListingsUpdated, timeStamp: Date.now(), isComplete: false })
    // }
    console.debug('processed ', finalArray.length, ' new records')
  })
}

const setLeverToWordpress = async () => {
  const buff = Buffer.from(process.env.username + ":" + process.env.password);
  let base64data = buff.toString('base64');
  let failureCount = 0;

  const metadata = await db.collection('companyMetadata').findOne({ _company_name: Company.lucid });
  const listings = await db.collection(Company.lucid).find({ "listingInfo": { $exists: true }, published: false }).toArray();

  if (!metadata) {
    console.debug('no metadata found for: ', Company.lucid);
    return
  }
  listings.forEach((l, i) => {
    if (failureCount > 5) process.exit(); // quit the process early if this system bombs more than 5 times

    metadata['_job_location'] = l.location;
    metadata['_application'] = `${l.url}/apply`;
    metadata['title'] = l.title;

    const post: JobPost = {
      slug: l.title.replace(/\s/g, '_'),
      status: Status.publish,
      title: l.title,
      content: l.listingInfo,
      author: 2,
      featured_media: FeaturedMedia[Company.lucid],
      template: '',
      meta: metadata as unknown as Meta,
      "job-types": [3]
    }

    return setTimeout(() => fetch(process.env.wp_endpoint || '', {
      method: 'post',
      body: JSON.stringify(post),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + base64data
      }
    }).then((response) => {
      console.debug('updating: ', l.url)
      if (response.status === 200 || response.status === 201) {
        db.collection(Company.lucid).updateOne({ url: l.url }, { $set: { published: true } })
        console.debug('set successful: ', Company.lucid, ' | ', response.status)
      }
      else {
        console.debug('WP send response was not 200: ', JSON.stringify(response))
        failureCount++;
      }
    }).catch((e) => {
      console.debug('WP send error: ', JSON.stringify(e))
      failureCount++;
    }), 500 * i
    )
  })
}

const crawl = async (urls: any[], company: string) => {
  const cheerio = new CheerioCrawler({
    minConcurrency: 5,
    maxConcurrency: 10,
    // On error, retry each page at most once.
    maxRequestRetries: 1,
    // Increase the timeout for processing of each page.
    requestHandlerTimeoutSecs: 30,

    async requestHandler({ request, $ }) {
        console.log('req: ', request.url)
        const listingInfo = $('body > div.content-wrapper.posting-page > div > div:nth-child(2)').html()?.replace(/(\r\n|\n|\r)/gm, "").trim()
  
        if (listingInfo) {
          db.collection(company).updateOne({ url: request.url }, { $set: { listingInfo } })
        }
    },

    // TODO: Add another failure handler to account for the position being closed
    // This function is called if the page processing failed more than maxRequestRetries + 1 times.
    failedRequestHandler({ request }) {
      console.debug(`Request ${request.url} failed twice. marking the position closed`);
      db.collection(company).updateOne({ url: request }, { $set: { closed: true } })
    },
  });

  return cheerio.run(urls);
}

const getListingInfo = async () => {
  const cleanedURLs: string[] = [];
  const listings = db.collection(Company.lucid).find({ published: false, closed: false }).project({ url: 1, _id: 0 }).toArray();
  (await listings).forEach(l => cleanedURLs.push(l.url));
  console.debug('cu: ', cleanedURLs.length)
  crawl(cleanedURLs, Company.lucid)
};

export {
  readBoard,
  setLeverToWordpress,
  getListingInfo
}
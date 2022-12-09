import { MongoClient, WithId } from "mongodb";
import { greenhouseBoards } from './jobList.js';
import { CheerioCrawler } from 'crawlee';
import dotenv from 'dotenv'

dotenv.config();

const client = new MongoClient(process.env.mongo_url || '');
const db = client.db('evhunt')

const crawl = async (urls: any[], company: string) => {
  const listings = client.db('evhunt').collection(company);

  const cheerio = new CheerioCrawler({
    minConcurrency: 5,
    maxConcurrency: 10,
    // On error, retry each page at most once.
    maxRequestRetries: 1,
    // Increase the timeout for processing of each page.
    requestHandlerTimeoutSecs: 30,

    async requestHandler({ request, $ }) {
      const listingInfo = $('#content')?.html()?.replace(/(\r\n|\n|\r)/gm, "").trim();

      if (listingInfo) {
        listings.updateOne({ url: request.url }, { $set: { listingInfo, '_job_location': $('.location').text()?.replace(/(\r\n|\n|\r)/gm, "").trim() } })
      }
    },

    // TODO: Add another failure handler to account for the position being closed
    // This function is called if the page processing failed more than maxRequestRetries + 1 times.
    failedRequestHandler({ request }) {
      console.debug(`Request ${request.url} failed twice. marking the position closed`);
      const db = client.db('evhunt').collection(company);

      db.updateOne({ url: request }, { $set: { closed: true } })
    },
  });

  cheerio.run(urls).then((onfulfilled => {
    process.exit(0);
  }))
}

const getListingInfo = async (companyName: string) => {
  const companies = db.collection(companyName);
  const listings = companies.find({ "published": false, closed: false }).project({ url: 1, _id: 0 }).toArray();
  const cleanedURLs: string[] = [];
  (await listings).forEach(l => cleanedURLs.push(l.url));
  crawl(cleanedURLs, companyName)
};

getListingInfo(greenhouseBoards[0].company)

export {
  getListingInfo
}
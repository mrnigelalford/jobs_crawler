import { CheerioCrawler } from 'crawlee';
import { greenhouseBoards } from './jobList.js';
import { MongoClient } from "mongodb";
import { FeaturedMedia, JobPost, Meta, Status } from './JobPost.type.js';
import { getListingInfo } from './getListingInfo.js';

import dotenv from 'dotenv'
import fetch from 'node-fetch';

dotenv.config();

const client = new MongoClient(process.env.mongo_url || '');
const db = client.db('evhunt');

const greenhouseCrawl = () => {
    const urls: string[] = [];
    greenhouseBoards.forEach(b => urls.push(b.urls[0])); // combine all urls into a single array for searching
    const companyListingsUpdated: string[] = [];

    const cheerio = new CheerioCrawler({
        minConcurrency: 5,
        maxConcurrency: 10,

        // On error, retry each page at most once.
        maxRequestRetries: 1,

        // Increase the timeout for processing of each page.
        requestHandlerTimeoutSecs: 30,

        async requestHandler({ request, $ }) {
            const myLinks = Array.from($('a'));
            const finalArray: Listing[] = [];

            myLinks.forEach(arr => {
                if (arr.children[0]?.parent?.attribs?.href.indexOf('jobs') > -1) {
                    finalArray.push({
                        title: arr.children[0].data,
                        url: 'https://boards.greenhouse.io' + arr.children[0]?.parent?.attribs?.href,
                        dateFound: new Date().toDateString()
                    })
                }
            });

            const company = greenhouseBoards.filter(b => b.urls[0] === request.url)[0].company;
            const db = client.db('evhunt').collection(company);

            // push found companies into holding array for message queue processing
            companyListingsUpdated.push(company);
            // insert job if its not found in db
            finalArray.forEach(job => db.updateOne({ url: job.url }, { $set: job }, { upsert: true }))
        },

        // This function is called if the page processing failed more than maxRequestRetries + 1 times.
        failedRequestHandler({ request }) {
            console.debug(`Request ${request.url} failed twice.`);
        },
    });

    cheerio.run(urls).then(() => {
        if (companyListingsUpdated.length) {
            client.db('evhunt').collection('messages').insertOne({ companyListingsUpdated, timeStamp: Date.now(), isComplete: false })
        }
        console.debug('finished processing ')
    })
}

const setToWordPress = () => {
    const buff = Buffer.from(process.env.username + ":" + process.env.password);
    let base64data = buff.toString('base64');
    let failureCount = 0;

    greenhouseBoards.forEach(async (board) => {
        // if (board.company.toLowerCase() !== 'xosinc') return;
        const metadata = await db.collection('companyMetadata').findOne({ _company_name: board.company });
        const listings = await db.collection(board.company).find({ "listingInfo": { $exists: true }, published: false }).toArray();
        
        if (!metadata) {
            console.debug('no metadata found for: ', board.company);
            return
        }
        listings.forEach((l, i) => {
            if(failureCount > 5) process.exit(); // quit the process early if this system bombs more than 5 times

            metadata['_job_location'] = l._job_location;
            metadata['_application'] = `${l.url}#app`;
            metadata['title'] = l.title;            

            const post: JobPost = {
                slug: l.title.replace(/\s/g, '_'),
                status: Status.publish,
                title: l.title,
                content: l.listingInfo,
                author: 2,
                featured_media: FeaturedMedia[board.company],
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
                    db.collection(board.company).updateOne({ url: l.url }, { $set: { published: true } })
                    console.debug('set successful: ', board.company, ' | ', response.status)
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
    })
}

const hydrateListing = () => {
    const boards: string[] = [];
    greenhouseBoards.forEach(b => boards.push(b.company)); // combine all urls into a single array for searching
    boards.forEach(u => getListingInfo(u))
}

export {
    greenhouseCrawl, // 1. walk all greenhouse boards
    hydrateListing,  // 2. add missing data to database
    setToWordPress   // 3. publish job to wordpress
}


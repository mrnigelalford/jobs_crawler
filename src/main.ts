// For more information, see https://crawlee.dev/
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

    const cheerio = new CheerioCrawler({
        minConcurrency: 5,
        maxConcurrency: 10,

        // On error, retry each page at most once.
        maxRequestRetries: 1,

        // Increase the timeout for processing of each page.
        requestHandlerTimeoutSecs: 30,

        async requestHandler({ request, $ }) {
            // Store the results to the dataset. In local configuration,
            // the data will be stored as JSON files in ./storage/datasets/default

            // Save results as JSON to ./storage/datasets/default
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
            console.debug('company: ', company)
            const db = client.db('evhunt').collection(company);

            // insert job if its not found in db
            finalArray.forEach(job => db.updateOne({ url: job.url }, { $set: job }, { upsert: true }))
        },

        // This function is called if the page processing failed more than maxRequestRetries + 1 times.
        failedRequestHandler({ request }) {
            console.debug(`Request ${request.url} failed twice.`);
        },
    });

    cheerio.run(urls).then(() => { console.log('finished processing ') })
}

const setToWordPress = () => {
    const buff = Buffer.from(process.env.username + ":" + process.env.password);
    let base64data = buff.toString('base64');

    greenhouseBoards.forEach(async (board) => {
        // if (board.company.toLowerCase() !== 'xosinc') return;
        const metadata = await db.collection('companyMetadata').findOne({ _company_name: board.company });
        const listings = await db.collection(board.company).find({ "listingInfo": { $exists: true }, published: false }).toArray();
        if (!metadata) return
        listings.forEach((l, i) => {
            metadata['_job_location'] = l._job_location;
            metadata['_application'] = `${l.url}#app`;
            metadata['title'] = l.title;

            const post: JobPost = {
                slug: l.title.replace(/\s/g, '_'),
                status: Status.draft,
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
                if (response.status === 200 || response.status === 201) {
                    console.debug('set successful: ', board.company, ' | ', response.status)
                    db.collection(board.company).updateOne({ url: metadata['_application'] }, { $set: { "published": true } })
                }
            }), 2500
            )
        })
    })
}

const hydrateListing = () => {
    const boards: string[] = [];
    greenhouseBoards.forEach(b => boards.push(b.urls[0])); // combine all urls into a single array for searching

    boards.forEach(u => getListingInfo(u))
}

export {
    greenhouseCrawl, // 1. walk all greenhouse boards
    hydrateListing,  // 2. add missing data to database
    setToWordPress   // 3. publish job to wordpress
}


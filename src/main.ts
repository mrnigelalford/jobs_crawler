// For more information, see https://crawlee.dev/
import { PlaywrightCrawler, CheerioCrawler } from 'crawlee';
import { greenhouseBoards } from './jobList.js';
import { setPost } from './publishJobPost.js';
import fs from 'fs';
import { MongoClient } from "mongodb";
import { FeaturedMedia, JobPost, Meta, Status } from './JobPost.type.js';
import dotenv from 'dotenv'

dotenv.config();

const client = new MongoClient(process.env.mongo_url || '');
const db = client.db('evhunt');
const jobFile = './storage/jobSearch.json';

interface Listing { title: string; url: string; dateFound: string }

interface StoreProps {
    title: string;
    url?: string;
}

const storeLink = (store: StoreProps) => {
    const fileData = JSON.parse(fs.readFileSync(jobFile, { encoding: 'utf8' }));
    fileData.push(store);
    fs.writeFileSync(jobFile, JSON.stringify(fileData, null, 4), 'utf-8')
}

const crawler = new PlaywrightCrawler({
    // Use the requestHandler to process each of the crawled pages.
    async requestHandler({ request, page, enqueueLinks, log }) {
        const title = await page.title();
        log.info(`Title of ${request.loadedUrl} is '${title}'`);

        // Save results as JSON to ./storage/datasets/default
        storeLink({ title, url: request.loadedUrl });

        // Extract links from the current page
        // and add them to the crawling queue.
        await enqueueLinks({
            regexps: [/(\/careers)/g, /(jobs)/g],
            strategy: 'same-domain'
        });
    },
    // Uncomment this option to see the browser window.
    // headless: false,
});


const greenhouseCrawl = async (url: string, company: string) => {
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

            const rivianDB = client.db('evhunt').collection(company);

            // insert job if its not found
            finalArray.forEach(job => {
                rivianDB.updateOne({ url: job.url }, { $set: job }, { upsert: true })
            })
        },

        // This function is called if the page processing failed more than maxRequestRetries + 1 times.
        failedRequestHandler({ request }) {
            console.debug(`Request ${request.url} failed twice.`);
        },
    });

    cheerio.run([url]).then(() => console.log('finished processing: ', url))
}

// TODO: Uncomment this to walk the boards
// greenhouseBoards.forEach(job => {
//     greenhouseCrawl(job.urls[0], job.company)
// })

// getListingInfo;


//query mongo
// pull listing
// pull metadata
// build a post
// post it.
// repeat

const getStuff = () => {
    greenhouseBoards.forEach(async (board) => {
        // if (board.company.toLowerCase() !== 'xosinc') return;
        const metadata = await db.collection('companyMetadata').findOne({ _company_name: board.company });
        const listings = await db.collection(board.company).find({ "published": false }).toArray();
        if (!metadata) return
        listings.forEach(async (l, i) => {
            if (l) {
                metadata['_job_location'] = l._job_location;
                metadata['_application'] = `${l.url}#app`;
                metadata['title'] = l.title;

                const post: JobPost = {
                    slug: l.title.replace(/\s/g, '_'),
                    status: Status.draft,
                    title: l.title,
                    content: l.listingInfo,
                    author: 1,
                    featured_media: FeaturedMedia[board.company],
                    template: '',
                    meta: metadata as unknown as Meta,
                    "job-types": [3]
                }

                setPost(post, board.company)
            }
        })
    })
}

getStuff();

// For more information, see https://crawlee.dev/
import { PlaywrightCrawler, CheerioCrawler } from 'crawlee';
import { jobList } from './jobList.js';
import fs from 'fs';
import { MongoClient } from "mongodb";

const uri =
    "mongodb://127.0.0.1:27017/db?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.6.0";

// Create a new MongoClient
const client = new MongoClient(uri);

const jobFile = './storage/jobSearch.json';

interface RIVIANDATA { title: string; url: string }

// PlaywrightCrawler crawls the web using a headless
// browser controlled by the Playwright library.
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


const jobSearch = async(url: string, company: string) => {
    const cheerio = new CheerioCrawler({
        // The crawler downloads and processes the web pages in parallel, with a concurrency
        // automatically managed based on the available system memory and CPU (see AutoscaledPool class).
        // Here we define some hard limits for the concurrency.
        minConcurrency: 10,
        maxConcurrency: 50,
    
        // On error, retry each page at most once.
        maxRequestRetries: 1,
    
        // Increase the timeout for processing of each page.
        requestHandlerTimeoutSecs: 30,
    
        // Limit to 10 requests per one crawl
        // maxRequestsPerCrawl: 10,
    
        // This function will be called for each URL to crawl.
        // It accepts a single parameter, which is an object with options as:
        // https://crawlee.dev/api/cheerio-crawler/interface/CheerioCrawlerOptions#requestHandler
        // We use for demonstration only 2 of them:
        // - request: an instance of the Request class with information such as the URL that is being crawled and HTTP method
        // - $: the cheerio object containing parsed HTML
        async requestHandler({ request, enqueueLinks, $, page }) {
            console.debug(`Processing ${request.url}...`);
    
            // Extract data from the page using cheerio.
            const title = $('title').text();
    
            // Store the results to the dataset. In local configuration,
            // the data will be stored as JSON files in ./storage/datasets/default
    
            // Save results as JSON to ./storage/datasets/default
            const myLinks = Array.from($('a'));
            const finalArray: RIVIANDATA[] = [];
            myLinks.forEach(arr => {
                if (arr.children[0]?.parent?.attribs?.href.indexOf('jobs') > -1) {
                    finalArray.push({ title: arr.children[0].data, url: 'https://boards.greenhouse.io/' + arr.children[0]?.parent?.attribs?.href })
                }
            })
    
            const rivianDB = client.db('evhunt').collection(company);

            // insert job if its not found
            finalArray.forEach(job => {
                rivianDB.updateOne({url: job.url},job, {upsert: true})
            })
            // await enqueueLinks({
            //     regexps: [/(jobs)/g],
            // });
        },
    
        // This function is called if the page processing failed more than maxRequestRetries + 1 times.
        failedRequestHandler({ request }) {
            console.debug(`Request ${request.url} failed twice.`);
        },
    });

    cheerio.run([url])
}

jobList.forEach(job => {
    jobSearch(job.urls[0], job.company)
})


// Add first URL to the queue and start the crawl.
// await crawler.run(jobList);

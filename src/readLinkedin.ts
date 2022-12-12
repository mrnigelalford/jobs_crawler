import { PlaywrightCrawler } from 'crawlee';
import fs from 'fs';

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
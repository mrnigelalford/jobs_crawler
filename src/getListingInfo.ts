import { MongoClient } from "mongodb";
import { CheerioCrawler } from 'crawlee';
import dotenv from 'dotenv'

dotenv.config();

const client = new MongoClient(process.env.mongo_url || '');
const db = client.db('evhunt')

const crawl = async (urls: any[], company: string) => {
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
        db.collection(company).updateOne({ url: request.url }, { $set: { listingInfo, '_job_location': $('.location').text()?.replace(/(\r\n|\n|\r)/gm, "").trim() } })
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

const getListingInfo = async (companyName: string) => {
  const cleanedURLs: string[] = [];
  const listings = db.collection(companyName).find({ published: false, closed: false }).project({ url: 1, _id: 0 }).toArray();
  (await listings).forEach(l => cleanedURLs.push(l.url));
  crawl(cleanedURLs, companyName)
};

export {
  getListingInfo
}
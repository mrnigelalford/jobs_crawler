import cheerio from 'cheerio';
import request from 'request';
import fs from 'fs';

const url = 'https://about.polestar.com/careers/jobs/';

const getPolestar = (url: string) => {
  request(url, (error, response, html) => {
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(html);
  
      // Create an array to store the listings
      const listings = [];
  
      // Iterate through each listing element on the page
      $('.job-listing').each((i, element) => {
        // Get the title, location, and description of the listing
        const title = $(element).find('.job-title').text();
        const location = $(element).find('.job-location').text();
        const description = $(element).find('.job-description').text();
  
        // Add the listing to the array
        listings.push({ title, location, description });
      });
  
      // Convert the array of listings to a CSV string
      const csv = listings.map(listing => `${listing.title},${listing.location},${listing.description}`).join('\n');
  
      // Write the CSV string to a file
      fs.writeFileSync('listings.csv', csv);
    }
  });
}

getPolestar(url)
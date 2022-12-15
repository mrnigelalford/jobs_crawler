const jobList = [
  // "https://www.everarecruitment.com/job/1274722-head-of-sales-north-america", - EV recruiter Europe

  // crack this batch next
  "https://jobs.lever.co/lucidmotors", // lever, similar to greenhouse
    // "https://www.lucidmotors.com/careers/search", (may not be needed)
  'https://recruiting.paylocity.com/Recruiting/Jobs/All/ddd48b68-5d30-4845-bd31-2cbbac035ac6/Lordstown-Motors-Corp', // lordstown

  // more complex broader search
  "https://search-careers.gm.com/en/jobs/?search=ev&pagesize=20#results",
  "https://jobs.mercedes-benz.com",
  "https://careers-canoo.icims.com/jobs",
  "https://nikolamotor.com/careers/jobs",
  "https://scoutmotors.rippling-ats.com/",
  "https://www.volkswagengroupofamerica.com/en-us/careers/careers-at-volkswagen",
  "https://bollingermotors.com/careers/",

  // batteries
  "https://workforcenow.adp.com/mascsr/default/mdf/recruitment/recruitment.html?cid=cdd81bde-c04d-4821-8470-4bfe169d4493&ccId=9200095921795_2&type=JS&lang=en_US",
  "https://www.indeed.com/cmp/Byd/jobs",
  "https://careers.na.panasonic.com/careers?title=&field_job_company_target_id%5B156%5D=156&field_job_company_target_id%5B171%5D=171&field_job_company_target_id%5B186%5D=186&field_job_company_target_id%5B361%5D=361&field_job_company_target_id%5B401%5D=401&lat=&lng=&geolocation_geocoder_address=",
  "https://www.aesc-inc.com/careers/", // needs work


  // Infrastructure
  //  TODO - dig into ABB more deeply
  "https://careers.abb/global/en/job/ABB1GLOBAL84071661EXTERNALENGLOBAL/Sales-Director-Western-Region-E-mobility-US-REMOTE?utm_source=linkedin&utm_medium=phenom-feeds",
]

const greenhouseBoards = [
  // vehicle manufactors
  {
    urls: ['https://boards.greenhouse.io/rivian'], // full rivian listings
    company: 'Rivian'
  },
  {
    urls: ['https://boards.greenhouse.io/samsungsemiconductor'],
    company: 'Samsung'
  },
  {
    urls: [ "https://boards.greenhouse.io/xosinc"], // truck manufactor
    company: 'Xosinc'
  },
  {
    urls: ['https://boards.greenhouse.io/faradayfuture'], // vehicle manufacturer
    company: 'Faraday Futures'
  }
]

// NOTE: This info is stored in mongo. Keeping this here in case db needs to be rehydrated
const companyMetadata = [
  {
    _company_name: 'Rivian',
    _company_website: 'https://rivian.com',
    _company_tagline: 'Rivian is on a mission to keep the world adventurous forever. This goes for the emissions-free Electric Adventure Vehicles we build, and the curious, courageous souls we seek to attract.',
    _company_twitter: 'https://twitter.com/rivian',
    _company_video: 'https://videos.rivian.com/2md5qhoeajym/2SKNPrlw8JnbBdUFC4npiy/8cd6cddc208eeab19bba9d8e745fc05d/2021-Video-RJ-Scaringe-01.mp4'
  },
  {
    _company_name: 'Samsung Semiconductor',
    _company_website: 'https://semiconductor.samsung.com',
    _company_tagline: 'he products and technology we develop are used by world leaders in Mobile, Automotive, AR/VR, Gaming, IoT, Edge, AI and are enabling unprecedented growth in enterprise and hyper-scale data centers.',
    _company_twitter: 'https://www.twitter.com/samsungdsglobal',
    _company_video: 'https://news.samsung.com/medialibrary/download/53098/medium'
  },
  {
    _company_name: 'Xosinc',
    _company_website: 'https://xostrucks.com',
    _company_tagline: 'an innovative electric vehicle company on a mission to decarbonize commercial transportation. Our zero-emission commercial vehicles and next-generation technologies empower fleets of Fortune 500 companies and positively impact our environment.',
    _company_twitter: 'https://twitter.com/xostrucks',
    _company_video: 'https://www.dropbox.com/sh/zx31zqs7dtf5m2q/AACb0OOKW_EPbqfVwA21yfMta/B-Roll/Xos%20B-roll%20-%20Overview%20ProRes.mov?dl=0'
  },
  {
    _company_name: 'Faraday Future',
    _company_website: 'https://www.ff.com',
    _company_tagline: 'Faraday Future (FF) is a California-based global shared intelligent mobility ecosystem company focusing on building the next generation of intelligent mobility ecosystems. Established in May 2014, the company is headquartered in Los Angeles with R&D Center and Futurist Testing Lab, and offices in Silicon Valley, Beijing, Shanghai, and Chengdu.',
    _company_twitter: 'https://twitter.com/faradayfuture',
    _company_video: 'https://genesis-cdn.ff.com/2019-Media-Summit/Video.zip'
  },
]

const VERBRequests = [
  {
    company: 'Tesla',
    url: "https://www.tesla.com/careers/search/?site=US",
    requestType: 'GET'
  },
  {
    company: 'Fisker',
    url: "https://fisker.wd1.myworkdayjobs.com/wday/cxs/fisker/Fisker_Careers/jobs",
    requestType: 'POST'
  },
  {
    company: 'FORD',
    requestType: 'GET',
    url: "https://efds.fa.em5.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&expand=requisitionList.secondaryLocations,flexFieldsFacet.values&finder=findReqs;siteNumber=CX_1,facetsList=LOCATIONS%3BWORK_LOCATIONS%3BTITLES%3BCATEGORIES%3BORGANIZATIONS%3BPOSTING_DATES%3BFLEX_FIELDS,limit=25,keyword=%22ev%22,sortBy=RELEVANCY",
  }
]

export {
  greenhouseBoards
}

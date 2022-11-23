# Getting started with Crawlee

This example uses `PlaywrightCrawler` to recursively crawl https://crawlee.dev using the browser automation library [Playwright](https://playwright.dev).

You can find more examples and documentation at the following links:

- [Step-by-step tutorial](https://crawlee.dev/docs/introduction) for Crawlee
- `PlaywrightCrawler` [API documentation](https://crawlee.dev/api/playwright-crawler/class/PlaywrightCrawler)
- Other [examples](https://crawlee.dev/docs/examples/playwright-crawler)

## Actions and next steps

### Companies to watch
- samsung
- Rivian
- Tesla
- Ford
- Chevrolet
- Bollinger
- Canoo
- Faraday
- Fisker
- Lordstown
- Nikola
- Lucid
- Mercedes
- Scout motors

### Companies or products to learn
  - ABB

### Next Steps and data tasks

store jobs per company
track job posting TTL
time to walk the job list per day
schedule jobs to start and stop crawler

## How it works
1. Job list is stored in `jobList.ts`.
2. This list is pulle into the crawler and recursed
3. All data is stored in `storage/jobSearch.json`
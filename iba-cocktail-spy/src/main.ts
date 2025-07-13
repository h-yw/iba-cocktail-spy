// For more information, see https://crawlee.dev/
import { log, PuppeteerCrawler } from 'crawlee';
import fs from 'fs/promises'; // 使用 promise 版本的 fs API

import { allCocktails, OUTPUT_FILE, router } from './routes.js';

const startUrls = [{
    url:'https://iba-world.com/cocktails/all-cocktails/',
    label:'list'
}];

const crawler = new PuppeteerCrawler({
    // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
    requestHandler: router,
    // Comment this option to scrape the full website.
    // maxRequestsPerCrawl: 1,
});


await crawler.run(startUrls)

await fs.writeFile(OUTPUT_FILE, JSON.stringify(allCocktails, null, 2), 'utf-8');
log.info(`✅ 所有数据已写入 ${OUTPUT_FILE}，共 ${allCocktails.length} 条`);
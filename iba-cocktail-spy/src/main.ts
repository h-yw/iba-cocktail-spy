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
    maxRequestsPerCrawl: 2,
    maxConcurrency:1,
    preNavigationHooks:[
        async({page})=>{
            // BOLD: --- 添加 Cookie ---
            // log.info('正在为页面设置 age_gate cookie...');
            // await page.setCookie({
            //     name: 'age_gate',
            //     value: '18',
            //     domain: 'www.iba-world.com', // 确保指定正确的域名
            // });

            // BOLD: --- 请求拦截逻辑 (保持不变) ---
            // 开启请求拦截
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const resourceType = req.resourceType();
                // 阻止加载图片、样式、字体等非必要资源
                if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });
        }
    ]
});


await crawler.run(startUrls)

await fs.writeFile(OUTPUT_FILE, JSON.stringify(allCocktails, null, 2), 'utf-8');
log.info(`✅ 所有数据已写入 ${OUTPUT_FILE}，共 ${allCocktails.length} 条`);
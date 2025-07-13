import { createPuppeteerRouter, PuppeteerCrawlingContext } from 'crawlee';
import path from 'path';
import fs from 'fs/promises'; // 使用 promise 版本的 fs API

export const router = createPuppeteerRouter<PuppeteerCrawlingContext>();

export const allCocktails:any[] = []; // 全局缓存所有页面数据
export const OUTPUT_FILE = path.resolve('data/cocktails.json'); // 输出文件路径

router.addHandler('list', async ({ request,enqueueLinks, page, log  }) => {
   try{
    log.info(`处理页面: ${page.url()}`);

    await page.waitForSelector('.iba-cocktails-container')
    const cocktails = await page.$$eval('.iba-cocktails-container > .cocktail',(items:any[])=>items.map((item)=>{
        const id = item.classList[1].split('-')[1]
        const link = item.querySelector('a')?.href
        const img = item.querySelector('img')?.src
        const title = item.querySelector('h2')?.textContent
        const categoryEl = item.querySelector('.cocktail-category');
        const category = categoryEl?.textContent?.trim() || null;
        return {
            id,
            link,
            title,
            category,
            img
        }
    }))
    allCocktails.push(...cocktails)
    log.info(`本页抓取 ${cocktails.length} 条，累计 ${allCocktails.length} 条`);

    //  // 加入详情页处理队列
    // for (const item of cocktails) {
    //     log.info(`link======>${item.link}`)
    //     if (item.link) {
    //         await enqueueLinks({
    //             urls: [item.link],
    //             label: 'detail',
    //             // 透传前面抓到的数据
    //             userData: {
    //                 partialData: item,
    //             }
    //         });
    //     }
    // }

    const nextHref = await page.$eval('.iba-cocktails-pagination > .next', (el:any) => el.href).catch(() => null);
    if(nextHref){
        await enqueueLinks({
            urls:[nextHref],
            label:'list',
        })
        log.info(`已加入下一页: ${nextHref}`);
    }} catch (error) {
        // 捕获并记录错误，而不是让程序崩溃
        log.error(`处理列表页 ${request.url} 失败: ${error}`);
    }
});

// 详情
router.addHandler('detail',async({page,request,log})=>{
    const { partialData } = request.userData;

    await page.waitForSelector('.cocktail-ingredients');
    const result = await page.evaluate(()=>{
        const getText = (sel:string) => document.querySelector(sel)?.textContent?.trim() || null;

        const img = document.querySelector<HTMLImageElement>('.elementor-widget-image > .elementor-widget-container > img')?.src
        const video = document.querySelector<HTMLAnchorElement>('.elementor-widget-container > elementor-shortcode > a')?.href
        const ingredients = [...document.querySelectorAll<HTMLLIElement>('.elementor-widget-container > .elementor-shortcode > ul > li')].map(li=>li.textContent?.trim())
        const method = [...document.querySelectorAll<HTMLParagraphElement>('.elementor-widget-container > .elementor-shortcode > p')].map(p=>p.textContent?.trim())
        // 装饰
        const decorated = [...document.querySelectorAll<HTMLParagraphElement>('.elementor-widget-container > .elementor-shortcode > p')].map(p=>p.textContent?.trim())
        return {
            img,
            video,
            ingredients,
            method,
            decorated,
        }
    })
    const fullData ={
        ...partialData,
        detail:result
    }
    log.info(`partialData====>${partialData}`,)
    log.info(`detail======>${result}`,)
    allCocktails.push(fullData);

}
)

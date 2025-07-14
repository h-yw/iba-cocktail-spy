import { createPuppeteerRouter } from 'crawlee';
import path from 'path';

export const router = createPuppeteerRouter();

export const allCocktails:any[] = []; // 全局缓存所有页面数据
export const OUTPUT_FILE = path.resolve('data/cocktails-full.json'); // 输出文件路径

/**
 * 辅助函数：处理年龄验证弹窗
 * @param page - Puppeteer 的 Page 对象
 * @param log - Crawlee 的 Log 对象
 */
async function handleAgeGate(page: any, log: any): Promise<void> {
    try {
        // 使用一个较短的超时时间来检测弹窗是否存在，因为它不是总会出现
        const dialogSelector = '.age-gate__wrapper';
        log.info(`正在检查是否存在弹窗: "${dialogSelector}"...`);
        
        await page.waitForSelector(dialogSelector, { timeout: 7000 }); // 等待7秒

        // 如果代码执行到这里，说明弹窗已出现
        log.warn('检测到年龄验证弹窗，准备点击确认按钮...');
        
        // 假设确认按钮是弹窗内的一个 <button> 元素
        // 注意：您可能需要根据实际页面HTML来调整这个按钮的选择器
        const buttonSelector = `.age-gate__submit .age-gate__submit--yes`; 
        await page.click(buttonSelector);

        // 点击后，等待弹窗消失，以确保操作成功
        // await page.waitForSelector(dialogSelector, { hidden: true });
        log.info('弹窗已成功处理！');

    } catch (error) {
        // 如果 waitForSelector 超时，说明页面上没有弹窗，这是正常情况
        log.info('未检测到年龄验证弹窗，正常继续。');
    }
}

// 默认处理器
router.addDefaultHandler(async ({ log, page }) => {
    log.info(`默认处理器捕获到未处理页面: ${page.url()}`);
});

router.addHandler('list', async ({ request,enqueueLinks, page, log  }) => {
   try{
    await handleAgeGate(page, log);

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
    // allCocktails.push(...cocktails)
    log.info(`本页抓取 ${cocktails.length} 条，累计 ${allCocktails.length} 条`);

    //  // 加入详情页处理队列
    for (const item of cocktails) {
        log.info(`link======>${item.link}`)
        if (item.link) {
            await enqueueLinks({
                urls: [item.link],
                label: 'detail',
                // 透传前面抓到的数据
                userData: {
                    partialData: item,
                }
            });
        }
    }

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
router.addHandler('detail',async({page,request,log,pushData})=>{
    try{
        const { partialData } = request.userData;
        await handleAgeGate(page, log);

        log.info(`正在处理详情页 (XPath): ${partialData.title}`);

        await page.waitForSelector('#content > div > div.elementor');
        
        const detailData = await page.evaluate(() => {
            // @ts-ignore
            // throw new Error(JSON.stringify(document.evaluate(path, contextNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)))
            // const getSingleNodeValue = (path, contextNode, attribute) => {
            //     const result = document.evaluate(path, contextNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            //     const node = result.iterateNext();
            //     if (!node) return null;

            //     if (attribute) {
            //         // @ts-ignore
            //         return node.getAttribute(attribute);
            //     }
            //     return node.textContent?.trim() || null;
            // };

            // const getMultipleNodeValues = (path, contextNode = document) => {
            //     const results = [];
                // const iterator = document.evaluate(path, contextNode, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
            //     let node = iterator.iterateNext();
            //     while (node) {
            //         const text = node.textContent?.trim();
            //         if (text) results.push(text);
            //         node = iterator.iterateNext();
            //     }
            //     return results;
            // };
            // const  getSingleNodeValue =(selector, attribute)=>{
            //     const node =document.querySelector(selector)
            //     if(!node) return ''
            //     if(attribute){
            //         return node.getAttribute(attribute)
            //     }
            //     return node.textContent?.trim() || null;
            // }
            // const getMultipleNodeValues =(selector)=>{
            //     const nodes =document.querySelectorAll(selector)
            //     if(!node) return []
            //     return  [...nodes].map(item=>item.textContent?.trim()||null)
            // }

            // // XPath 路径
            const imgXpath = '//*[@id="content"]/div/div[1]/section[2]/div/div[1]/div/div/div/div/div/div/img';
            // const videoXpath = '//*[@id="content"]/div/div[1]/section[2]/div/div[1]/div/section/div/div/div/div[2]/div/div/a';
            // const ingredientsXpath = '//*[@id="content"]/div/div[1]/section[2]/div/div[2]/div/div[2]/div/div/ul/li';
            // const preparationXpath = '//*[@id="content"]/div/div[1]/section[2]/div/div[2]/div/div[4]/div/div/p';
            // const decoratedXpath = '//*[@id="content"]/div/div[1]/section[2]/div/div[2]/div/div[6]/div/div/p';

            // const img = getSingleNodeValue(imgXpath, document, 'src');
            //    @ts-ignore
            const img =document.querySelector('#content > div > div.elementor > section.elementor-section.elementor-top-section.elementor-element.elementor-section-stretched.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div > div.elementor-column.elementor-col-50.elementor-top-column.elementor-element > div > div > div > div > div > div > img')?.src //document.evaluate(imgXpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
            // const imgNode =  imgXpathRes.iterateNext();
            // const video = getSingleNodeValue(videoXpath, document, 'href');
            const video = document.querySelector('#content > div > div.elementor> section.elementor-section.elementor-top-section.elementor-element.elementor-section-stretched.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div > div.elementor-column.elementor-col-50.elementor-top-column.elementor-element > div > section > div > div > div > div.elementor-element.elementor-widget.elementor-widget-shortcode > div > div > a')?.href
            // const ingredients = getMultipleNodeValues(ingredientsXpath);
            const ingredients = [...(document.querySelectorAll('#content > div > div.elementor > section.elementor-section.elementor-top-section.elementor-element.elementor-section-stretched.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div > div.elementor-column.elementor-col-50.elementor-top-column.elementor-element > div > div.elementor-element.elementor-widget.elementor-widget-shortcode > div > div > ul > li')??[])].map(item=>item.textContent?.trim()||null)
            // const preparation = getMultipleNodeValues(preparationXpath);
            const preparation = [...(document.querySelectorAll('#content > div > div.elementor > section.elementor-section.elementor-top-section.elementor-element.elementor-section-stretched.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div > div.elementor-column.elementor-col-50.elementor-top-column.elementor-element> div > div.elementor-element.elementor-widget.elementor-widget-shortcode > div > div > p')??[])].map(item=>item.textContent?.trim()||null)
            // const decorated = getMultipleNodeValues(decoratedXpath);
            const decorated = [...(document.querySelectorAll('#content > div > div.elementor > section.elementor-section.elementor-top-section.elementor-element.elementor-section-stretched.elementor-section-boxed.elementor-section-height-default.elementor-section-height-default > div > div.elementor-column.elementor-col-50.elementor-top-column.elementor-element> div > div.elementor-element.elementor-widget.elementor-widget-shortcode > div > div > p')??[])].map(item=>item.textContent?.trim()||null)
            return { img, video, ingredients,
                 preparation, decorated 
                };
            // return {img,video}
        });


        log.info(`处理详情页: ${JSON.stringify(detailData)}`)
        const fullData ={
            ...partialData,
            detail: detailData
         }
        log.info(`partialData====>${partialData}`,)
        log.info(`detail======>${detailData}`,)
        allCocktails.push(fullData);
        pushData(fullData)
    } catch (error: any) {
        log.error(`处理详情页 ${request.url} 失败: ${error.stack}`);
        // 可选：将失败的请求重新加入队列进行重试
        // await request.retry();
    }

})

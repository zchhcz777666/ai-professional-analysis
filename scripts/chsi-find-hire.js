/**
 * 探索学校页面的导航 -> 找往年录取信息
 */
const puppeteer = require('puppeteer');
const c = require('fs').readFileSync('scripts/crawled-data/chsi-cookie.txt', 'utf-8').trim();
const CHROME_PATH = 'C:\\Users\\Administrator\\.cache\\puppeteer\\chrome\\win64-131.0.6778.204\\chrome-win64\\chrome.exe';

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setUserAgent('Mozilla/5.0');
  
  const cookieItems = c.split(';').map(pair => {
    const [name, ...vals] = pair.trim().split('=');
    return { name, value: vals.join('='), domain: '.chsi.com.cn', path: '/' };
  });
  await page.setCookie(...cookieItems);

  // 武汉大学 schId=383
  const schId = 383;
  
  await page.goto(`https://gaokao.chsi.com.cn/sch/schoolInfo--schId-${schId}.dhtml`, { 
    waitUntil: 'networkidle2', timeout: 15000 
  });
  await new Promise(r => setTimeout(r, 2000));

  // 提取所有导航链接
  const navLinks = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a')];
    return links
      .filter(a => a.href.includes('schId-') || a.href.includes('mindex'))
      .map(a => ({
        text: a.textContent.trim().substring(0, 30),
        href: a.href.substring(0, 200)
      }));
  });

  console.log('相关导航链接:');
  navLinks.forEach(l => console.log(`  ${l.text}: ${l.href}`));

  // 找"往年录取"链接
  const hireLink = navLinks.find(l => l.text.includes('往年录取') || l.text.includes('录取信息'));
  console.log('\n往年录取链接:', hireLink);

  // 检查其他可能的 URL 格式
  // 尝试 mindex-6 (往年录取信息)
  const urls = [
    `https://gaokao.chsi.com.cn/sch/listHireInfo--schId-${schId}.dhtml`,
    `https://gaokao.chsi.com.cn/sch/listHireInfo--schId-${schId},mindex-6.dhtml`,
    `https://gaokao.chsi.com.cn/sch/listScore--schId-${schId}.dhtml`,
    `https://gaokao.chsi.com.cn/sch/schoolInfo--schId-${schId},mindex-6.dhtml`,
    `https://gaokao.chsi.com.cn/sch/schoolInfo--schId-${schId},categoryId-27484,mindex-6.dhtml`,
  ];

  console.log('\n尝试各种录取页面:');
  for (const url of urls) {
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      await new Promise(r => setTimeout(r, 1500));
      
      const text = await page.evaluate(() => {
        const body = document.body.textContent;
        // 找表格数据
        const tables = [...document.querySelectorAll('table')];
        const scoreTable = tables.find(t => {
          const text = t.textContent;
          return (text.includes('最低分') || text.includes('位次') || text.includes('投档') || text.includes('录取线'));
        });
        return {
          title: document.title,
          hasContent: body.length,
          preview: body.substring(0, 300).replace(/\s+/g, ' '),
          tables: tables.length,
          hasScoreTable: !!scoreTable,
          scoreTablePreview: scoreTable ? scoreTable.textContent.substring(0, 300).replace(/\s+/g, ' ') : ''
        };
      });
      
      console.log(`\n${url.split('/sch/')[1]}:`);
      console.log(`  title: ${text.title}`);
      console.log(`  表格数: ${text.tables}, 有分数表: ${text.hasScoreTable}`);
      console.log(`  内容: ${text.preview.substring(0, 200)}`);
      if (text.scoreTablePreview) {
        console.log(`  分数表: ${text.scoreTablePreview.substring(0, 300)}`);
      }
    } catch(e) {
      console.log(`\n${url.split('/sch/')[1]}: ERROR ${e.message.substring(0, 50)}`);
    }
  }

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });

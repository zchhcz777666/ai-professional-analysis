/**
 * 检查阳光志愿 (zy/) 页面 - 这里可能有录取分数数据
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

  // 1. 首页
  console.log('=== 阳光志愿首页 ===');
  await page.goto('https://gaokao.chsi.com.cn/zy/', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));
  
  const home = await page.evaluate(() => {
    return {
      title: document.title,
      url: location.href,
      text: document.body.textContent.substring(0, 500).replace(/\s+/g, ' '),
      links: [...document.querySelectorAll('a')].map(a => a.textContent.trim() + ': ' + a.href).filter(l => l.length < 120).slice(0, 30)
    };
  });
  console.log('标题:', home.title);
  console.log('URL:', home.url);
  console.log('链接:', home.links.join('\n  '));

  // 2. 找"志愿参考"或"数据查询"相关链接
  console.log('\n=== 搜索相关链接 ===');
  const related = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a')];
    const keywords = ['分数', '录取', '位次', '数据', '历年', '查询', '志愿参考', '智能选校'];
    return links.filter(a => keywords.some(k => a.textContent.includes(k))).map(a => ({
      text: a.textContent.trim().substring(0, 50),
      href: a.href.substring(0, 200)
    }));
  });
  related.forEach(l => console.log(`  ${l.text}: ${l.href}`));

  // 3. 尝试直接访问分数页面
  const scoreUrls = [
    'https://gaokao.chsi.com.cn/zy/score/',
    'https://gaokao.chsi.com.cn/zy/score/schId-383',
    'https://gaokao.chsi.com.cn/zy/analyze/',
    'https://gaokao.chsi.com.cn/zy/analyze/score',
  ];
  
  console.log('\n=== 尝试直接访问 ===');
  for (const url of scoreUrls) {
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
      await new Promise(r => setTimeout(r, 2000));
      const info = await page.evaluate(() => ({
        title: document.title,
        url: location.href,
        text: document.body.textContent.substring(0, 200).replace(/\s+/g, ' '),
        redirect: location.href
      }));
      console.log(`${url}: ${info.title} | ${info.text.substring(0, 100)}`);
    } catch(e) {
      console.log(`${url}: ERROR`);
    }
  }

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });

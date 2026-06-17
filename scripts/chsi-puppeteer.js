/**
 * 最直接的方案：用 Puppeteer 控制浏览器打开 chsi 搜索页面
 * 抓取 AJAX 加载的学校列表数据
 */
const puppeteer = require('puppeteer');
const c = require('fs').readFileSync('scripts/crawled-data/chsi-cookie.txt', 'utf-8').trim();
const fs = require('fs');
const path = require('path');

async function main() {
  const chromePath = 'C:\\Users\\Administrator\\.cache\\puppeteer\\chrome\\win64-131.0.6778.204\\chrome-win64\\chrome.exe';

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: chromePath,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  // 设置 Cookie
  const cookieItems = c.split(';').map(pair => {
    const [name, ...vals] = pair.trim().split('=');
    return { name, value: vals.join('='), domain: '.chsi.com.cn', path: '/' };
  });
  await page.setCookie(...cookieItems);

  // 导航到学校搜索页
  console.log('导航到搜索页面...');
  await page.goto('https://gaokao.chsi.com.cn/sch/search--ss-on,option-qg,searchType-1,start-0.dhtml', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  await new Promise(r => setTimeout(r, 3000));

  // 截取搜索结果
  await page.screenshot({ path: 'scripts/crawled-data/chsi-browser.png' });

  // 获取页面上的学校数据
  const data = await page.evaluate(() => {
    // 找所有学校相关的元素
    const links = [...document.querySelectorAll('a')].map(a => ({
      text: a.textContent.trim().substring(0, 30),
      href: a.href
    }));
    const schools = links.filter(l => l.text.includes('大学') || l.text.includes('学院'));
    return { linkCount: links.length, schools: schools.slice(0, 20) };
  });
  console.log('页面数据:', data);

  // 尝试搜索清华大学
  await page.goto('https://gaokao.chsi.com.cn/sch/search.do?keyword=清华大学', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });
  await new Promise(r => setTimeout(r, 3000));
  
  const searchData = await page.evaluate(() => {
    const schLinks = [...document.querySelectorAll('a[href*=\"schId\"]')].map(a => ({
      text: a.textContent.trim(),
      href: a.href
    }));
    const divs = [...document.querySelectorAll('div')].map(d => d.textContent.trim()).filter(t => t.length < 200 && t.length > 5);
    return { schLinks: schLinks.slice(0, 10), texts: divs.slice(0, 30) };
  });
  console.log('搜索结果:', searchData);

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });

/**
 * 截获搜索页的自动补全 API 请求
 */
const puppeteer = require('puppeteer');
const c = require('fs').readFileSync('scripts/crawled-data/chsi-cookie.txt', 'utf-8').trim();
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Users\\Administrator\\.cache\\puppeteer\\chrome\\win64-131.0.6778.204\\chrome-win64\\chrome.exe';

async function main() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  const cookieItems = c.split(';').map(pair => {
    const [name, ...vals] = pair.trim().split('=');
    return { name, value: vals.join('='), domain: '.chsi.com.cn', path: '/' };
  });
  await page.setCookie(...cookieItems);

  // 拦截所有请求
  const requests = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('chsi') || url.includes('chei') || url.includes('eol')) {
      requests.push({
        url: url.substring(0, 200),
        method: req.method(),
        type: req.resourceType(),
        headers: req.headers()
      });
    }
  });

  page.on('response', res => {
    const url = res.url();
    if ((url.includes('schId') || url.includes('search') || url.includes('school') || url.includes('suggest') || url.includes('autocomp')) && url.includes('chsi')) {
      res.text().then(t => {
        console.log(`\n=== RESPONSE: ${url.substring(0, 150)} ===`);
        console.log(`  status: ${res.status()}`);
        console.log(`  body: ${t.substring(0, 500)}`);
      }).catch(() => {});
    }
  });

  // 打开搜索页
  await page.goto('https://gaokao.chsi.com.cn/sch/', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  // 截图
  await page.screenshot({ path: 'scripts/crawled-data/chsi-search-page.png' });

  // 获取所有链接检查搜索框
  const elems = await page.evaluate(() => {
    // 检查搜索框
    const inputs = document.querySelectorAll('input');
    const forms = document.querySelectorAll('form');
    return {
      inputs: [...inputs].map(i => ({ name: i.name, id: i.id, class: i.className, type: i.type, placeholder: i.placeholder })),
      forms: [...forms].map(f => ({ action: f.action, id: f.id, method: f.method })),
    };
  });
  console.log('inputs:', JSON.stringify(elems.inputs, null, 2));
  console.log('forms:', JSON.stringify(elems.forms, null, 2));

  // 截获 autocomplete 请求 — 输入关键词
  console.log('\n--- 输入关键词触发搜索 ---');
  const searchInput = await page.$('.search-input');
  if (searchInput) {
    await searchInput.click({ clickCount: 3 });
    await searchInput.type('武汉大学', { delay: 100 });
    await new Promise(r => setTimeout(r, 3000));

    // 查看 autocomplete 建议
    const suggestItems = await page.evaluate(() => {
      const items = document.querySelectorAll('.autocomplete-suggestion, .ui-menu-item, .suggest-item, li[class*="suggest"]');
      return [...items].map(item => item.textContent.trim());
    });
    console.log('autocomplete suggestions:', suggestItems);

    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 3000));

    // 检查搜索结果
    const results = await page.evaluate(() => {
      const links = [...document.querySelectorAll('a')];
      return links.filter(a => a.href.includes('schId-')).map(a => ({
        text: a.textContent.trim().substring(0, 40),
        href: a.href.match(/schId-(\d+)/)?.[1]
      })).filter(a => a.text);
    });
    console.log('\n搜索结果:');
    results.slice(0, 15).forEach(r => console.log(`  schId=${r.href}: ${r.text}`));
  }

  // 输出所有记录的请求
  console.log('\n--- 记录的网络请求 ---');
  requests.forEach(r => console.log(`  ${r.method} ${r.type}: ${r.url}`));

  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });

/**
 * 检查多个学校的录取数据情况 — Puppeteer
 * 找出哪些学校有"往年录取信息"
 */
const puppeteer = require('puppeteer');
const c = require('fs').readFileSync('scripts/crawled-data/chsi-cookie.txt', 'utf-8').trim();
const CHROME_PATH = 'C:\\Users\\Administrator\\.cache\\puppeteer\\chrome\\win64-131.0.6778.204\\chrome-win64\\chrome.exe';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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

  // 测试学校
  const tests = [
    { name: '清华大学', schId: 3 },
    { name: '北京大学', schId: 1 },
    { name: '武汉大学', schId: 383 },
    { name: '浙江大学', schId: 256 },
  ];

  for (const s of tests) {
    const url = `https://gaokao.chsi.com.cn/sch/schoolInfo--schId-${s.schId}.dhtml`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(2000);

    const info = await page.evaluate(() => {
      const navLinks = [...document.querySelectorAll('a')];
      const hireLinks = navLinks.filter(a => a.textContent.includes('录取') || a.textContent.includes('分数') || a.textContent.includes('历年'));
      return {
        title: document.title.substring(0, 50),
        navCount: navLinks.length,
        hireLinks: hireLinks.map(a => ({
          text: a.textContent.trim().substring(0, 30),
          href: a.href.substring(0, 150)
        })),
        // 检查侧边栏
        sidebarItems: [...document.querySelectorAll('.left-menu a, .nav-item a, .sidebar a, [class*=\"menu\"] a')].map(a => ({
          text: a.textContent.trim().substring(0, 30),
          href: a.href.substring(0, 120)
        }))
      };
    });

    console.log(`\n=== ${s.name} (schId=${s.schId}) ===`);
    if (info.hireLinks.length > 0) {
      console.log('录取链接:');
      info.hireLinks.forEach(l => console.log(`  ${l.text}: ${l.href}`));
    } else {
      console.log('无录取链接');
    }
    if (info.sidebarItems.length > 0) {
      console.log('侧边栏:');
      info.sidebarItems.slice(0, 20).forEach(l => console.log(`  ${l.text}: ${l.href}`));
    }
  }

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });

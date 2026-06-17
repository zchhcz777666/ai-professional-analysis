/**
 * 补全缺失学校的 schId — 通过 Puppeteer 模拟搜索框输入
 */
const puppeteer = require('puppeteer');
const c = require('fs').readFileSync('scripts/crawled-data/chsi-cookie.txt', 'utf-8').trim();
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Users\\Administrator\\.cache\\puppeteer\\chrome\\win64-131.0.6778.204\\chrome-win64\\chrome.exe';
const SCHOOL_MAP_FILE = path.join(__dirname, 'crawled-data', 'chsi-school-map.json');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const map = JSON.parse(fs.readFileSync(SCHOOL_MAP_FILE, 'utf-8'));

  // 找到缺失的学校
  const u = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'universities.ts'), 'utf-8');
  const names = [...u.matchAll(/name:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const missing = names.filter(n => !map[n]);
  console.log(`缺失 ${missing.length} 所学校\n`);

  const browser = await puppeteer.launch({
    headless: false, // visible for debugging
    executablePath: CHROME_PATH,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
  
  const cookieItems = c.split(';').map(pair => {
    const [name, ...vals] = pair.trim().split('=');
    return { name, value: vals.join('='), domain: '.chsi.com.cn', path: '/' };
  });
  await page.setCookie(...cookieItems);

  // 先打开首页
  await page.goto('https://gaokao.chsi.com.cn/sch/', { waitUntil: 'networkidle2', timeout: 15000 });
  await sleep(2000);

  let found = 0;
  for (let i = 0; i < Math.min(10, missing.length); i++) {
    const name = missing[i];

    try {
      // 点击搜索框
      const searchInput = await page.$('.search-input');
      if (!searchInput) {
        console.log(`  [${i}] ${name}: 找不到搜索框`);
        continue;
      }

      // 清空并输入
      await searchInput.click({ clickCount: 3 }); // 全选
      await searchInput.type(name, { delay: 50 });
      await sleep(1500);

      // 按回车搜索
      await page.keyboard.press('Enter');
      await sleep(3000);

      // 提取结果
      const schId = await page.evaluate((schoolName) => {
        const links = document.querySelectorAll('a');
        for (const a of links) {
          const text = a.textContent.trim();
          if (text === schoolName && a.href.includes('schId-')) {
            const m = a.href.match(/schId-(\d+)/);
            return m ? parseInt(m[1]) : null;
          }
        }
        return null;
      }, name);

      if (schId) {
        map[name] = schId;
        found++;
        console.log(`  [${i + 1}/${missing.length}] ✅ ${name} => schId=${schId}`);
      } else {
        console.log(`  [${i + 1}/${missing.length}] ❌ ${name} => 未找到`);
      }

      // 保存
      fs.writeFileSync(SCHOOL_MAP_FILE, JSON.stringify(map, null, 2), 'utf-8');
    } catch (e) {
      console.log(`  [${i + 1}/${missing.length}] ${name} => ERROR ${e.message.substring(0, 80)}`);
    }

    await sleep(1000);
  }

  console.log(`\n✅ 完成! 找到 ${found} 个`);
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });

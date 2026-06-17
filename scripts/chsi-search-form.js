/**
 * 方案 B: 直接访问搜索页并输入学校名，提交表单
 */
const puppeteer = require('puppeteer');
const c = require('fs').readFileSync('scripts/crawled-data/chsi-cookie.txt', 'utf-8').trim();
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Users\\Administrator\\.cache\\puppeteer\\chrome\\win64-131.0.6778.204\\chrome-win64\\chrome.exe';
const SCHOOL_MAP_FILE = path.join(__dirname, 'crawled-data', 'chsi-school-map.json');

async function main() {
  const map = JSON.parse(fs.readFileSync(SCHOOL_MAP_FILE, 'utf-8'));
  const u = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'universities.ts'), 'utf-8');
  const names = [...u.matchAll(/name:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const missing = names.filter(n => !map[n]);
  console.log(`缺失 ${missing.length} 所学校\n`);

  const browser = await puppeteer.launch({
    headless: true,
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

  let found = 0;
  for (let i = 0; i < missing.length; i++) {
    const name = missing[i];
    try {
      // 直接访问搜索页
      await page.goto('https://gaokao.chsi.com.cn/sch/', { waitUntil: 'networkidle2', timeout: 15000 });
      await new Promise(r => setTimeout(r, 2000));

      // 找到院校名称输入框
      const input = await page.$('input[name="yxmc"]');
      if (!input) { console.log(`  [${i}] ${name}: 找不到输入框`); continue; }

      // 输入学校名
      await input.click({ clickCount: 3 });
      await input.type(name, { delay: 30 });
      await new Promise(r => setTimeout(r, 1000));

      // 提交表单
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 3000));

      // 提取 schId
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
        console.log(`  [${i}/${missing.length}] ✅ ${name} => schId=${schId}`);
      } else {
        console.log(`  [${i}/${missing.length}] ❌ ${name}: 搜索无结果`);
      }

      fs.writeFileSync(SCHOOL_MAP_FILE, JSON.stringify(map, null, 2), 'utf-8');
    } catch (e) {
      console.log(`  [${i}/${missing.length}] ${name}: ERROR ${e.message.substring(0, 60)}`);
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n✅ 完成! 找到 ${found} 个`);
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });

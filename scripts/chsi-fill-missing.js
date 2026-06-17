/**
 * 补全缺失学校的 schId — 通过关键词搜索
 */
const puppeteer = require('puppeteer');
const c = require('fs').readFileSync('scripts/crawled-data/chsi-cookie.txt', 'utf-8').trim();
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Users\\Administrator\\.cache\\puppeteer\\chrome\\win64-131.0.6778.204\\chrome-win64\\chrome.exe';
const SCHOOL_MAP_FILE = path.join(__dirname, 'crawled-data', 'chsi-school-map.json');

async function main() {
  const map = JSON.parse(fs.readFileSync(SCHOOL_MAP_FILE, 'utf-8'));

  // 找到缺失的学校
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
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
  
  const cookieItems = c.split(';').map(pair => {
    const [name, ...vals] = pair.trim().split('=');
    return { name, value: vals.join('='), domain: '.chsi.com.cn', path: '/' };
  });
  await page.setCookie(...cookieItems);

  let found = 0;
  for (let i = 0; i < missing.length; i++) {
    const name = missing[i];
    const encoded = encodeURIComponent(name);
    const url = `https://gaokao.chsi.com.cn/sch/search--ss-on,option-qg,searchType-1,keyword-${encoded},start-0.dhtml`;

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      await new Promise(r => setTimeout(r, 2000));

      const schId = await page.evaluate((schoolName) => {
        // 找到匹配学校名称的链接
        const links = document.querySelectorAll('a');
        for (const a of links) {
          const text = a.textContent.trim();
          if (text === schoolName && a.href.includes('schId-')) {
            const m = a.href.match(/schId-(\d+)/);
            return m ? parseInt(m[1]) : null;
          }
        }
        // 如果精确匹配失败，试试包含匹配
        for (const a of links) {
          const text = a.textContent.trim();
          if (text.includes(schoolName) && a.href.includes('schId-')) {
            const m = a.href.match(/schId-(\d+)/);
            return m ? parseInt(m[1]) : null;
          }
        }
        return null;
      }, name);

      if (schId) {
        map[name] = schId;
        found++;
        console.log(`  [${i + 1}/${missing.length}] ${name} => schId=${schId}`);
      } else {
        console.log(`  [${i + 1}/${missing.length}] ${name} => 未找到`);
      }
    } catch (e) {
      console.log(`  [${i + 1}/${missing.length}] ${name} => ERROR ${e.message.substring(0, 50)}`);
    }

    // 每 20 个保存一次
    if (i % 20 === 19) {
      fs.writeFileSync(SCHOOL_MAP_FILE, JSON.stringify(map, null, 2), 'utf-8');
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  // 保存
  fs.writeFileSync(SCHOOL_MAP_FILE, JSON.stringify(map, null, 2), 'utf-8');
  console.log(`\n✅ 完成! 找到 ${found} 个, 共 ${Object.keys(map).length} 个名称映射`);

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });

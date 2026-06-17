/**
 * 测试抓取一个学校的录取数据
 */
const puppeteer = require('puppeteer');
const c = require('fs').readFileSync('scripts/crawled-data/chsi-cookie.txt', 'utf-8').trim();
const fs = require('fs');
const CHROME_PATH = 'C:\\Users\\Administrator\\.cache\\puppeteer\\chrome\\win64-131.0.6778.204\\chrome-win64\\chrome.exe';

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  const cookieItems = c.split(';').map(pair => {
    const [name, ...vals] = pair.trim().split('=');
    return { name, value: vals.join('='), domain: '.chsi.com.cn', path: '/' };
  });
  await page.setCookie(...cookieItems);

  // 清华 schId=3, 武汉大学 schId=383
  const school = { id: '1002', name: '武汉大学', schId: 383 };

  // 访问学校详情页
  await page.goto(`https://gaokao.chsi.com.cn/sch/schoolInfo--schId-${school.schId}.dhtml`, { 
    waitUntil: 'networkidle2', timeout: 15000 
  });
  await new Promise(r => setTimeout(r, 2000));

  // 截图
  await page.screenshot({ path: 'scripts/crawled-data/chsi-school-info.png' });

  // 找"往年录取信息"
  const pageData = await page.evaluate(() => {
    const allText = document.body.textContent;
    const links = [...document.querySelectorAll('a')].map(a => ({
      text: a.textContent.trim().substring(0, 50),
      href: a.href
    }));
    return { hireLinks: links.filter(l => l.text.includes('录取') || l.href.includes('Hire')), allLinks: links.slice(0, 50) };
  });

  console.log('录取相关链接:');
  pageData.hireLinks.forEach(l => console.log(`  ${l.text}: ${l.href}`));

  if (pageData.hireLinks.length === 0) {
    console.log('无录取信息链接，检查所有链接');
    pageData.allLinks.forEach(l => console.log(`  ${l.text}: ${l.href.substring(0, 150)}`));
    await browser.close();
    return;
  }

  // 访问录取页面
  const hireUrl = pageData.hireLinks[0].href;
  console.log(`\n访问: ${hireUrl}`);
  await page.goto(hireUrl, { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));

  // 截图
  await page.screenshot({ path: 'scripts/crawled-data/chsi-hire-data.png' });

  // 提取录取数据
  const data = await page.evaluate(() => {
    // 所有表格
    const tables = document.querySelectorAll('table');
    const result = [];
    
    tables.forEach((table, i) => {
      const rows = table.querySelectorAll('tr');
      const headers = [...rows[0]?.querySelectorAll('th, td')].map(h => h.textContent.trim());
      const rowData = [...rows].slice(1).map(row => [...row.querySelectorAll('td')].map(cell => cell.textContent.trim()));
      result.push({ tableIndex: i, headers, rows: rowData });
    });

    return {
      tables: result,
      // 找年份标签
      yearTabs: [...document.querySelectorAll('.tab-item, .year-tab, a[href*="year"], a[href*="202"]')].map(el => ({
        text: el.textContent.trim(),
        href: el.href || ''
      })),
      // 省份/科类选择器
      selectors: [...document.querySelectorAll('select')].map(sel => ({
        id: sel.id,
        name: sel.name,
        options: [...sel.querySelectorAll('option')].map(o => ({ value: o.value, text: o.textContent.trim() }))
      })),
      // iframe
      iframes: document.querySelectorAll('iframe').length
    };
  });

  console.log('\n表格数:', data.tables.length);
  data.tables.forEach(t => console.log(`  table[${t.tableIndex}]: headers=${JSON.stringify(t.headers)}, rows=${t.rows.length}`));
  if (data.tables.length > 0) {
    console.log('\n第一行数据:', JSON.stringify(data.tables[0].rows[0]));
  }

  console.log('\n年份标签:', JSON.stringify(data.yearTabs));
  console.log('\n下拉框:', data.selectors.map(s => `${s.id}/${s.name}: ${s.options.length} 项`).join(', '));
  if (data.selectors.length > 0) {
    data.selectors.forEach(s => console.log(`  ${s.name} 选项:`, s.options.slice(0, 10).map(o => o.text).join(', ')));
  }

  // 保存页面 HTML
  const html = await page.content();
  fs.writeFileSync('scripts/crawled-data/chsi-hire-full.html', html, 'utf-8');
  console.log('\nHTML 已保存');

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });

const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const logFile = 'c:\\Users\\Administrator\\.trae-cn\\aizhuanyefengxi\\scripts\\playwright-output.txt';
  const log = (msg) => {
    fs.appendFileSync(logFile, msg + '\n');
    console.log(msg);
  };

  log('Starting Playwright test...');
  
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'zh-CN',
    viewport: { width: 1920, height: 1080 },
  });
  
  const page = await context.newPage();
  
  // Intercept ALL responses
  page.on('response', async response => {
    const url = response.url();
    const ct = response.headers()['content-type'] || '';
    
    // Only log requests that might contain data
    if (url.includes('gaokao.chsi.com.cn') && !url.includes('hm.baidu.com') && !url.includes('google')) {
      log(`RESPONSE: ${response.status()} ${ct.substring(0,50)} ${url.substring(0, 150)}`);
      
      if (ct.includes('json') || url.includes('score') || url.includes('admission') || url.includes('province')) {
        try {
          const body = await response.text();
          log(`  Body (${body.length} chars): ${body.substring(0, 1000)}`);
        } catch (e) {
          log(`  Error reading body: ${e.message}`);
        }
      }
    }
  });
  
  log('Navigating to page...');
  await page.goto('https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  
  log(`Page URL: ${page.url()}`);
  log(`Title: ${await page.title()}`);
  
  // Wait for any dynamic content
  await page.waitForTimeout(8000);
  
  log(`Final URL: ${page.url()}`);
  
  // Get page content structure
  const info = await page.evaluate(() => {
    const tables = Array.from(document.querySelectorAll('table')).map(t => ({
      class: t.className,
      id: t.id,
      innerText: t.innerText.substring(0, 200),
      rows: t.rows.length
    }));
    
    const selects = Array.from(document.querySelectorAll('select')).map(s => ({
      name: s.name,
      id: s.id,
      options: Array.from(s.options).map(o => o.text.trim())
    }));
    
    return { tables, selects, bodyText: document.body.innerText.substring(0, 3000) };
  });
  
  log(`\nTables: ${info.tables.length}`);
  info.tables.forEach(t => log(`  ${JSON.stringify(t)}`));
  
  log(`\nSelects: ${JSON.stringify(info.selects)}`);
  log(`\nBody text:\n${info.bodyText}`);
  
  await browser.close();
  log('Done');
})();
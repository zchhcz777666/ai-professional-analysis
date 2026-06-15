const { chromium } = require('playwright');

async function test() {
  console.log('Testing Playwright with Edge...');
  
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'zh-CN',
  });
  
  const page = await context.newPage();
  
  try {
    // Intercept all network requests
    const apiCalls = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('sch') || url.includes('score') || url.includes('admission') || url.includes('province') || url.includes('api')) {
        if (url !== 'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score') {
          apiCalls.push({ type: 'REQUEST', url, method: request.method() });
        }
      }
    });
    
    page.on('response', async response => {
      const url = response.url();
      if (url !== 'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score') {
        const ct = response.headers()['content-type'] || '';
        if (ct.includes('json')) {
          try {
            const body = await response.text();
            apiCalls.push({ type: 'JSON_RESPONSE', url, ct, bodyLen: body.length, body: body.substring(0, 800) });
          } catch (e) {}
        }
      }
    });
    
    console.log('Navigating...');
    await page.goto('https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    console.log('Page loaded. URL:', page.url());
    console.log('Title:', await page.title());
    
    // Check for tables in the rendered DOM
    const tables = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('table')).map(t => ({
        class: t.className,
        id: t.id,
        headerText: Array.from(t.querySelectorAll('tr:first-child th, tr:first-child td')).slice(0, 8).map(h => h.textContent.trim()).join(' | '),
        rowCount: t.querySelectorAll('tr').length,
        outerHTML: t.outerHTML.substring(0, 300)
      }));
    });
    
    console.log(`\nTables: ${tables.length}`);
    tables.forEach(t => console.log(`  class="${t.class}" id="${t.id}" headers=[${t.headerText}] rows=${t.rowCount}`));

    // If no tables, check what content exists
    if (tables.length === 0) {
      console.log('\nNo tables found. Checking page content...');
      
      // Check for score tab navigation
      const tabs = await page.evaluate(() => {
        const tabLinks = document.querySelectorAll('a[href*="tab=score"], a:has(span), .tab, [class*="tab"]');
        return Array.from(tabLinks).slice(0, 10).map(t => ({
          text: t.textContent.trim(),
          href: t.href || t.getAttribute('href') || '',
          class: t.className
        }));
      });
      console.log('Tab links:', JSON.stringify(tabs, null, 2));
      
      // Check for select dropdowns (province/year selectors)
      const selects = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('select')).map(s => ({
          name: s.name,
          id: s.id,
          options: Array.from(s.options).map(o => ({ text: o.textContent.trim(), value: o.value }))
        }));
      });
      console.log('Select dropdowns:', JSON.stringify(selects, null, 2));
    }
    
    console.log('\n\nAPI calls intercepted:');
    apiCalls.forEach((c, i) => {
      console.log(`${i+1}. [${c.type}] ${c.url.substring(0, 150)}`);
      if (c.bodyLen) console.log(`   Body: ${c.bodyLen} chars`);
      if (c.body) console.log(`   Body preview: ${c.body.substring(0, 300)}`);
    });
    
  } catch (err) {
    console.error(`Error: ${err.message}`);
  } finally {
    await browser.close();
  }
}

test();
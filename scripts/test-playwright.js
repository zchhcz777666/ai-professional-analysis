const { chromium } = require('playwright');

async function test() {
  console.log('Testing Playwright with 阳光高考...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'zh-CN',
  });
  
  const page = await context.newPage();
  
  try {
    // Intercept network requests to find the score data API
    const apiCalls = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('sch') || url.includes('score') || url.includes('admission') || url.includes('province')) {
        apiCalls.push({ url, method: request.method(), type: request.resourceType() });
      }
    });
    
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/sch/') || url.includes('score') || url.includes('admission')) {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('json') || contentType.includes('javascript')) {
          try {
            const body = await response.text();
            apiCalls.push({ url, type: 'RESPONSE', contentType, bodyLength: body.length, body: body.substring(0, 500) });
          } catch (e) {}
        }
      }
    });
    
    console.log('Navigating to page...');
    await page.goto('https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    console.log('Page loaded. URL:', page.url());
    console.log('Title:', await page.title());
    
    // Wait a bit for any lazy-loaded content
    await page.waitForTimeout(3000);
    
    // Check for tables
    const tables = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('table')).map((t, i) => ({
        id: i,
        class: t.className,
        headers: Array.from(t.querySelectorAll('tr:first-child th, tr:first-child td')).map(h => h.textContent.trim()),
        rows: t.querySelectorAll('tr').length,
        html: t.outerHTML.substring(0, 500)
      }));
    });
    
    console.log(`\nTables found: ${tables.length}`);
    tables.forEach(t => {
      console.log(`Table ${t.id}: class="${t.class}", headers=[${t.headers.join(', ').substring(0, 200)}], rows=${t.rows}`);
    });
    
    // Check for score-related content
    const scoreContent = await page.evaluate(() => {
      const body = document.body.innerText;
      const lines = body.split('\n').filter(l => l.includes('分') || l.includes('位次') || l.includes('录取') || l.includes('专业'));
      return lines.slice(0, 30);
    });
    
    console.log('\nScore-related content:');
    scoreContent.forEach(l => console.log(`  ${l}`));
    
    // Print all API calls intercepted
    console.log('\n\nIntercepted API calls:');
    apiCalls.forEach((call, i) => {
      console.log(`${i+1}. [${call.type || call.method}] ${call.url.substring(0, 150)}`);
      if (call.bodyLength) console.log(`   Body: ${call.bodyLength} chars`);
      if (call.body) console.log(`   Preview: ${call.body.substring(0, 200)}`);
    });
    
  } catch (err) {
    console.error(`Error: ${err.message}`);
  } finally {
    await browser.close();
  }
}

test();
const { chromium } = require('playwright');

async function test() {
  console.log('Testing score page with Playwright + Edge...');
  
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'zh-CN',
    viewport: { width: 1920, height: 1080 },
    bypassCSP: true,
  });
  
  const page = await context.newPage();
  
  // Collect XHR/fetch responses
  const xhrResponses = [];
  page.on('response', async response => {
    const url = response.url();
    const ct = response.headers()['content-type'] || '';
    if (ct.includes('json') || url.includes('sch/score') || url.includes('sch/admission')) {
      try {
        const body = await response.text();
        xhrResponses.push({ url: url.substring(0, 150), ct, bodyLen: body.length, body: body.substring(0, 2000) });
      } catch (e) {}
    }
  });
  
  try {
    // Try navigating directly to the score page
    console.log('Navigating to score page...');
    await page.goto('https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    console.log('URL after load:', page.url());
    console.log('Title:', await page.title());
    
    // Wait for Vue to render
    await page.waitForTimeout(5000);
    
    // Check if there's any table or score content
    const hasTable = await page.evaluate(() => document.querySelectorAll('table').length > 0);
    console.log('Tables present:', hasTable);
    
    // Check all content
    const content = await page.evaluate(() => {
      const body = document.body;
      // Get all text
      const text = body.innerText;
      
      // Find score-related lines
      const scoreLines = text.split('\n').filter(l => 
        l.includes('分') || l.includes('位次') || l.includes('录取') || l.includes('专业')
      ).slice(0, 50);
      
      // Check for selects
      const selects = Array.from(document.querySelectorAll('select')).map(s => ({
        name: s.name,
        id: s.id,
        options: Array.from(s.options).map(o => ({ text: o.textContent.trim(), value: o.value }))
      }));
      
      // Check URL search params in the rendered app
      const urlParams = new URLSearchParams(window.location.search);
      
      // Check Vue app instance
      const vueApp = document.querySelector('#app, #school-app, [data-v-app]');
      
      return { scoreLines, selects, urlParams: Object.fromEntries(urlParams), hasVueApp: !!vueApp, url: window.location.href };
    });
    
    console.log('\n=== URL params ===', JSON.stringify(content.urlParams));
    console.log('\n=== Has Vue App ===', content.hasVueApp);
    console.log('\n=== Selects ===', JSON.stringify(content.selects, null, 2));
    console.log('\n=== Score-related text ===');
    content.scoreLines.forEach(l => console.log(`  ${l}`));
    
    // If no table, try waiting more
    if (!hasTable) {
      console.log('\nWaiting additional 5 seconds...');
      await page.waitForTimeout(5000);
      
      const tables = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('table')).map(t => ({
          class: t.className,
          id: t.id,
          headers: Array.from(t.querySelectorAll('tr:first-child th, tr:first-child td')).map(h => h.textContent.trim()),
          rows: t.querySelectorAll('tr').length,
          html: t.outerHTML.substring(0, 500)
        }));
      });
      console.log('Tables after extra wait:', tables.length);
      tables.forEach(t => console.log(JSON.stringify(t, null, 2)));
    }
    
    console.log('\n\n=== XHR Responses with score data ===');
    xhrResponses.forEach((r, i) => {
      console.log(`\n${i+1}. ${r.url}`);
      console.log(`   ${r.ct}, ${r.bodyLen} chars`);
      if (r.body.length > 0) console.log(`   Body: ${r.body.substring(0, 800)}`);
    });
    
  } catch (err) {
    console.error(`Error: ${err.message}`);
  } finally {
    await browser.close();
  }
}

test();
const { chromium } = require('playwright');

async function test() {
  console.log('Testing with load event...');
  
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
  
  // Collect ALL network calls
  const jsonResponses = [];
  page.on('response', async response => {
    const ct = response.headers()['content-type'] || '';
    if (ct.includes('json')) {
      try {
        const body = await response.text();
        if (body && body.length > 50) {
          jsonResponses.push({ url: response.url(), ct, bodyLen: body.length, body: body.substring(0, 1200) });
        }
      } catch (e) {}
    }
  });
  
  try {
    // Navigate with 'load' instead of 'networkidle' to avoid timeout
    console.log('Navigating...');
    await page.goto('https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score', {
      waitUntil: 'load',
      timeout: 30000
    });
    
    // Wait additional time for any lazy-loaded content
    await page.waitForTimeout(5000);
    
    console.log('URL:', page.url());
    console.log('Title:', await page.title());
    
    // Check for tables in the page
    const pageInfo = await page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll('table')).map(t => ({
        class: t.className,
        id: t.id,
        headers: Array.from(t.querySelectorAll('tr:first-child th, tr:first-child td')).map(h => h.textContent.trim()),
        rowCount: t.querySelectorAll('tr').length,
        html: t.outerHTML.substring(0, 200)
      }));
      
      const selects = Array.from(document.querySelectorAll('select')).map(s => ({
        name: s.name,
        id: s.id,
        options: Array.from(s.options).map(o => ({ text: o.textContent.trim(), value: o.value }))
      }));
      
      const tabs = Array.from(document.querySelectorAll('[class*="tab"], [id*="tab"], a[href*="tab"]')).map(el => ({
        tag: el.tagName,
        text: el.textContent.trim().substring(0, 30),
        href: (el.href || el.getAttribute('href') || '').substring(0, 100),
        class: el.className.substring(0, 50)
      }));
      
      // Check for Vue app
      const appEl = document.querySelector('#app, [data-app], [v-app]');
      
      // Search for score-related text
      const bodyText = document.body.innerText;
      const scoreLines = bodyText.split('\n').filter(l => 
        l.includes('分') || l.includes('位次') || l.includes('录取') || l.includes('专业')
      ).slice(0, 20);
      
      return { tables, selects, tabs, hasApp: !!appEl, scoreLines };
    });
    
    console.log('\n=== Tables ===');
    console.log(JSON.stringify(pageInfo.tables, null, 2));
    
    console.log('\n=== Selects ===');
    console.log(JSON.stringify(pageInfo.selects, null, 2));
    
    console.log('\n=== Tabs ===');
    console.log(JSON.stringify(pageInfo.tabs, null, 2));
    
    console.log('\n=== Score-related text ===');
    pageInfo.scoreLines.forEach(l => console.log(`  ${l}`));
    
    console.log('\n=== JSON responses (' + jsonResponses.length + ') ===');
    jsonResponses.forEach((r, i) => {
      console.log(`\n${i+1}. ${r.url.substring(0, 120)}`);
      console.log(`   Type: ${r.ct}, ${r.bodyLen} chars`);
      console.log(`   Body: ${r.body.substring(0, 500)}`);
    });
    
    // Also try to monitor any XHR/fetch calls after the page loads
    console.log('\n=== Checking for additional script-triggered loads ===');
    await page.waitForTimeout(3000);
    
    // Try clicking tabs if found
    if (pageInfo.tabs.length > 0) {
      for (const tab of pageInfo.tabs) {
        if (tab.text.includes('分数') || tab.text.includes('录取')) {
          console.log(`\nClicking tab: ${tab.text}`);
          try {
            await page.click(`text="${tab.text}"`);
            await page.waitForTimeout(3000);
            // Check for new tables
            const newTables = await page.evaluate(() => {
              return Array.from(document.querySelectorAll('table')).map(t => ({
                class: t.className,
                headers: Array.from(t.querySelectorAll('tr:first-child th, tr:first-child td')).map(h => h.textContent.trim()),
                rowCount: t.querySelectorAll('tr').length
              }));
            });
            console.log('New tables after click:', JSON.stringify(newTables, null, 2));
            
            // Check for score data
            const newScoreData = await page.evaluate(() => {
              const body = document.body.innerText;
              return body.split('\n').filter(l => 
                l.includes('分') || l.includes('位次') || l.includes('录取')
              ).slice(0, 30);
            });
            newScoreData.forEach(l => console.log(`  ${l}`));
          } catch (e) {
            console.log(`Error clicking: ${e.message}`);
          }
        }
      }
    }
    
  } catch (err) {
    console.error(`Error: ${err.message}`);
  } finally {
    await browser.close();
  }
}

test();
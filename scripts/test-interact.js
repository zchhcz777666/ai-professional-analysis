const { chromium } = require('playwright');

async function test() {
  console.log('Testing with interactive approach...');
  
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
    // Intercept ALL requests (not just filtered ones)
    const allRequests = [];
    const jsonResponses = [];
    
    page.on('request', request => {
      allRequests.push({ url: request.url(), method: request.method(), type: request.resourceType() });
    });
    
    page.on('response', async response => {
      const ct = response.headers()['content-type'] || '';
      if (ct.includes('json')) {
        try {
          const body = await response.text();
          jsonResponses.push({ url: response.url(), bodyLen: body.length, body: body.substring(0, 1000) });
        } catch (e) {}
      }
    });
    
    // Step 1: Navigate to the school main page
    console.log('Navigating to school main page...');
    await page.goto('https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    console.log('Main page loaded.');
    
    // Step 2: Try to find and click the 录取分数 tab
    console.log('\nLooking for score tab...');
    
    // Try various selectors
    const tabInfo = await page.evaluate(() => {
      // Find all links/buttons
      const allLinks = Array.from(document.querySelectorAll('a, button, span, li, div[class*="tab"], div[class*="nav"], div[class*="menu"]'));
      return allLinks
        .filter(el => {
          const text = el.textContent.trim();
          return text.includes('分数') || text.includes('录取') || text.includes('历年') || text.includes('score');
        })
        .map(el => ({
          tag: el.tagName,
          text: el.textContent.trim().substring(0, 50),
          href: el.href || el.getAttribute('href') || '',
          class: el.className,
          id: el.id
        }));
    });
    
    console.log('Score-related elements found:', JSON.stringify(tabInfo, null, 2));
    
    if (tabInfo.length === 0) {
      // No score tab found, let's look at all navigation elements
      console.log('\nNo score tab found. Looking at all navigation...');
      const navItems = await page.evaluate(() => {
        const items = document.querySelectorAll('a, .nav-item, [class*="tab"], li');
        return Array.from(items).slice(0, 30).map(el => ({
          tag: el.tagName,
          text: el.textContent.trim().substring(0, 30),
          href: (el.href || '').substring(0, 100),
          class: (el.className || '').substring(0, 50)
        }));
      });
      console.log('Navigation items:', JSON.stringify(navItems, null, 2));
    } else {
      // Click the score tab
      for (const tab of tabInfo) {
        if (tab.href) {
          console.log(`Navigating to: ${tab.href}`);
          await page.goto(tab.href, { waitUntil: 'networkidle', timeout: 30000 });
          break;
        }
      }
    }
    
    // Step 3: Check page after clicking score tab
    await page.waitForTimeout(3000);
    
    console.log('\nCurrent URL:', page.url());
    console.log('Title:', await page.title());
    
    // Check for selects (province, year dropdowns)
    const selects = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('select')).map(s => ({
        name: s.name,
        id: s.id,
        options: Array.from(s.options).map(o => ({ text: o.textContent.trim(), value: o.value }))
      }));
    });
    console.log('\nSelect dropdowns:', JSON.stringify(selects, null, 2));
    
    // Check for tables
    const tables = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('table')).map(t => ({
        class: t.className,
        id: t.id,
        headers: Array.from(t.querySelectorAll('tr:first-child th, tr:first-child td')).map(h => h.textContent.trim()),
        rowCount: t.querySelectorAll('tr').length
      }));
    });
    console.log('\nTables:', JSON.stringify(tables, null, 2));
    
    // Print all requests
    console.log('\n\nAll requests:');
    allRequests.forEach((r, i) => console.log(`${i+1}. [${r.type}] ${r.method} ${r.url.substring(0, 150)}`));
    
    console.log('\n\nJSON responses:');
    jsonResponses.forEach((r, i) => console.log(`${i+1}. ${r.url.substring(0, 100)} (${r.bodyLen} chars)`));
    
  } catch (err) {
    console.error(`Error: ${err.message}`);
  } finally {
    await browser.close();
  }
}

test();
const { chromium } = require('playwright');

async function test() {
  console.log('Testing with stealth config...');
  
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-web-security'
    ]
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'zh-CN',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    // Set extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    },
    // Bypass webdriver check
    bypassCSP: true,
  });
  
  const page = await context.newPage();
  
  // Hide webdriver
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh'] });
  });
  
  try {
    console.log('Navigating...');
    await page.goto('https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    console.log('URL:', page.url());
    console.log('Title:', await page.title());
    
    // Get page content
    const html = await page.content();
    console.log(`HTML length: ${html.length}`);
    
    // Look for score-related content
    const hasScoreContent = html.includes('录取分数') || html.includes('最低分') || html.includes('平均分');
    console.log(`Has score content: ${hasScoreContent}`);
    
    // Check for tables
    const tables = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('table')).map(t => ({
        class: t.className,
        headers: Array.from(t.querySelectorAll('tr:first-child th, tr:first-child td')).map(h => h.textContent.trim()),
        rowCount: t.querySelectorAll('tr').length
      }));
    });
    console.log(`Tables: ${tables.length}`);
    
    // Check selects
    const selects = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('select')).map(s => ({
        name: s.name,
        id: s.id,
        options: Array.from(s.options).map(o => ({ text: o.textContent.trim(), value: o.value }))
      }));
    });
    console.log('Selects:', JSON.stringify(selects, null, 2));
    
    // Get visible text
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Body text (first 1000 chars):', bodyText.substring(0, 1000));
    
  } catch (err) {
    console.error(`Error: ${err.message}`);
  } finally {
    await browser.close();
  }
}

test();
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  // Capture all XHR/fetch calls
  const apiCalls = [];
  page.on('request', req => {
    if (req.resourceType() === 'xhr' || req.resourceType() === 'fetch') {
      apiCalls.push({
        url: req.url().substring(0, 300),
        method: req.method(),
        type: req.resourceType()
      });
    }
  });

  // Navigate to Tsinghua page on gaokao.cn  
  console.log('Navigating to https://www.gaokao.cn/school/140');
  try {
    await page.goto('https://www.gaokao.cn/school/140', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(5000);
  } catch (e) {
    console.log('Navigation timeout/error:', e.message.substring(0, 100));
  }

  console.log('\n=== XHR/Fetch API calls ===');
  apiCalls.forEach(c => console.log(`  ${c.method} ${c.type} ${c.url}`));

  // Also try to navigate to the score subsection
  console.log('\n\nNavigating to score tab...');
  try {
    await page.goto('https://www.gaokao.cn/school/140/score', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(5000);
  } catch (e) {
    console.log('Score page error:', e.message.substring(0, 100));
  }

  console.log('\n=== Score tab XHR/Fetch API calls ===');
  apiCalls.filter(c => c.url.includes('score') || c.url.includes('special') || c.url.includes('admission')).forEach(c => console.log(`  ${c.method} ${c.type} ${c.url}`));

  await browser.close();
  console.log('\nDone');
})();

const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  // Capture all XHR calls  
  const apiCalls = [];
  page.on('request', req => {
    if (req.resourceType() === 'xhr' || req.resourceType() === 'fetch') {
      apiCalls.push({
        url: req.url().substring(0, 350),
        method: req.method(),
        postData: req.postData()?.substring(0, 200) || ''
      });
    }
  });

  // Navigate to score tab page
  console.log('Navigating to score tab...');
  try {
    await page.goto('https://www.gaokao.cn/school/140/score', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    // Wait for dynamic content
    await page.waitForTimeout(8000);
  } catch (e) {
    console.log('Timeout:', e.message.substring(0, 80));
  }

  console.log('\n=== All XHR/Fetch calls ===');
  apiCalls.forEach(c => {
    if (c.postData) {
      console.log(`  ${c.method} ${c.url}`);
      console.log(`    POST: ${c.postData}`);
    } else {
      console.log(`  ${c.method} ${c.url}`);
    }
  });

  // Check page content
  const content = await page.evaluate(() => {
    return {
      title: document.title,
      textSample: document.body?.textContent?.substring(0, 3000) || '',
      hasScoreContent: (document.body?.textContent || '').includes('分数') || (document.body?.textContent || '').includes('录取')
    };
  });
  console.log(`\n=== Page content ===`);
  console.log(`Title: ${content.title}`);
  console.log(`Has score/录取 keywords: ${content.hasScoreContent}`);
  console.log(`Text: ${content.textSample.substring(0, 1000)}`);

  await browser.close();
})();

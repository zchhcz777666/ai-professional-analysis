const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  // 捕获所有 POST 请求（API 调用）
  const apiCalls = [];
  page.on('request', req => {
    if (req.method() === 'POST' || req.url().includes('zjzw') || req.url().includes('scoreline') || req.url().includes('samescore')) {
      apiCalls.push({
        url: req.url(),
        method: req.method(),
        postData: req.postData(),
        headers: req.headers()
      });
    }
  });

  // 先获取学校映射
  const schoolMap = JSON.parse(fs.readFileSync('gaokao-school-map.json', 'utf-8'));

  // 导航到清华大学的历年分数页
  console.log('Navigating to school score page...');
  await page.goto('https://www.gaokao.cn/school/140/score', {
    waitUntil: 'networkidle',
    timeout: 60000
  });
  await page.waitForTimeout(5000);

  // 截图看看页面
  await page.screenshot({ path: 'gaokao-score-page.png', fullPage: true });

  // 打印捕获到的API
  console.log('\n=== Captured API calls during initial load ===');
  apiCalls.forEach((c, i) => {
    console.log(i + ': [' + c.method + '] ' + c.url.substring(0, 200));
    if (c.postData) console.log('   POST: ' + c.postData.substring(0, 300));
  });

  // 尝试点击不同的年份/省份tab，看触发什么API
  // 查找页面上的选择器
  const pageContent = await page.evaluate(() => {
    // 找所有下拉框
    const selects = document.querySelectorAll('select');
    const selectInfo = Array.from(selects).map(s => ({
      id: s.id,
      name: s.name,
      className: s.className,
      options: Array.from(s.options).slice(0, 5).map(o => ({ value: o.value, text: o.text }))
    }));
    
    // 找所有按钮/链接
    const links = document.querySelectorAll('a, button, [role="tab"]');
    const linkInfo = [];
    links.forEach(l => {
      const text = l.textContent.trim();
      if (text && text.length < 20) linkInfo.push({ text, tag: l.tagName, href: l.href || '' });
    });
    
    return { selects: selectInfo, links: linkInfo.slice(0, 50) };
  });

  console.log('\n=== Page elements ===');
  console.log('Selects:', JSON.stringify(pageContent.selects, null, 2));
  console.log('Links (first 30):', JSON.stringify(pageContent.links.slice(0, 30), null, 2));

  await browser.close();
})();

/**
 * 阳光志愿数据采集脚本（Puppeteer 半自动版）
 *
 * 流程:
 *   1. 打开可见浏览器 → 导航到 gaokao.chsi.com.cn
 *   2. 你手动登录学信网账号
 *   3. 脚本检测到登录后 → 探索阳光志愿平台结构
 *   4. 截图 + 保存页面数据供分析
 *
 * 使用: node scripts/chsi-scraper-puppeteer.js
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'scripts', 'crawled-data');
const SS_DIR = path.join(DATA_DIR, 'chsi-screenshots');
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

async function saveScreenshot(page, name) {
  await page.screenshot({ path: path.join(SS_DIR, name), fullPage: false });
  console.log(`  📸 截图已保存: ${name}`);
}

async function main() {
  console.log('=== 阳光志愿数据采集（Puppeteer）===\n');

  // 使用已下载的 Chrome
  const chromePath = path.join(
    process.env.USERPROFILE, '.cache', 'puppeteer', 'chrome',
    'win64-131.0.6778.204', 'chrome-win64', 'chrome.exe'
  );
  console.log(`Chrome: ${chromePath}`);

  const browser = await puppeteer.launch({
    headless: false,  // 可见窗口，你手动登录
    executablePath: chromePath,
    args: ['--no-sandbox', '--window-size=1280,900'],
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

  // ====== Phase 1: 导航 + 登录 ======
  console.log('\n📌 Phase 1: 导航到阳光高考');
  await page.goto('https://gaokao.chsi.com.cn/', { waitUntil: 'networkidle2', timeout: 30000 });
  await saveScreenshot(page, '01-homepage.png');

  // 点击登录
  const loginBtn = page.locator('a.head-login');
  if ((await loginBtn.count()) > 0) {
    console.log('点击登录按钮...');
    await loginBtn.click();
    await page.waitForTimeout(3000);
    await saveScreenshot(page, '02-login-page.png');
  }

  console.log('\n⏳ 请在浏览器中手动登录学信网账号...');
  console.log('   登录完成后脚本会自动检测并继续。\n');

  // 等待登录
  let loggedIn = false;
  for (let i = 0; i < 120; i++) {
    await page.waitForTimeout(5000);
    const cookies = await page.cookies();
    const currentUrl = page.url();
    const hasSession = cookies.some(c =>
      /session|token|JSESSIONID/i.test(c.name)
    );
    const onMain = currentUrl.includes('gaokao.chsi.com.cn') && !currentUrl.includes('login');

    if (hasSession || onMain) {
      loggedIn = true;
      console.log(`✅ 登录成功！URL: ${currentUrl}`);
      break;
    }
    if (i % 12 === 0) process.stdout.write('.');
  }

  if (!loggedIn) {
    console.log('\n⚠️ 登录超时，继续尝试...');
  }

  // ====== Phase 2: 探索阳光志愿 ======
  console.log('\n📌 Phase 2: 探索阳光志愿');

  // 1. 先看首页（登录后界面不同）
  await page.goto('https://gaokao.chsi.com.cn/', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForTimeout(3000);
  await saveScreenshot(page, '03-after-login.png');
  await saveHtml(page, '03-after-login.html');
  console.log(`URL: ${page.url()}`);

  // 2. 访问阳光志愿
  const urls = [
    'https://gaokao.chsi.com.cn/zyck/',
    'https://gaokao.chsi.com.cn/zyk/',
    'https://gaokao.chsi.com.cn/zyk/zybk/',
  ];
  for (const url of urls) {
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
      await page.waitForTimeout(2000);
      const name = url.replace(/https?:\/\/[^/]+\//, '').replace(/[/\\]/g, '_');
      await saveScreenshot(page, `04-${name}.png`);
      await saveHtml(page, `04-${name}.html`);
      console.log(`  ${url} → OK`);
    } catch (e) {
      console.log(`  ${url} → ${e.message.slice(0, 50)}`);
    }
  }

  // 3. 提取页面内容
  const pageInfo = await page.evaluate(() => ({
    title: document.title,
    links: [...document.querySelectorAll('a[href]')].map(a => ({
      text: a.textContent.trim().substring(0, 60),
      href: a.getAttribute('href'),
    })).filter(l => l.text || l.href),
    buttons: [...document.querySelectorAll('button, .btn, .card, .menu-item, [role="button"]')].map(b => ({
      text: b.textContent.trim().substring(0, 60),
      class: b.className?.substring(0, 40) || '',
    })).filter(b => b.text.length > 2),
  }));
  fs.writeFileSync(path.join(SS_DIR, '05-page-info.json'), JSON.stringify(pageInfo, null, 2), 'utf-8');
  console.log(`\n页面信息已保存（${pageInfo.links.length} 个链接，${pageInfo.buttons.length} 个按钮）`);

  // 打印关键链接
  const keyTerms = ['院校', '学校', '分数', '录取', '数据', 'school', 'score', 'province'];
  const matched = pageInfo.links.filter(l =>
    keyTerms.some(t => l.text.includes(t) || (l.href || '').includes(t))
  );
  console.log('\n数据相关链接:');
  matched.slice(0, 20).forEach(l => console.log(`  [${l.text}] → ${l.href || '(none)'}`));

  console.log('\n✅ 探索完成！数据保存在:', SS_DIR);
  console.log('浏览器保持打开，请查看截图告诉我阳光志愿的入口位置。');
  console.log('按 Ctrl+C 退出...\n');

  await page.waitForTimeout(600000);
  await browser.close();
}

async function saveHtml(page, name) {
  const html = await page.content();
  fs.writeFileSync(path.join(SS_DIR, name), html, 'utf-8');
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});

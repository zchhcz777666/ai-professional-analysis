/**
 * 阳光志愿数据采集脚本（Playwright 半自动版）
 *
 * 运行方式: 
 *   1. node scripts/chsi-scraper.js
 *   2. 在打开的浏览器中手动登录学信网
 *   3. 脚本检测到登录后自动开始采集
 *
 * 流程:
 *   Phase 1 - 登录 + 探索平台结构（截图保存供分析）
 *   Phase 2 - 批量采集各大学录取数据
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'scripts', 'crawled-data');
const SCREENSHOT_DIR = path.join(DATA_DIR, 'chsi-screenshots');
const UNI_TS_FILE = path.join(__dirname, '..', 'src', 'data', 'universities.ts');
const OUTPUT_FILE = path.join(DATA_DIR, 'chsi-records.json');

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// 加载我们的大学列表
function loadUniversities() {
  const content = fs.readFileSync(UNI_TS_FILE, 'utf-8');
  const map = {};
  const ids = [...content.matchAll(/id:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const names = [...content.matchAll(/name:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  for (let i = 0; i < Math.min(ids.length, names.length); i++) map[names[i]] = ids[i];
  return map; // { '清华大学': 'tsinghua', ... }
}

async function main() {
  console.log('=== 阳光志愿数据采集 ===\n');
  const uniMap = loadUniversities();
  console.log(`已加载 ${Object.keys(uniMap).length} 所大学`);

  console.log('启动浏览器...');
  const browser = await chromium.launch({
    headless: false,  // 可见窗口，让你手动登录
    args: ['--window-size=1280,900'],
  });

  const context = await browser.newContext({
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  // ====== Phase 1: 登录 ======
  console.log('\n📌 Phase 1: 登录');
  console.log('正在打开阳光高考首页...');
  await page.goto('https://gaokao.chsi.com.cn/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-homepage.png') });

  // 点击登录按钮
  const loginBtn = page.locator('a.head-login');
  const loginBtnCount = await loginBtn.count();
  if (loginBtnCount > 0) {
    console.log('点击登录按钮...');
    await loginBtn.first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-login-page.png') });
  }

  console.log('\n⏳ 请在浏览器中手动登录学信网账号...');
  console.log('   登录完成后，脚本会自动检测并继续。');
  console.log('   (如果登录页面跳转异常，可手动在浏览器中操作)\n');

  // 等待登录完成（检测 URL 变化或 Cookie 出现）
  let loggedIn = false;
  for (let i = 0; i < 120; i++) {  // 最多等 10 分钟
    await page.waitForTimeout(5000);
    const currentUrl = page.url();
    const cookies = await context.cookies();

    // 检测是否登录成功：URL 回到主站 or 有学信网登录 cookie
    const hasSessionCookie = cookies.some(c =>
      c.name.includes('session') || c.name.includes('token') || c.name.includes('JSESSIONID')
    );
    const backToMain = currentUrl.includes('gaokao.chsi.com.cn') && !currentUrl.includes('login');

    if (hasSessionCookie || backToMain) {
      loggedIn = true;
      console.log(`✅ 登录检测成功！（URL: ${currentUrl}）`);
      break;
    }

    if (i % 6 === 0) process.stdout.write('.');  // 每 30 秒一个点
  }

  if (!loggedIn) {
    console.log('\n⚠️ 登录检测超时（10分钟），请确认是否已登录。');
    const confirm = await page.evaluate(() => confirm('您已登录了吗？点击确定继续，取消退出。'));
    if (!confirm) {
      await browser.close();
      console.log('已退出');
      process.exit(0);
    }
  }

  // ====== Phase 2: 探索阳光志愿 ======
  console.log('\n📌 Phase 2: 探索阳光志愿平台');
  
  // 导航到阳光志愿
  console.log('导航到阳光志愿...');
  await page.goto('https://gaokao.chsi.com.cn/zyck/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-sunshine-dashboard.png') });
  console.log(`当前 URL: ${page.url()}`);

  // 截图并保存页面 HTML
  const bodyHtml = await page.content();
  fs.writeFileSync(path.join(SCREENSHOT_DIR, '04-dashboard.html'), bodyHtml, 'utf-8');
  console.log(`页面 HTML 已保存 (${(bodyHtml.length / 1024).toFixed(1)} KB)`);

  // 找所有链接
  const allLinks = await page.evaluate(() => {
    return [...document.querySelectorAll('a[href]')].map(a => ({
      text: a.textContent.trim().substring(0, 50),
      href: a.getAttribute('href'),
    }));
  });
  
  const dataLinks = allLinks.filter(l =>
    /分数|录取|数据|院校|学校|score|school|province/i.test(l.text + l.href)
  );
  console.log('数据相关链接:', dataLinks.slice(0, 20));

  // 找所有按钮/卡片
  const allButtons = await page.evaluate(() => {
    return [...document.querySelectorAll('a, button, .card, .item, .menu-item, li')].map(el => ({
      text: el.textContent.trim().substring(0, 60),
      class: el.className?.substring(0, 50) || '',
      tag: el.tagName,
    })).filter(el => el.text.length > 0);
  });
  console.log('页面元素（前30）:', allButtons.filter(b => b.text.length > 2).slice(0, 30));

  // 保存完整链接列表
  fs.writeFileSync(path.join(SCREENSHOT_DIR, '05-all-links.json'), JSON.stringify(allLinks, null, 2), 'utf-8');

  console.log(`\n✅ 探索完成！截图和页面数据已保存到: ${SCREENSHOT_DIR}`);
  console.log('请告诉我页面上你看到的内容，特别是"录取分数线"或"院校数据"的入口位置。');
  console.log('然后我会改进脚本进行数据采集。\n');

  // 保持浏览器打开，让用户查看
  console.log('浏览器保持打开中，按 Ctrl+C 退出...');
  await page.waitForTimeout(600000); // 等 10 分钟
  await browser.close();
}

main().catch(err => {
  console.error('错误:', err);
  process.exit(1);
});

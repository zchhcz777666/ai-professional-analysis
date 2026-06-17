/**
 * 阳光志愿 Cookie 导入 + 平台探索脚本
 *
 * 使用方式:
 *   1. 在浏览器中登录 gaokao.chsi.com.cn（学信网账号）
 *   2. F12 → Application → Cookies → 复制所有 Cookie 值字符串
 *   3. 粘贴到终端
 *   4. 脚本自动探索平台结构，寻找数据 API
 */
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'scripts', 'crawled-data');
const EXPLORE_DIR = path.join(DATA_DIR, 'chsi-explore');
if (!fs.existsSync(EXPLORE_DIR)) fs.mkdirSync(EXPLORE_DIR, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer); }));
}

async function fetchWithCookies(url, cookieStr) {
  const r = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Cookie': cookieStr,
      'Referer': 'https://gaokao.chsi.com.cn/',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
    redirect: 'follow',
  });
  const text = await r.text();
  return { url: r.url, status: r.status, headers: Object.fromEntries(r.headers), text };
}

async function main() {
  console.log('=== 阳光志愿 Cookie 探索脚本 ===\n');

  // 1. 获取 Cookie
  console.log('📌 第一步：请导出学信网登录 Cookie');
  console.log('   操作步骤:');
  console.log('   1) 用 Chrome/Edge 打开 https://gaokao.chsi.com.cn/');
  console.log('   2) 登录学信网账号');
  console.log('   3) 按 F12 打开开发者工具');
  console.log('   4) 转到 Application → Cookies');
  console.log('   5) 任选一个 Cookie，右键 → 复制全部 → 粘贴到下面\n');
  console.log('   或者直接粘贴 Cookie 字符串（格式如: name=value; name2=value2）');

  const cookieStr = await ask('\nCookie > ');
  if (!cookieStr || cookieStr.length < 10) {
    console.log('❌ Cookie 无效，退出');
    process.exit(1);
  }
  console.log(`✅ Cookie 已接收 (${cookieStr.length} 字符)\n`);

  // 2. 探索各页面
  const exploreUrls = [
    { name: '01-homepage', url: 'https://gaokao.chsi.com.cn/' },
    { name: '02-sunshine', url: 'https://gaokao.chsi.com.cn/zyck/' },
    { name: '03-schoollib', url: 'https://gaokao.chsi.com.cn/zyk/zybk/' },
  ];

  console.log('📌 第二步：探索平台页面结构\n');
  for (const item of exploreUrls) {
    console.log(`抓取: ${item.name}...`);
    try {
      const result = await fetchWithCookies(item.url, cookieStr);
      const filePath = path.join(EXPLORE_DIR, `${item.name}.html`);
      fs.writeFileSync(filePath, result.text, 'utf-8');
      console.log(`  URL: ${result.url}`);
      console.log(`  Status: ${result.status}`);
      console.log(`  大小: ${(result.text.length / 1024).toFixed(1)} KB`);
      console.log(`  已保存: ${filePath}\n`);
    } catch (e) {
      console.log(`  ❌ 错误: ${e.message}\n`);
    }
  }

  // 3. 分析 HTML 找数据入口
  console.log('📌 第三步：分析页面结构找数据入口\n');
  for (const item of exploreUrls) {
    const filePath = path.join(EXPLORE_DIR, `${item.name}.html`);
    if (!fs.existsSync(filePath)) continue;
    const html = fs.readFileSync(filePath, 'utf-8');

    // 提取所有 JavaScript/API 调用
    const apiCalls = [];
    // 找 fetch / axios / $.ajax / url 等
    const patterns = [
      /fetch\s*\(\s*['"]([^'"]+)['"]/g,
      /url:\s*['"]([^'"]+)['"]/g,
      /apiUrl\s*[:=]\s*['"]([^'"]+)['"]/g,
      /action=["']([^"']+)["']/g,
      /href=["']([^"']+)["']/g,
    ];
    for (const pat of patterns) {
      let m;
      while ((m = pat.exec(html)) !== null) {
        const u = m[1];
        if (u && u.length > 5 && u.length < 200) apiCalls.push(u);
      }
    }

    // 找 API 关键词
    const scoreRelated = apiCalls.filter(u =>
      /score|school|province|query|search|list|data|api|json|录取|院校|分数|学校/i.test(u)
    );

    console.log(`${item.name}: ${apiCalls.length} 个链接/调用, ${scoreRelated.length} 个数据相关`);
    if (scoreRelated.length > 0) {
      scoreRelated.slice(0, 10).forEach(u => console.log(`  → ${u.substring(0, 120)}`));
    }

    // 保存 API 列表
    fs.writeFileSync(
      path.join(EXPLORE_DIR, `${item.name}-links.json`),
      JSON.stringify([...new Set(apiCalls)], null, 2),
      'utf-8'
    );
    console.log('');
  }

  console.log('✅ 探索完成！数据保存在:', EXPLORE_DIR);
  console.log('请查看输出中的"数据相关"链接，告诉我哪些看起来像录取数据 API。');
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });

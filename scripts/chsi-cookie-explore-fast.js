/**
 * 快速分析 Cookie 并探索阳光志愿 API
 * 从 scripts/crawled-data/chsi-cookie.txt 读取 Cookie
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'scripts', 'crawled-data');
const EXPLORE_DIR = path.join(DATA_DIR, 'chsi-explore');
if (!fs.existsSync(EXPLORE_DIR)) fs.mkdirSync(EXPLORE_DIR, { recursive: true });

const cookiePath = path.join(DATA_DIR, 'chsi-cookie.txt');
if (!fs.existsSync(cookiePath)) {
  console.error('❌ Cookie 文件不存在，请先粘贴 Cookie');
  process.exit(1);
}

const COOKIE = fs.readFileSync(cookiePath, 'utf-8').trim();
console.log(`✅ 已加载 Cookie (${COOKIE.length} 字符)`);

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

async function fetchPage(url) {
  const r = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Cookie': COOKIE,
      'Referer': 'https://gaokao.chsi.com.cn/',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
    redirect: 'follow',
  });
  return { url: r.url, status: r.status, text: await r.text() };
}

function findApiCalls(html) {
  const results = new Set();
  // 找 fetch/ajax/axios/url 调用
  const patterns = [
    /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /url:\s*['"`]([^'"`]+)['"`]/g,
    /"url"\s*:\s*"([^"]+)"/g,
    /href="([^"]+)"/g,
    /action="([^"]+)"/g,
    /src="([^"]+)"/g,
  ];
  for (const pat of patterns) {
    let m;
    while ((m = pat.exec(html)) !== null) {
      const u = m[1].trim();
      if (u && u.length > 5 && u.length < 300 && !u.startsWith('data:') && !u.startsWith('javascript:')) {
        results.add(u);
      }
    }
  }
  return [...results];
}

async function main() {
  console.log('\n=== 探索阳光志愿平台 ===\n');

  const pages = [
    { name: '首页', url: 'https://gaokao.chsi.com.cn/' },
    { name: '阳光志愿', url: 'https://gaokao.chsi.com.cn/zyck/' },
    { name: '院校库', url: 'https://gaokao.chsi.com.cn/zyk/zybk/' },
    { name: '专业库', url: 'https://gaokao.chsi.com.cn/zyk/zybk/zyjd/listPage' },
  ];

  for (const page of pages) {
    console.log(`📄 ${page.name} (${page.url})`);
    try {
      const res = await fetchPage(page.url);
      console.log(`  状态: ${res.status}, 大小: ${(res.text.length/1024).toFixed(1)} KB`);

      // 保存 HTML
      const safeName = page.name.replace(/[/\\]/g, '_');
      fs.writeFileSync(path.join(EXPLORE_DIR, `${safeName}.html`), res.text, 'utf-8');

      // 提取 API 调用
      const calls = findApiCalls(res.text);
      const dataCalls = calls.filter(u =>
        /api|json|score|school|province|college|query|search|list|page|data|录取|院校|分数|学校|投档/i.test(u)
      );

      console.log(`  链接/调用总数: ${calls.length}`);
      console.log(`  数据相关: ${dataCalls.length}`);

      if (dataCalls.length > 0) {
        dataCalls.slice(0, 15).forEach(u => console.log(`    🔗 ${u.substring(0, 120)}`));
      }
      console.log();
    } catch (e) {
      console.log(`  ❌ ${e.message}\n`);
    }
  }

  // 尝试常见数据 API 端点
  console.log('=== 尝试数据 API 端点 ===\n');
  const apis = [
    // 阳光志愿可能的 API
    { name: '院校录取数据', url: 'https://gaokao.chsi.com.cn/api/school/score/list' },
    { name: '省份录取线', url: 'https://gaokao.chsi.com.cn/api/province/score/list' },
    { name: '院校列表', url: 'https://gaokao.chsi.com.cn/api/school/list' },
    { name: '搜索 API', url: 'https://gaokao.chsi.com.cn/api/search/school' },
    // 其他可能
    { name: 'zyck API', url: 'https://gaokao.chsi.com.cn/zyck/api/school/list' },
    { name: 'score API v1', url: 'https://gaokao.chsi.com.cn/zyck/api/score/list' },
    { name: 'score API v2', url: 'https://gaokao.chsi.com.cn/zyk/api/score/list' },
  ];

  for (const api of apis) {
    try {
      const r = await fetch(api.url, {
        headers: {
          'User-Agent': UA,
          'Cookie': COOKIE,
          'Referer': 'https://gaokao.chsi.com.cn/',
          'Accept': 'application/json, text/plain, */*',
        },
      });
      const text = await r.text();
      const isJson = text.startsWith('{') || text.startsWith('[');
      console.log(`${api.name}: ${r.status} ${isJson ? '✅ JSON' : '⛔ ' + text.substring(0, 60)}`);
      if (isJson) {
        // 保存返回的 JSON
        fs.writeFileSync(path.join(EXPLORE_DIR, `api-${api.name}.json`), text, 'utf-8');
      }
    } catch (e) {
      console.log(`${api.name}: ❌ ${e.message}`);
    }
  }

  console.log('\n✅ 探索完成！结果保存在:', EXPLORE_DIR);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });

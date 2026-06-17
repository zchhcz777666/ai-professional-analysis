/**
 * 阳光高考录取数据探索脚本
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'crawled-data');
const COOKIE = fs.readFileSync(path.join(DATA_DIR, 'chsi-cookie.txt'), 'utf-8').trim();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

async function fetchWithCookie(url, extraHeaders = {}) {
  const r = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Cookie': COOKIE,
      'Referer': 'https://gaokao.chsi.com.cn/',
      ...extraHeaders,
    },
    timeout: 15000,
  });
  return { status: r.status, text: await r.text(), url: r.url };
}

async function main() {
  console.log('=== 阳光高考录取数据探索 ===\n');

  // 1. 搜索页面
  console.log('1️⃣ 院校搜索页面');
  const r1 = await fetchWithCookie('https://gaokao.chsi.com.cn/sch/search--ss-on,option-qg,searchType-1,start-0.dhtml');
  console.log(`  状态: ${r1.status}, 大小: ${(r1.text.length/1024).toFixed(1)} KB`);

  // 保存样本
  fs.writeFileSync(path.join(DATA_DIR, 'chsi-search.html'), r1.text, 'utf-8');

  // 找学校列表链接
  const schoolLinks = [...r1.text.matchAll(/href="([^"]*(?:schId|schoolId|schoolInfo)[^"]*)"/g)].map(m => m[1]);
  const nameMatches = [...r1.text.matchAll(/([\u4e00-\u9fa5]{2,10}(?:大学|学院|学校))/g)].map(m => m[1]);
  console.log(`  学校链接: ${schoolLinks.length}, 校名出现: ${[...new Set(nameMatches)].length}`);

  // 2. 学校详情页面 — 清华
  console.log('\n2️⃣ 清华大学详情页');
  const r2 = await fetchWithCookie('https://gaokao.chsi.com.cn/sch/schoolInfo--schId-1003.dhtml');
  console.log(`  状态: ${r2.status}, 大小: ${(r2.text.length/1024).toFixed(1)} KB`);
  fs.writeFileSync(path.join(DATA_DIR, 'chsi-tsinghua.html'), r2.text, 'utf-8');

  // 找录取数据入口
  const scoreLinks = [...r2.text.matchAll(/href="([^"]*)"[\s>]*([^<]{0,30}(?:分数|录取|投档|历年|score|luqu)[^<]{0,10})/gi)].map(m => `${m[2]} → ${m[1]}`);
  console.log('  录取数据入口:');
  scoreLinks.slice(0, 10).forEach(l => console.log(`    ${l}`));

  // 找 JS 中的 API 调用
  const apis = [...r2.text.matchAll(/['"`](https?:\/\/[^'"`]*(?:api|ajax|json|score|school|data)[^'"`]*)['"`]/gi)].map(m => m[1]);
  if (apis.length) {
    console.log('  API 调用:');
    [...new Set(apis)].slice(0, 10).forEach(a => console.log(`    ${a}`));
  }

  // 3. 尝试阳光志愿的具体功能页面
  console.log('\n3️⃣ 阳光志愿功能探索');
  const zyPages = [
    { name: '我的志愿', url: 'https://gaokao.chsi.com.cn/zyck/zyckIndex.do' },
    { name: '院校数据', url: 'https://gaokao.chsi.com.cn/zyck/schoolData.do' },
    { name: '数据查询', url: 'https://gaokao.chsi.com.cn/zyck/query.do' },
  ];
  for (const p of zyPages) {
    try {
      const r = await fetchWithCookie(p.url);
      console.log(`  ${p.name}: ${r.status} ${(r.text.length/1024).toFixed(1)} KB`);
      fs.writeFileSync(path.join(DATA_DIR, `chsi-${p.name}.html`), r.text, 'utf-8');
    } catch (e) {
      console.log(`  ${p.name}: ❌ ${e.message}`);
    }
  }

  // 4. 尝试 search.js 中可能引用的其他资源
  console.log('\n4️⃣ 资源文件分析');
  const assets = [
    'https://t3.chei.com.cn/gaokao/2026/zyck/assets/web/js/search.js',
    'https://t3.chei.com.cn/gaokao/2026/zyck/assets/web/js/zyck.js',
  ];
  for (const url of assets) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      const text = await r.text();
      console.log(`  ${url.split('/').pop()}: ${(text.length/1024).toFixed(1)} KB`);
      fs.writeFileSync(path.join(DATA_DIR, url.split('/').pop()), text, 'utf-8');
    } catch (e) {
      console.log(`  ${url.split('/').pop()}: ❌`);
    }
  }

  console.log('\n✅ 探索完成！文件保存在:', DATA_DIR);
}

main().catch(err => console.error('错误:', err.message));

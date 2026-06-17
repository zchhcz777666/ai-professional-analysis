/**
 * 阳光高考搜索 API + 学校 ID 映射
 * 寻找学校的 schId 和录取数据接口
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'crawled-data');
const COOKIE = fs.readFileSync(path.join(DATA_DIR, 'chsi-cookie.txt'), 'utf-8').trim();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function fetchJSON(url, headers = {}) {
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, 'Cookie': COOKIE, 'Referer': 'https://gaokao.chsi.com.cn/', ...headers },
    timeout: 10000,
  });
  return { status: r.status, text: await r.text() };
}

async function main() {
  // 1. 试试搜索自动补全 API
  console.log('=== API 端点测试 ===');
  const apis = [
    { name: '搜索建议', url: 'https://gaokao.chsi.com.cn/sch/searchSuggest?keyword=清华' },
    { name: '搜索建议2', url: 'https://gaokao.chsi.com.cn/sch/searchSuggest.do?keyword=清华大学' },
    { name: '学校搜索JSON', url: 'https://gaokao.chsi.com.cn/sch/search.do?keyword=清华&format=json' },
    { name: '搜索列表 JSON', url: 'https://gaokao.chsi.com.cn/sch/search/list?keyword=清华' },
    { name: 'autocomplete', url: 'https://gaokao.chsi.com.cn/sch/searchAutocomplete?keyword=清华' },
  ];
  for (const api of apis) {
    const r = await fetchJSON(api.url, { 'X-Requested-With': 'XMLHttpRequest' });
    console.log(`${api.name}: ${r.status} -> ${r.text.substring(0, 200)}`);
  }

  // 2. 解析 search.js 找 API
  console.log('\n=== search.js API 分析 ===');
  const searchJS = fs.readFileSync(path.join(DATA_DIR, 'search.js'), 'utf-8');
  // 找 url 和 api
  const urlPatterns = [
    ...searchJS.matchAll(/['\"]([^'\"]*(?:api|url|search|list|json|get|query)[^'\"]*)['\"]/gi)
  ].map(m => m[1]);
  console.log('关键路径:', [...new Set(urlPatterns)].slice(0, 20));

  // 3. 分析 zyck.js
  console.log('\n=== zyck.js API 分析 ===');
  const zyck = fs.readFileSync(path.join(DATA_DIR, 'zyck.js'), 'utf-8');
  const zyUrls = [...zyck.matchAll(/['\"]([^'\"]*\/[^'\"]+)['\"]/g)].map(m => m[1]);
  console.log('zyck URLs:', [...new Set(zyUrls)].slice(0, 20));
  console.log('\nzyck 内容:', zyck);

  // 4. 试一下百度自动补全（gaokao.chsi 用的）
  console.log('\n=== 通过自动补全查学校 ID ===');
  const baiduSearch = await fetchJSON('https://gaokao.chsi.com.cn/sch/search.do?keyword=清华大学');
  console.log('搜索页 HTML:', baiduSearch.text.substring(0, 500));

  // 5. 直接查学校的招生页面
  console.log('\n=== 学校招生页面 ===');
  const testIds = [
    { name: '清华大学', id: 1 },
    { name: '北京大学', id: 2 },
  ];
  for (const s of testIds) {
    try {
      // Try the score/province page
      const r = await fetchJSON(`https://gaokao.chsi.com.cn/sch/scoreProvince--schId-${s.id},year-2024.dhtml`);
      console.log(`${s.name}(id=${s.id}) scoreProvince: ${r.status}, contains score: ${r.text.includes('分数') || r.text.includes('投档')}`);
      if (r.text.length < 50000) {
        fs.writeFileSync(path.join(DATA_DIR, `chsi-score-${s.name}.html`), r.text, 'utf-8');
        console.log('  Response:', r.text.substring(0, 300));
      }
    } catch (e) {
      console.log(`${s.name}(id=${s.id}): ${e.message}`);
    }
  }
}

main().catch(e => console.error('Error:', e.message));

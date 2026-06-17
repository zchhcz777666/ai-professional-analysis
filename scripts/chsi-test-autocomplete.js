/**
 * 阳光高考 — 通过自动补全 API 找到学校 schId
 */
const fs = require('fs');
const c = fs.readFileSync('scripts/crawled-data/chsi-cookie.txt', 'utf-8').trim();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const HEADERS = { 'User-Agent': UA, 'Cookie': c, 'Referer': 'https://gaokao.chsi.com.cn/' };

async function testAutocomplete() {
  // 尝试各种自动补全/搜索接口
  const apis = [
    { name: 'autocomplete', url: 'https://gaokao.chsi.com.cn/sch/autocomplete?keyword=南京大学' },
    { name: 'suggest', url: 'https://gaokao.chsi.com.cn/sch/suggest?keyword=南京大学' },
    { name: 'searchJSON', url: 'https://gaokao.chsi.com.cn/sch/searchJSON?keyword=南京大学' },
    { name: 'searchAjax', url: 'https://gaokao.chsi.com.cn/sch/searchAjax?keyword=南京大学' },
    { name: 'searchSuggest', url: 'https://gaokao.chsi.com.cn/sch/searchSuggest?keyword=南京' },
    { name: 'query', url: 'https://gaokao.chsi.com.cn/sch/query?keyword=南京大学' },
  ];
  
  for (const api of apis) {
    try {
      const r = await fetch(api.url, { headers: HEADERS, timeout: 5000 });
      const text = await r.text();
      console.log(`${api.name}: status=${r.status} -> ${text.substring(0, 200)}`);
    } catch(e) {
      console.log(`${api.name}: ERROR ${e.message.substring(0, 50)}`);
    }
  }
  
  // 试试搜索页带分页 — 每页 20 所学校，应该渲染在学校列表中
  console.log('\n--- 学校列表页 ---');
  const r = await fetch('https://gaokao.chsi.com.cn/sch/search--ss-on,option-qg,searchType-1,start-0.dhtml', {
    headers: HEADERS
  });
  const h = await r.text();
  
  // 提取学校表格/列表中的内容
  // 找 tbody/tr/td 中的学校链接
  const rows = [...h.matchAll(/<tr[\s\S]{0,500}?<\/tr>/gi)];
  console.log('table rows:', rows.length);
  rows.slice(0, 5).forEach((row, i) => {
    const text = row[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log(`  row[${i}]: ${text.substring(0, 100)}`);
  });

  // 找学校卡片
  const items = h.match(/<div[^>]*class="[^"]*item[^"]*"[^>]*>[\s\S]{0,500}?<\/div>/gi);
  if (items) {
    console.log(`\nitems: ${items.length}`);
    items.slice(0, 3).forEach((item, i) => {
      const text = item.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`  item[${i}]: ${text.substring(0, 200)}`);
    });
  }
  
  // 保存完整页面
  fs.writeFileSync('scripts/crawled-data/chsi-school-list.html', h, 'utf-8');
}

testAutocomplete().catch(e => console.error(e));

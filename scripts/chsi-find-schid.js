const fs = require('fs');
const c = fs.readFileSync('scripts/crawled-data/chsi-cookie.txt', 'utf-8').trim();
const UA = 'Mozilla/5.0';
const HEADERS = { 'User-Agent': UA, 'Cookie': c, 'Referer': 'https://gaokao.chsi.com.cn/' };

async function main() {
  // 试试各种自动补全/search API
  const apis = [
    'https://gaokao.chsi.com.cn/sch/autocomplete.do?keyword=南京大学',
    'https://gaokao.chsi.com.cn/sch/search/suggest?keyword=南京大学',
    'https://gaokao.chsi.com.cn/sch/search.do?keyword=南京大学&format=json',
    'https://gaokao.chsi.com.cn/sch/search.htm?keyword=南京大学&type=json',
    'https://gaokao.chsi.com.cn/sch/searchSchool?keyword=南京大学',
    'https://gaokao.chsi.com.cn/sch/getSchoolList?keyword=南京大学',
  ];
  
  for (const url of apis) {
    try {
      const r = await fetch(url, { headers: { ...HEADERS, 'X-Requested-With': 'XMLHttpRequest' }, timeout: 5000 });
      const text = await r.text();
      const isJson = text.trim().startsWith('[') || text.trim().startsWith('{');
      console.log(`${url.split('/sch/')[1]}: ${r.status} ${isJson ? 'JSON' : 'HTML'} -> ${text.substring(0, 150)}`);
    } catch(e) {
      console.log(`${url.split('/sch/')[1]}: ERROR`);
    }
  }

  // 查看完整学校列表页面
  console.log('\n--- 学校列表（全部学校） ---');
  const r = await fetch('https://gaokao.chsi.com.cn/sch/search--ss-on,option-qg,searchType-1,start-0.dhtml', { headers: HEADERS });
  const h = await r.text();
  
  // 找到学校列表区域
  const areaMatch = h.match(/<div[^>]*class="[^"]*result[^"]*"[^>]*>[\s\S]{0,10000}?<\/div>/i);
  if (areaMatch) {
    const area = areaMatch[0];
    // Extract school names and schIds from links
    const schoolLinks = [...area.matchAll(/href="(\/sch\/schoolInfo--schId-(\d+)[^"]*)">([^<]*)<\/a>/g)];
    console.log('schools found in result area:', schoolLinks.length);
    schoolLinks.slice(0, 10).forEach(s => console.log(`  schId=${s[2]}, name=${s[3].trim()}`));
  }

  // 更广泛的匹配 — 在页面任何地方找学校链接
  const allLinks = [...h.matchAll(/<a[^>]*href="(\/sch\/schoolInfo--schId-(\d+)[^"]*)"[^>]*>([^<]{2,20})<\/a>/g)];
  console.log(`\nall school links: ${allLinks.length}`);
  allLinks.slice(0, 15).forEach(s => console.log(`  schId=${s[2]}, name=${s[3].trim()}`));
}

main().catch(e => console.error(e));

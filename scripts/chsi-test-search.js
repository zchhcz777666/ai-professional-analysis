const fs = require('fs');
const c = fs.readFileSync('scripts/crawled-data/chsi-cookie.txt', 'utf-8').trim();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function t() {
  const r = await fetch('https://gaokao.chsi.com.cn/sch/search.do?keyword=南京大学', {
    headers: { 'User-Agent': UA, 'Cookie': c }
  });
  const h = await r.text();
  fs.writeFileSync('scripts/crawled-data/chsi-search-nju.html', h, 'utf-8');
  console.log('saved:', h.length);

  // 所有链接
  const links = [...h.matchAll(/<a[^>]*href="([^"]*)"[^>]*>/gi)];
  const schLinks = links.filter(l => l[1].includes('schId'));
  console.log('schLinks:', schLinks.slice(0, 10).map(l => l[1]));

  // 学校名称
  const anyName = [...h.matchAll(/>([^<]{2,15}(?:大学|学院))</g)];
  console.log('names:', [...new Set(anyName.map(m => m[1]))].slice(0, 20));
}
t().catch(e => console.error(e));

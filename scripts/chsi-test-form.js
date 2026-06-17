const c = require('fs').readFileSync('scripts/crawled-data/chsi-cookie.txt', 'utf-8').trim();
const UA = 'Mozilla/5.0';
const fs = require('fs');

async function t() {
  // 试试表单提交格式的 URL
  const r = await fetch('https://gaokao.chsi.com.cn/sch/search--keyword-%E5%8D%97%E4%BA%AC%E5%A4%A7%E5%AD%A6,start-0.dhtml', {
    headers: { 'User-Agent': UA, 'Cookie': c }
  });
  const h = await r.text();
  console.log('status:', r.status, 'size:', h.length);

  // 找学校名称
  const names = [...h.matchAll(/>([^<]{2,12}(?:大学|学院))</g)].map(m => m[1]);
  console.log('names:', [...new Set(names)].slice(0, 10));

  // 找任何可能包含学校 ID 的链接
  const links = [...h.matchAll(/href="([^"]*schId[^"]*)"/g)].map(m => m[1]);
  console.log('schId links:', links.slice(0, 10));

  // 检查是否有 JS 数据注入
  const dataBlocks = h.match(/var\s+\w+\s*=\s*\[[\s\S]{0,2000}\]/g);
  if (dataBlocks) dataBlocks.slice(0, 3).forEach((b, i) => console.log('data[' + i + ']:', b.substring(0, 300)));

  // 保存
  fs.writeFileSync('scripts/crawled-data/chsi-search-form.html', h, 'utf-8');
}
t().catch(e => console.error(e));

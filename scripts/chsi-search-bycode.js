/**
 * 通过院校代码 (yxdm) 在阳光高考搜索学校
 * 标准院校代码: 清华=10003, 北大=10001, 南大=10284, 东南=10286
 */
const c = require('fs').readFileSync('scripts/crawled-data/chsi-cookie.txt', 'utf-8').trim();
const UA = 'Mozilla/5.0';
const fs = require('fs');

async function main() {
  const tests = [
    { name: '清华大学', yxdm: '10003' },
    { name: '北京大学', yxdm: '10001' },
    { name: '南京大学', yxdm: '10284' },
    { name: '东南大学', yxdm: '10286' },
  ];
  
  for (const s of tests) {
    // 按代码搜索
    const r = await fetch(`https://gaokao.chsi.com.cn/sch/search.do?keyword=${s.yxdm}`, {
      headers: { 'User-Agent': UA, 'Cookie': c }
    });
    const h = await r.text();
    const names = [...h.matchAll(/>([^<]{2,20}(?:大学|学院))</g)].map(m => m[1]);
    const ids = [...h.matchAll(/schId[-=](\d+)/g)].map(m => m[1]);
    const schLinks = [...h.matchAll(/schoolInfo--schId-(\d+)/g)].map(m => m[1]);
    console.log(`${s.name}(yxdm=${s.yxdm}): status=${r.status}, names=${[...new Set(names)].slice(0,3)}, schIds=${[...new Set(ids)].slice(0,5)}, schInfoLinks=${[...new Set(schLinks)].slice(0,5)}`);

    // 保存页面
    if (s.name === '清华大学') {
      fs.writeFileSync('scripts/crawled-data/chsi-search-bycode.html', h, 'utf-8');
    }
  }
}
main().catch(e => console.error(e));

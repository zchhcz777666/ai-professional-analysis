const fs = require('fs');

// Test eol.cn school list response
async function test() {
  const r = await fetch('https://api.eol.cn/gkcx/api/?page=1&request_type=1&school_type=6000&size=1&uri=apidata/api/gk/school/lists', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const d = await r.json();
  console.log('code:', d.code);
  if (d.data?.item?.length) {
    const item = d.data.item[0];
    console.log('keys:', Object.keys(item));
    console.log('_total:', item._total);
    console.log('numFound:', d.data.numFound);
    console.log('sample:', JSON.stringify(item));
  }
}
test().catch(e => console.error(e));

const axios = require('axios');

async function go() {
  const res = await axios.get('https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    timeout: 15000
  });
  const found = new Set();
  const patterns = [
    /['"](\/[a-z]+\/[a-z0-9]+(?:\/[a-z0-9]+)*)['"]/gi,
    /(?:url|src|href)\s*[:=]\s*['"]((?!http|https|#|javascript|mailto)[^'"]+)['"]/gi,
  ];
  for (const p of patterns) {
    let m;
    while ((m = p.exec(res.data)) !== null) {
      const url = m[1];
      if (url.includes('sch') || url.includes('info') || url.includes('score') || url.includes('data') || url.includes('detail') || url.includes('major') || url.includes('special')) {
        if (url.length > 3) found.add(url);
      }
    }
  }
  const unique = [...found].sort();
  unique.forEach((u, i) => console.log(`${i+1}. ${u}`));
}
go().catch(e => console.error(e.message));
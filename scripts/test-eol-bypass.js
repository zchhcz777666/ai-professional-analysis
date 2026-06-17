/**
 * 尝试不同 eol.cn API 参数绕过限流
 */
async function test() {
  const endpoints = [
    { name: 'standard', url: 'https://api.eol.cn/gkcx/api/?page=1&request_type=1&school_type=6000&size=1&uri=apidata/api/gk/school/lists' },
    { name: 'no type', url: 'https://api.eol.cn/gkcx/api/?page=1&request_type=1&size=1&uri=apidata/api/gk/school/lists' },
    { name: 'random token', url: `https://api.eol.cn/gkcx/api/?access_token=${Date.now()}&page=1&request_type=1&school_type=6000&size=1&uri=apidata/api/gk/school/lists` },
    { name: 'score tsinghua', url: 'https://api.eol.cn/gkcx/api/?access_token=&local_province_id=11&school_id=140&signsafe=&uri=apidata/api/gk/score/province&year=2025' },
  ];

  for (const ep of endpoints) {
    try {
      const r = await fetch(ep.url, { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://gkcx.eol.cn/',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'zh-CN,zh;q=0.9'
        },
        timeout: 8000 
      });
      const d = await r.json();
      console.log(`${ep.name}: ${d.code}${d.msg ? ' ' + d.msg : ''}`);
    } catch(e) {
      console.log(`${ep.name}: ERROR ${e.message.substring(0, 40)}`);
    }
  }
}
test().catch(e => console.error(e));

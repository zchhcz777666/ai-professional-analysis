const axios = require('axios');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': 'https://gaokao.chsi.com.cn/',
  };

  console.log('=== Test: /wap/sch/schinfo API ===');
  try {
    const url = 'https://gaokao.chsi.com.cn/wap/sch/schinfo/3';
    const res = await axios.get(url, { headers, timeout: 15000 });
    console.log(`Status: ${res.status}`);
    console.log(`Content-Type: ${res.headers['content-type']}`);
    const data = res.data;
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      console.log(`Top-level keys (${keys.length}): ${keys.join(', ')}`);
      
      // Check if there's a score or admission section
      for (const key of keys) {
        const val = data[key];
        if (Array.isArray(val)) {
          console.log(`\n${key}: Array[${val.length}]`);
          if (val.length > 0) {
            console.log(`  First item: ${JSON.stringify(val[0]).substring(0, 300)}`);
          }
        } else if (typeof val === 'object' && val !== null) {
          console.log(`\n${key}: Object with keys: ${Object.keys(val).join(', ')}`);
        } else {
          console.log(`\n${key}: ${String(val).substring(0, 100)}`);
        }
      }
    } else {
      console.log(`Response is not JSON: ${String(data).substring(0, 500)}`);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (err.response) {
      console.log(`Status: ${err.response.status}`);
      console.log(`Body: ${JSON.stringify(err.response.data).substring(0, 500)}`);
    }
  }

  console.log('\n\n=== Test: /wap/sch/schinfo API with query params ===');
  try {
    const url2 = 'https://gaokao.chsi.com.cn/wap/sch/schinfo/3?provinceId=11&year=2024';
    const res2 = await axios.get(url2, { headers, timeout: 15000 });
    console.log(`Status: ${res2.status}`);
    const data2 = res2.data;
    if (typeof data2 === 'object') {
      const keys = Object.keys(data2);
      console.log(`Top-level keys (${keys.length}): ${keys.join(', ')}`);
      for (const key of keys) {
        const val = data2[key];
        if (Array.isArray(val)) {
          console.log(`\n${key}: Array[${val.length}]`);
          if (val.length > 0) {
            console.log(`  First item: ${JSON.stringify(val[0]).substring(0, 400)}`);
          }
        } else if (typeof val === 'object' && val !== null) {
          const subKeys = Object.keys(val);
          console.log(`\n${key}: Object[${subKeys.length}] keys: ${subKeys.join(', ')}`);
          // Show first sub-item if array inside
          for (const sk of subKeys) {
            const sv = val[sk];
            if (Array.isArray(sv)) {
              console.log(`  ${sk}: Array[${sv.length}]`);
              if (sv.length > 0) {
                console.log(`    First: ${JSON.stringify(sv[0]).substring(0, 300)}`);
              }
            }
          }
        } else {
          console.log(`\n${key}: ${String(val).substring(0, 100)}`);
        }
      }
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (err.response) {
      console.log(`Status: ${err.response.status}`);
      console.log(`Body: ${JSON.stringify(err.response.data).substring(0, 500)}`);
    }
  }
}

test();
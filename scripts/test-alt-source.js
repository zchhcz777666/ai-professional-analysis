const axios = require('axios');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  };

  // Try 大学生必备网 (dxsbb.com) - might have simpler HTML
  console.log('=== 大学生必备网: 清华大学 录取数据 ===');
  try {
    const urls = [
      'https://www.dxsbb.com/news/10003.html',  // 清华大学
      'https://www.dxsbb.com/college/10003/',    // maybe
    ];
    for (const url of urls) {
      try {
        const res = await axios.get(url, { headers, timeout: 10000 });
        console.log(`\n${url}: Status=${res.status}, len=${res.data.length}`);
        const $ = require('cheerio').load(res.data);
        console.log(`  Tables: ${$('table').length}`);
        $('table').each((i, table) => {
          const txt = $(table).text().trim().substring(0, 100);
          if (txt) console.log(`  Table ${i}: ${txt}`);
        });
      } catch (e) {
        console.log(`\n${url}: Error - ${e.message}`);
      }
    }
  } catch (err) {
    console.error(err.message);
  }

  // Try to access the score data via different 阳光高考 paths
  console.log('\n=== 阳光高考 alternative URLs ===');
  const altUrls = [
    'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3,categoryId-36650,mindex-1.dhtml', // 学校简介
    'https://gaokao.chsi.com.cn/z/gkbmfslq/lqjg.jsp',  // 录取结果
    'https://gaokao.chsi.com.cn/sch/zbzrft--schId-3.dhtml',  // 招生咨询
    'https://gaokao.chsi.com.cn/sch/listlqjggs--schId-3,categoryId-423321,mindex-8.dhtml',  // 录取结果公示
  ];
  for (const url of altUrls) {
    try {
      const res = await axios.get(url, { headers, timeout: 10000 });
      console.log(`\n${url.substring(0, 80)}: Status=${res.status}, len=${res.data.length}`);
      const $ = require('cheerio').load(res.data);
      const tables = $('table');
      console.log(`  Tables: ${tables.length}`);
      if (tables.length > 0) {
        tables.each((i, table) => {
          const headers = [];
          $(table).find('tr').first().find('th').each((j, th) => {
            headers.push($(th).text().trim());
          });
          if (headers.length > 0) console.log(`  Table ${i}: [${headers.join(', ').substring(0, 150)}]`);
        });
      }
      // Look for iframes
      console.log(`  Iframes: ${$('iframe').length}`);
      $('iframe').each((i, ifr) => {
        console.log(`    src: ${$(ifr).attr('src') || ''}`);
      });
    } catch (e) {
      console.log(`\n${url.substring(0, 80)}: Error - ${e.message}`);
    }
  }

  // Try to find the score data API through the desktop/mobile subdomain
  console.log('\n=== Looking for XHR endpoints ===');
  const xhrTests = [
    'https://gaokao.chsi.com.cn/sch/schoolScore--schId-3.dhtml?provinceId=11&year=2024',
    'https://gaokao.chsi.com.cn/sch/score--schId-3.dhtml?provinceId=11&year=2024',
    'https://data.chsi.com.cn/sch/score/3',
    'https://gaokao.chsi.com.cn/sch/doScoreSearch.dhtml',
  ];
  for (const url of xhrTests) {
    try {
      const res = await axios.get(url, { 
        headers: { ...headers, 'X-Requested-With': 'XMLHttpRequest' },
        timeout: 5000 
      });
      console.log(`\n${url.substring(0, 80)}: Status=${res.status}, len=${res.data.length}`);
      if (typeof res.data === 'object') {
        console.log(`  JSON Data keys: ${Object.keys(res.data).join(', ')}`);
      } else if (res.data.length < 500) {
        console.log(`  Content: ${res.data.substring(0, 300)}`);
      }
    } catch (e) {
      // silent
    }
  }
}

test();
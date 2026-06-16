const axios = require('axios');
const cheerio = require('cheerio');

async function main() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  // Test 1: listHireInfo page - check for score data
  console.log('=== Test: listHireInfo (往年录取信息) ===');
  const res = await axios.get('https://gaokao.chsi.com.cn/sch/listHireInfo--schId-3,categoryId-36677,mindex-6.dhtml', { 
    headers, timeout: 10000 
  });
  
  const $ = cheerio.load(res.data);
  
  console.log(`Title: ${$('title').text()}`);
  console.log(`HTML: ${res.data.length}`);
  
  // Check tables
  $('table').each((i, tbl) => {
    const headers = [];
    $(tbl).find('tr:first-child th, tr:first-child td').each((j, cell) => {
      headers.push($(cell).text().trim());
    });
    if (headers.length > 0) {
      console.log(`\nTable ${i}: [${headers.join(', ')}]`);
      const rows = $(tbl).find('tr').length;
      console.log(`  Rows: ${rows}`);
      if (rows > 1) {
        // Print first data row
        const firstRow = [];
        $(tbl).find('tr:eq(1) td').each((j, cell) => {
          firstRow.push($(cell).text().trim());
        });
        console.log(`  First row: [${firstRow.join(', ')}]`);
      }
    }
  });
  
  // Check selects (province/year selectors)
  $('select').each((i, sel) => {
    const name = $(sel).attr('name') || '';
    const options = [];
    $(sel).find('option').each((j, opt) => {
      options.push({ text: $(opt).text().trim(), value: $(opt).attr('value') });
    });
    console.log(`\nSelect ${i}: name="${name}"`);
    console.log(`  Options (${options.length}): ${options.slice(0, 5).map(o => `${o.text}=${o.value}`).join(', ')}...`);
  });

  // Test 2: Try listHireInfo with province/year params
  console.log('\n\n=== Test: listHireInfo with params ===');
  const paramsTests = [
    'https://gaokao.chsi.com.cn/sch/listHireInfo--schId-3,categoryId-36677,mindex-6.dhtml?provinceId=11&year=2024',
    'https://gaokao.chsi.com.cn/sch/listHireInfo--schId-3,categoryId-36677,mindex-6.dhtml?ssdm=11&year=2024',
    'https://gaokao.chsi.com.cn/sch/listHireInfo--schId-3,categoryId-36677,mindex-6.dhtml?province=11&year=2024',
  ];
  
  for (const url of paramsTests) {
    try {
      const r = await axios.get(url, { headers, timeout: 8000 });
      const $$ = cheerio.load(r.data);
      console.log(`\n${url.substring(0, 100)}...`);
      console.log(`  Status: ${r.status}, HTML: ${r.data.length}`);
      
      // Check for score data
      const hasScore = r.data.includes('最低分') || r.data.includes('平均分');
      console.log(`  Has score data: ${hasScore}`);
      
      // Count tables
      console.log(`  Tables: ${$$('table').length}`);
      
      // Look for key content
      if (r.data.includes('暂无')) {
        console.log('  Content: 暂无数据');
      }
    } catch (e) {
      console.log(`\n${url.substring(0, 100)}... Error: ${e.message.substring(0, 60)}`);
    }
  }

  // Test 3: Check for scripts/data in listHireInfo
  console.log('\n\n=== Test: listHireInfo scripts ===');
  const dataScripts = [];
  $('script').each((i, script) => {
    const src = $(script).attr('src') || '';
    const content = $(script).html() || '';
    if (content.includes('score') || content.includes('admission') || content.includes('province') || content.includes('最低分') || content.includes('lqfs')) {
      dataScripts.push(content.substring(0, 500));
    }
    if (src.includes('showchsi') || src.includes('gaokao')) {
      console.log(`External script: ${src}`);
    }
  });
  
  console.log(`\nData scripts found: ${dataScripts.length}`);
  dataScripts.forEach((s, i) => console.log(`\nScript ${i}: ${s}`));
  
  // Check for links in the page (might lead to score details)
  const scoreLinks = [];
  $('a[href*="score"], a[href*="lqfs"], a[href*="fenshu"], a[href*="admission"]').each((i, a) => {
    scoreLinks.push({ text: $(a).text().trim().substring(0, 50), href: $(a).attr('href') });
  });
  console.log(`\nScore-related links: ${scoreLinks.length}`);
  scoreLinks.forEach(l => console.log(`  ${l.text}: ${l.href}`));
}

main().catch(e => console.error('Fatal:', e.message));
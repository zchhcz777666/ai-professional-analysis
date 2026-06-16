const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  // Test: 武汉大学 on dxsbb
  console.log('=== 武汉大学 dxsbb ===');
  try {
    const res = await axios.get('https://www.dxsbb.com/news/32991.html', { headers, timeout: 10000 });
    const $ = cheerio.load(res.data);
    console.log(`Title: ${$('title').text()}`);
    
    // Find all tables with their content
    $('table').each((i, tbl) => {
      const headers = [];
      $(tbl).find('tr:first-child th, tr:first-child td').each((j, cell) => {
        headers.push($(cell).text().trim());
      });
      
      // Only show tables that look like score data
      const headerStr = headers.join(' ');
      if (headerStr.includes('分') || headerStr.includes('专业') || headerStr.includes('录取')) {
        console.log(`\nTable ${i}: [${headers.join(', ')}]`);
        const rows = $(tbl).find('tr').length;
        console.log(`  Rows: ${rows}`);
        
        // Print first 5 data rows
        for (let r = 1; r < Math.min(rows, 6); r++) {
          const row = [];
          $(tbl).find(`tr:eq(${r}) td`).each((j, cell) => {
            row.push($(cell).text().trim());
          });
          if (row.some(c => c.length > 0)) {
            console.log(`  Row ${r}: [${row.join(', ')}]`);
          }
        }
      }
    });
    
    // Also show text around relevant keywords
    const body = $('body').text();
    console.log('\n=== Quick check ===');
    console.log(`Contains '最低分': ${body.includes('最低分')}`);
    console.log(`Contains '平均分': ${body.includes('平均分')}`);
    console.log(`Contains '北京': ${body.includes('北京')}`);
    
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

test().catch(e => console.error('Fatal:', e.message));
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  // Test dxsbb.com school page - Tsinghua
  console.log('=== dxsbb 清华大学 ===');
  try {
    // The school code for Tsinghua on dxsbb is 10003
    const res = await axios.get('https://www.dxsbb.com/school/10003/', { headers, timeout: 10000 });
    const $ = cheerio.load(res.data);
    console.log(`Title: ${$('title').text()}`);
    console.log(`HTML: ${res.data.length}`);
    
    // Look for links to score pages
    const links = [];
    $('a[href]').each((i, a) => {
      const href = $(a).attr('href');
      const text = $(a).text().trim();
      if (href && text && (text.includes('分数') || text.includes('录取') || href.includes('fenshu'))) {
        links.push({ text: text.substring(0, 60), href });
      }
    });
    console.log(`Score-related links: ${links.length}`);
    links.slice(0, 10).forEach(l => console.log(`  ${l.text}: ${l.href}`));
    
    // Look for tables
    const tables = [];
    $('table').each((i, tbl) => {
      const headers = [];
      $(tbl).find('tr:first-child th, tr:first-child td').each((j, cell) => {
        headers.push($(cell).text().trim());
      });
      if (headers.length > 0) tables.push({ i, headers: headers.slice(0, 8).join(' | '), rows: $(tbl).find('tr').length });
    });
    console.log(`Tables: ${tables.length}`);
    tables.forEach(t => console.log(`  Table ${t.i}: [${t.headers}] rows=${t.rows}`));
    
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }

  // Test: dxsbb news page for Tsinghua
  console.log('\n=== dxsbb 新闻: 清华 录取分数线 ===');
  try {
    const res = await axios.get('https://www.dxsbb.com/news/10003.html', { headers, timeout: 10000 });
    const $ = cheerio.load(res.data);
    console.log(`Title: ${$('title').text()}`);
    console.log(`HTML: ${res.data.length}`);
    
    // Check for tables with score data
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
          for (let r = 1; r < Math.min(rows, 4); r++) {
            const row = [];
            $(tbl).find(`tr:eq(${r}) td`).each((j, cell) => {
              row.push($(cell).text().trim());
            });
            console.log(`  Row ${r}: [${row.join(', ')}]`);
          }
        }
      }
    });
    
    // Print page text to see structure
    const bodyText = $('body').text();
    const lines = bodyText.split('\n').filter(l => l.trim()).map(l => l.trim());
    console.log('\nPage content (relevant lines):');
    lines.filter(l => l.includes('分') || l.includes('录取') || l.includes('专业') || l.includes('北京')).slice(0, 20).forEach(l => console.log(`  ${l}`));
    
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

test().catch(e => console.error('Fatal:', e.message));
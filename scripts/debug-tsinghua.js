const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function main() {
  const res = await axios.get('https://www.dxsbb.com/news/31641.html', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' },
    timeout: 15000
  });
  
  // Save HTML for inspection
  fs.writeFileSync('scripts/test-tsinghua.html', res.data);
  
  const $ = cheerio.load(res.data);
  
  // Find all tables
  console.log(`Number of <table> elements: ${$('table').length}`);
  console.log(`Number of <tr> elements: ${$('tr').length}`);
  console.log(`Number of <td> elements: ${$('td').length}`);
  
  // Show all table content
  $('table').each((ti, tbl) => {
    console.log(`\n=== Table ${ti} ===`);
    const html = $(tbl).html().substring(0, 2000);
    console.log(html);
  });
  
  // Also check if tables are inside content
  console.log(`\n=== Content divs ===`);
  $('div').each((i, div) => {
    const cls = $(div).attr('class') || '';
    if (cls.includes('content') || cls.includes('article') || cls.includes('con')) {
      console.log(`\n${cls}: ${$(div).html().substring(0, 500)}`);
    }
  });
}

main().catch(e => console.error('Fatal:', e.message));
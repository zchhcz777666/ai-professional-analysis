const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function main() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  const res = await axios.get('https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score', { 
    headers, timeout: 10000 
  });
  
  const html = res.data;
  const $ = cheerio.load(html);
  
  // Find ALL external script tags
  const allScripts = [];
  $('script').each((i, el) => {
    const src = $(el).attr('src');
    if (src) allScripts.push(src);
  });
  
  console.log(`All external scripts (${allScripts.length}):`);
  allScripts.forEach((s, i) => console.log(`${i+1}. ${s}`));
  
  // Check for any inline data
  const dataBlocks = [];
  $('script').each((i, el) => {
    const html = $(el).html() || '';
    if (html.includes('window.') || html.includes('var ') || html.includes('let ') || html.includes('const ') || html.includes('data')) {
      if (html.length > 50) {
        dataBlocks.push({ i, len: html.length, preview: html.substring(0, 500) });
      }
    }
  });
  
  console.log(`\nInline data blocks (${dataBlocks.length}):`);
  dataBlocks.forEach(d => {
    console.log(`\nScript #${d.i} (${d.len} chars):`);
    console.log(d.preview);
  });
  
  // Save the full HTML for analysis
  fs.writeFileSync('c:\\Users\\Administrator\\.trae-cn\\aizhuanyefengxi\\scripts\\page.html', html, 'utf-8');
  console.log('\nFull HTML saved to page.html');
}

main().catch(e => console.error(e.message));
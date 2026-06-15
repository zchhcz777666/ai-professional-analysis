const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  // Test dxsbb search
  console.log('=== dxsbb search for 清华大学 ===');
  try {
    const res = await axios.get('https://www.dxsbb.com/search.php?q=清华大学+录取分数线', { 
      headers, timeout: 10000 
    });
    const $ = cheerio.load(res.data);
    console.log(`Title: ${$('title').text()}`);
    console.log(`HTML: ${res.data.length}`);
    
    // Find links
    const links = [];
    $('a[href]').each((i, a) => {
      const href = $(a).attr('href');
      const text = $(a).text().trim();
      if (href && text && (text.includes('清华') || href.includes('/news/'))) {
        links.push({ text: text.substring(0, 60), href });
      }
    });
    console.log(`Relevant links: ${links.length}`);
    links.slice(0, 10).forEach(l => console.log(`  ${l.text}: ${l.href}`));
    
    // Also try searching by school name
    const searchResults = [];
    $('.search-result li, .result-item, .search-item, .article-item, li').each((i, el) => {
      const link = $(el).find('a');
      const href = link.attr('href') || '';
      const text = link.text().trim();
      if (href && text && text.includes('清华大学')) {
        searchResults.push({ text: text.substring(0, 80), href });
      }
    });
    console.log(`\nSearch results for 清华大学: ${searchResults.length}`);
    searchResults.forEach(r => console.log(`  ${r.text}: ${r.href}`));
    
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
  
  // Try the dxsbb school page format
  console.log('\n=== dxsbb school search ===');
  try {
    // Try school page URLs
    const urls = [
      'https://www.dxsbb.com/school/清华大学/',
      'https://www.dxsbb.com/school/tsinghua/',
      'https://www.dxsbb.com/college/10003/',
    ];
    
    for (const url of urls) {
      try {
        const r = await axios.get(url, { headers, timeout: 5000 });
        const $$ = cheerio.load(r.data);
        console.log(`${url}: ${r.status}, title=${$$('title').text().substring(0, 60)}`);
      } catch (e) {
        console.log(`${url}: ${e.response?.status || e.message.substring(0, 40)}`);
      }
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
  
  // Try the dxsbb special link format for Tsinghua
  console.log('\n=== Trying specific dxsbb article formats ===');
  const possibleIds = [
    // Tsinghua - schId is 10003 on chsi
    10003,  // Most common mapping
    // Try some IDs near the top schools
    10001,  // Peking
    10002,  // Renmin
    10003,  // Tsinghua
    10284,  // Nanjing
    10335,  // Zhejiang
  ];
  
  for (const id of possibleIds) {
    try {
      const url = `https://www.dxsbb.com/news/${id}.html`;
      const r = await axios.get(url, { headers, timeout: 5000 });
      const $$ = cheerio.load(r.data);
      const title = $$('title').text();
      if (title && !title.includes('404') && !title.includes('找不到')) {
        console.log(`${url}: ${title.substring(0, 80)}`);
      }
    } catch (e) {
      // Skip errors
    }
  }
}

test().catch(e => console.error('Fatal:', e.message));
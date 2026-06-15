const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function findDxsbbArticles() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  // Step 1: Find all articles from the admission result list page
  const results = [];
  
  for (let page = 1; page <= 5; page++) {
    const listUrl = page === 1 
      ? 'https://www.dxsbb.com/news/list_458.html'
      : `https://www.dxsbb.com/news/list_458_${page}.html`;
    
    try {
      console.log(`Fetching list page ${page}...`);
      const res = await axios.get(listUrl, { headers, timeout: 10000 });
      const $ = cheerio.load(res.data);
      
      $('a').each((i, a) => {
        const href = $(a).attr('href');
        const text = $(a).text().trim();
        if (href && text && href.match(/\/news\/\d+\.html/) && (text.includes('录取分数') || text.includes('录取线'))) {
          results.push({
            title: text.substring(0, 80),
            url: href.startsWith('http') ? href : `https://www.dxsbb.com${href}`,
            page
          });
        }
      });
      
      console.log(`  Found ${results.length} articles so far`);
    } catch (e) {
      console.log(`  Error on page ${page}: ${e.message}`);
    }
    
    // Don't hammer the server
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`\nTotal articles found: ${results.length}`);
  
  // Save results
  fs.writeFileSync(
    'c:\\Users\\Administrator\\.trae-cn\\aizhuanyefengxi\\scripts\\dxsbb-articles.json',
    JSON.stringify(results, null, 2),
    'utf-8'
  );
  
  // Print first 20 articles
  results.slice(0, 20).forEach((r, i) => {
    console.log(`${i+1}. ${r.title}`);
    console.log(`   ${r.url}`);
  });
}

findDxsbbArticles().catch(e => console.error('Fatal:', e.message));
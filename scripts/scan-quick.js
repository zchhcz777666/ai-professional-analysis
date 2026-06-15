const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const UAs = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
];
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  // Load universities
  const content = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'universities.ts'), 'utf-8');
  const unis = [];
  const re = /id:\s*'([^']+)'[^}]*name:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(content)) !== null) unis.push({ id: m[1], name: m[2] });
  console.log(`Loaded ${unis.length} universities`);

  // Create map from known dxsbb ID patterns (10001-10335 are top Chinese unis)
  // DXSBB uses same IDs as ChSI for some schools
  // Build article titles from university names
  const articles = {};
  
  // Scan first 5 list pages
  for (let page = 1; page <= 10; page++) {
    const url = page === 1
      ? 'https://www.dxsbb.com/news/list_458.html'
      : `https://www.dxsbb.com/news/list_458_${page}.html`;
    try {
      const res = await axios.get(url, {
        headers: { 'User-Agent': UAs[0], 'Accept-Language': 'zh-CN' },
        timeout: 10000
      });
      const $ = cheerio.load(res.data);
      $('a[href*="/news/"]').each((i, a) => {
        const href = $(a).attr('href');
        const text = $(a).text().trim();
        if (href && href.match(/\/news\/\d+\.html/)) {
          const match = text.match(/\d{4}(.+?)录取分数线/);
          if (match) {
            articles[match[1].trim()] = {
              url: href.startsWith('http') ? href : `https://www.dxsbb.com${href}`,
              title: text
            };
          }
        }
      });
      console.log(`Page ${page}: ${Object.keys(articles).length} articles`);
      await sleep(1000);
    } catch (e) {
      console.log(`Page ${page}: ${e.message}`);
    }
  }
  
  console.log(`\nTotal articles found: ${Object.keys(articles).length}`);

  // Match with our universities
  let matched = 0;
  for (const uni of unis) {
    if (articles[uni.name]) {
      matched++;
    }
  }
  
  console.log(`Exact matches: ${matched}/${unis.length}`);
  
  // Print sample articles for debugging
  let sampleCount = 0;
  for (const [name, art] of Object.entries(articles)) {
    if (sampleCount < 20) {
      console.log(`  ${name}: ${art.title.substring(0, 60)}`);
      sampleCount++;
    }
  }
}

main().catch(e => console.error('Fatal:', e.message));
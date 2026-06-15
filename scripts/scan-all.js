const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const UAs = ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'];
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  // Load universities
  const content = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'universities.ts'), 'utf-8');
  const unis = [];
  const re = /id:\s*'([^']+)'[^}]*name:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(content)) !== null) unis.push({ id: m[1], name: m[2] });
  console.log(`Loaded ${unis.length} universities`);

  const articles = {};
  
  // Scan all list pages (up to 60)
  for (let page = 1; page <= 60; page++) {
    const url = page === 1
      ? 'https://www.dxsbb.com/news/list_458.html'
      : `https://www.dxsbb.com/news/list_458_${page}.html`;
    try {
      const res = await axios.get(url, {
        headers: { 'User-Agent': UAs[0], 'Accept-Language': 'zh-CN' },
        timeout: 10000
      });
      const $ = cheerio.load(res.data);
      
      // Check if page has any articles
      let found = 0;
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
            found++;
          }
        }
      });
      
      console.log(`Page ${page}: +${found} = ${Object.keys(articles).length}`);
      
      // If no articles found, we've reached the end
      if (found === 0) {
        console.log(`No more articles found after page ${page}, stopping.`);
        break;
      }
      
      await sleep(800 + Math.random() * 400);
    } catch (e) {
      if (e.response?.status === 404) {
        console.log(`Page ${page}: 404, stopping.`);
        break;
      }
      console.log(`Page ${page}: ${e.message}`);
      await sleep(2000);
    }
  }
  
  console.log(`\nTotal articles: ${Object.keys(articles).length}`);

  // Match with our universities (exact + fuzzy)
  let exactMatches = 0;
  const matched = {};
  const uniNameMap = {};
  for (const uni of unis) {
    uniNameMap[uni.name] = uni;
    // Remove suffix for matching
    uniNameMap[uni.name.replace(/大学$/, '').replace(/学院$/, '')] = uni;
  }
  
  for (const uni of unis) {
    // Exact match
    if (articles[uni.name]) {
      matched[uni.id] = { ...articles[uni.name], uniName: uni.name };
      exactMatches++;
      continue;
    }
    
    // Fuzzy match: remove 大学/学院 suffix
    const shortName = uni.name.replace(/大学$/, '').replace(/学院$/, '');
    if (articles[shortName]) {
      matched[uni.id] = { ...articles[shortName], uniName: uni.name };
      exactMatches++;
      continue;
    }
    
    // Partial match
    for (const [artName, art] of Object.entries(articles)) {
      const cleanArt = artName.replace(/大学$/, '').replace(/学院$/, '');
      const cleanUni = uni.name.replace(/大学$/, '').replace(/学院$/, '');
      if (cleanArt.includes(cleanUni) || cleanUni.includes(cleanArt)) {
        matched[uni.id] = { ...art, uniName: uni.name };
        exactMatches++;
        break;
      }
    }
  }
  
  console.log(`\nMatched: ${exactMatches}/${unis.length}`);
  
  // Unmatched
  console.log(`\nUnmatched (${unis.length - exactMatches}):`);
  const matchedIds = new Set(Object.keys(matched));
  unis.filter(u => !matchedIds.has(u.id)).forEach(u => console.log(`  ${u.name} (${u.id})`));
  
  // Save mapping
  fs.writeFileSync(
    path.join(__dirname, 'crawled-data', 'uni-article-map-full.json'),
    JSON.stringify({ matched, unmatched: unis.filter(u => !matchedIds.has(u.id)).map(u => u.name), totalMatched: exactMatches, totalUnis: unis.length }, null, 2),
    'utf-8'
  );
}

main().catch(e => console.error('Fatal:', e.message));
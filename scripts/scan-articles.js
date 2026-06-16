/**
 * 步骤1: 扫描 dxsbb 文章列表，建立高校-文章映射
 * 运行: node scripts/scan-articles.js
 */
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const getHeaders = () => ({
  'User-Agent': UA_POOL[Math.floor(Math.random() * UA_POOL.length)],
  'Accept-Language': 'zh-CN,zh;q=0.9',
  'Referer': 'https://www.dxsbb.com/',
});

async function scanAllPages() {
  const articles = {}; // { uniName: { url, title } }
  
  for (let page = 1; page <= 20; page++) {
    const url = page === 1
      ? 'https://www.dxsbb.com/news/list_458.html'
      : `https://www.dxsbb.com/news/list_458_${page}.html`;
    
    try {
      const res = await axios.get(url, { headers: getHeaders(), timeout: 15000 });
      const $ = cheerio.load(res.data);
      
      $('a[href*="/news/"]').each((i, a) => {
        const href = $(a).attr('href');
        const text = $(a).text().trim();
        if (href && href.match(/\/news\/\d+\.html/)) {
          const m = text.match(/\d{4}(.+?)录取分数线/);
          if (m) {
            const name = m[1].trim();
            const fullUrl = href.startsWith('http') ? href : `https://www.dxsbb.com${href}`;
            if (!articles[name] || text.length > (articles[name].title || '').length) {
              articles[name] = { url: fullUrl, title: text };
            }
          }
        }
      });
      
      console.log(`Page ${page}: ${Object.keys(articles).length} unique articles so far`);
      await sleep(1500);
    } catch (e) {
      console.log(`Page ${page} error: ${e.message}`);
    }
  }
  
  console.log(`\nTotal unique articles: ${Object.keys(articles).length}`);
  fs.writeFileSync(path.join(__dirname, 'crawled-data', 'dxsbb-articles.json'), JSON.stringify(articles, null, 2), 'utf-8');
  return articles;
}

async function matchUniversities(articles) {
  // Load universities from our data
  const content = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'universities.ts'), 'utf-8');
  const unis = [];
  const re = /id:\s*'([^']+)'[^}]*name:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(content)) !== null) unis.push({ id: m[1], name: m[2] });
  
  console.log(`\nLoaded ${unis.length} universities`);
  
  // Match
  let matched = 0;
  const matches = {};
  for (const uni of unis) {
    if (articles[uni.name]) {
      matches[uni.id] = { uniName: uni.name, ...articles[uni.name] };
      matched++;
    } else {
      // Try partial match
      for (const [artName, art] of Object.entries(articles)) {
        if (uni.name.includes(artName) || artName.includes(uni.name)) {
          // Check it's not a false match (e.g. 北京大学 vs 北京理工大学)
          const words = [uni.name.replace(/[大学学院]$/, ''), artName.replace(/[大学学院]$/, '')];
          if (words[0].includes(words[1]) || words[1].includes(words[0])) {
            matches[uni.id] = { uniName: uni.name, ...art };
            matched++;
            break;
          }
        }
      }
    }
  }
  
  console.log(`Matched: ${matched}/${unis.length}`);
  console.log(`\nUnmatched universities (${unis.length - matched}):`);
  const matchedNames = new Set(Object.values(matches).map(v => v.uniName));
  unis.filter(u => !matchedNames.has(u.name)).forEach(u => console.log(`  - ${u.name} (${u.id})`));
  
  fs.writeFileSync(path.join(__dirname, 'crawled-data', 'uni-article-map.json'), JSON.stringify(matches, null, 2), 'utf-8');
  return matches;
}

scanAllPages()
  .then(matchUniversities)
  .then(() => console.log('\nDone!'))
  .catch(e => console.error('Fatal:', e.message));
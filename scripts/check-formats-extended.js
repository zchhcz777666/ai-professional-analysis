/**
 * 检查非顶尖高校的文章格式（检查30-60名）
 */
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const MAP_FILE = path.join(__dirname, 'crawled-data', 'uni-article-map-full.json');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function check(url, name) {
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36' },
      timeout: 8000
    });
    const $ = cheerio.load(res.data);
    const tables = $('table');
    let hasTable = false;
    
    tables.each((i, t) => {
      const h = $(t).find('tr:first-child').text();
      if (h.includes('最低分')) hasTable = true;
    });
    
    const pText = ($('.content').text() || '').trim();
    const hasScoreText = /(?:山西|北京|广东|湖北|湖南|江苏|浙江).*?(?:分|线)/.test(pText);
    
    return { table: hasTable, scoreText: hasScoreText, pLen: pText.length };
  } catch(e) {
    return { table: false, scoreText: false, error: e.message };
  }
}

async function main() {
  const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));
  const entries = Object.entries(map.matched);
  
  // Test schools 30-50 (mid-ranked schools)
  console.log('Testing schools 30-60:\n');
  let tableC = 0, textC = 0, other = 0;
  
  for (let i = 30; i < 60; i++) {
    const [id, art] = entries[i];
    const r = await check(art.url, art.uniName);
    
    if (r.table) {
      console.log(`[${i}] [TABLE] ${art.uniName}`);
      tableC++;
    } else if (r.scoreText) {
      console.log(`[${i}] [TEXT]  ${art.uniName}`);
      textC++;
    } else {
      console.log(`[${i}] [???]   ${art.uniName} ${r.error || 'no data'}`);
      other++;
    }
    await sleep(800);
  }
  
  console.log(`\nSchools 30-60: Table=${tableC}, Text=${textC}, Other=${other}`);
  
  // Also test schools 120-130 (lower ranked)
  console.log(`\nTesting schools 120-130:\n`);
  for (let i = 120; i < 130; i++) {
    const [id, art] = entries[i];
    const r = await check(art.url, art.uniName);
    
    if (r.table) {
      console.log(`[${i}] [TABLE] ${art.uniName}`);
      tableC++;
    } else if (r.scoreText) {
      console.log(`[${i}] [TEXT]  ${art.uniName}`);
      textC++;
    } else {
      console.log(`[${i}] [???]   ${art.uniName}`);
      other++;
    }
    await sleep(800);
  }
  
  console.log(`\nTotal: Table=${tableC}, Text=${textC}, Other=${other}`);
}

main().catch(e => console.error('Fatal:', e.message));
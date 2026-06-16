/**
 * 步骤2：测试不同学校的文章格式（table vs text）
 * 运行: node scripts/test-article-formats.js
 */
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function test(url, name) {
  try {
    const res = await axios.get(url, { headers, timeout: 10000 });
    const $ = cheerio.load(res.data);
    
    const tables = $('table').length;
    const pTags = $('.content p, #article .content p').length;
    const bodyText = $('.content').text() || $('#article .content').text() || $('body').text();
    
    // Check for key data patterns
    const hasScores = bodyText.includes('分');
    const hasProvinces = /山西|北京|广东|湖北|湖南|江苏|浙江/.test(bodyText);
    const hasYears = /202[1-5]/.test(bodyText);
    
    // Table format check
    const hasTableFormat = tables > 0 && $(`table`).html().includes('最低分');
    
    return {
      name,
      url,
      tables,
      pTags,
      tableFormat: hasTableFormat,
      textFormat: hasScores && hasProvinces && tables === 0,
      mixedFormat: hasTableFormat && hasScores,
    };
  } catch (e) {
    return { name, url, error: e.message };
  }
}

async function main() {
  // Load article map
  const map = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'crawled-data', 'uni-article-map-full.json'), 'utf-8'
  ));
  
  const entries = Object.entries(map.matched);
  console.log(`Testing ${entries.length} article formats...\n`);
  
  // Test a sample (first 50, and some specific top schools)
  const testIds = ['tsinghua', 'pku', 'zju', 'sjtu', 'fudan', 'nju', 'whu', 'hit', 'buaa'];
  const results = [];
  
  // Add specific schools
  for (const id of testIds) {
    if (map.matched[id]) {
      const r = await test(map.matched[id].url, id);
      results.push(r);
      console.log(`${r.name}: tables=${r.tables} | table=${!!r.tableFormat} | text=${!!r.textFormat}`);
      await sleep(500);
    }
  }
  
  // Categorize by table/tablet format
  const tableCount = results.filter(r => r.tableFormat).length;
  const textCount = results.filter(r => r.textFormat).length;
  const mixedCount = results.filter(r => r.mixedFormat).length;
  
  console.log(`\nSummary:`);
  console.log(`  Table format: ${tableCount}/${results.length}`);
  console.log(`  Text format: ${textCount}/${results.length}`);
  console.log(`  Mixed: ${mixedCount}/${results.length}`);
  
  // Show details
  results.forEach(r => {
    if (r.tableFormat) console.log(`  [TABLE] ${r.name}: ${r.url}`);
    if (r.textFormat && !r.tableFormat) console.log(`  [TEXT]  ${r.name}: ${r.url}`);
    if (r.error) console.log(`  [ERROR] ${r.name}: ${r.error}`);
  });
}

main().catch(e => console.error('Fatal:', e.message));
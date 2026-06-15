/**
 * 全量爬虫：从 dxsbb.com 爬取 253 所高校的录取数据
 * 
 * 运行: node scripts/crawl-all.js
 * 
 * 文章格式：
 *   1) Table格式（多数学校）：HTML <table> 元素，含 [年份, 省份, 类别, 科类, 专业名称, 最低分, 最低分位次]
 *   2) Text格式（清北等少数学校）：<p> 元素中文本数据，如 "湖北：物理组692分；物化组690分；不限组670分；"
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const UAs = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36',
];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const OUT_DIR = path.join(__dirname, 'crawled-data');
const MAP_FILE = path.join(OUT_DIR, 'uni-article-map-full.json');

// 省份数据库名称映射
const PROVINCE_MAP = {
  '北京':'北京','天津':'天津','河北':'河北','山西':'山西','内蒙古':'内蒙古',
  '辽宁':'辽宁','吉林':'吉林','黑龙江':'黑龙江',
  '上海':'上海','江苏':'江苏','浙江':'浙江','安徽':'安徽','福建':'福建','江西':'江西','山东':'山东',
  '河南':'河南','湖北':'湖北','湖南':'湖南',
  '广东':'广东','广西':'广西','海南':'海南',
  '重庆':'重庆','四川':'四川','贵州':'贵州','云南':'云南','西藏':'西藏',
  '陕西':'陕西','甘肃':'甘肃','青海':'青海','宁夏':'宁夏','新疆':'新疆',
};

// ==================== 解析 Table 格式 ====================
function parseTableFormat($, uniId, tables) {
  const records = [];
  
  tables.each((ti, tbl) => {
    const headers = [];
    $(tbl).find('tr:first-child th, tr:first-child td').each((j, cell) => {
      headers.push($(cell).text().trim());
    });
    
    const h = headers.join(' ');
    if (!h.includes('最低分') && !h.includes('专业')) return;
    
    const col = {};
    headers.forEach((v, i) => {
      if (v.includes('年份') || /^20\d{2}$/.test(v)) col.year = i;
      if (v.includes('省份')||v.includes('生源地')) col.province = i;
      if (v.includes('科类')||v.includes('选科')) col.category = i;
      if (v.includes('专业')) col.major = i;
      if ((v.includes('最低分')||v.includes('最低分数')) && !v.includes('位次')&&!v.includes('排名')) col.minScore = i;
      if (v.includes('最低分位次')||v.includes('最低排名')) col.minRank = i;
      if (v.includes('平均分')) col.avgScore = i;
      if (v.includes('人数')||v.includes('录取数')||v.includes('计划')) col.enrollment = i;
      if (v.includes('控挡')||v.includes('批次线')||v.includes('省控')) col.controlLine = i;
    });
    
    if (col.province === undefined && col.minScore === undefined) return;
    if (col.year === undefined) col.year = 0; // Will try to extract from context
    
    $(tbl).find('tr').each((ri, row) => {
      if (ri === 0) return;
      const cells = [];
      $(row).find('td').each((j, cell) => cells.push($(cell).text().trim()));
      if (cells.length < 3) return;
      
      const year = col.year !== undefined ? parseInt(cells[col.year] || '0') : 0;
      let province = col.province !== undefined ? (cells[col.province] || '').trim() : '';
      const category = col.category !== undefined ? (cells[col.category] || '').trim() : '';
      const major = col.major !== undefined ? (cells[col.major] || '').trim() : '';
      const minScore = col.minScore !== undefined ? parseInt(cells[col.minScore] || '0') : 0;
      const minRank = col.minRank !== undefined ? parseInt((cells[col.minRank] || '0').replace(/,/g, '')) : 0;
      const avgScore = col.avgScore !== undefined ? parseInt(cells[col.avgScore] || '0') : 0;
      const enrollment = col.enrollment !== undefined ? parseInt(cells[col.enrollment] || '0') : 0;
      
      // Skip header-like rows
      if (year > 2030 || year < 2018 || !year) return;
      if (!province || province === '省份' || province.length > 4) return;
      if (!minScore || minScore < 100 || minScore > 800) return;
      
      records.push({
        universityId: uniId,
        year, province: PROVINCE_MAP[province] || province,
        category: category || '物理类',
        major, minScore, avgScore, minRank, enrollment,
      });
    });
  });
  
  return records;
}

// ==================== 解析 Text 格式 ====================
function parseTextFormat($, uniId, text) {
  const records = [];
  
  // Extract year sections
  // Pattern: 二、2023清华大学录取分数线 or ## year headings
  let currentYear = 0;
  const lines = text.split('\n').filter(l => l.trim());
  
  for (const line of lines) {
    const yearMatch = line.match(/(\d{4})年/);
    if (yearMatch) currentYear = parseInt(yearMatch[1]);
    if (currentYear < 2021 || currentYear > 2025) continue;
    
    // Extract province scores
    // Pattern: "湖北：物理组692分；物化组690分；不限组670分；"
    const provScores = line.match(/([^\d;：]+)[：:]\s*((?:[^；]+分[；;]?\s*)+)/);
    if (!provScores) continue;
    
    const province = provScores[1].trim();
    const scores = provScores[2].trim();
    
    if (!PROVINCE_MAP[province] || PROVINCE_MAP[province] !== province) continue;
    
    // Extract all scores
    const scoreMatch = scores.match(/(\d+)分/g);
    if (scoreMatch) {
      const nums = scoreMatch.map(s => parseInt(s));
      // Take the lowest and average
      const minScore = Math.min(...nums);
      const avgScore = Math.round(nums.reduce((a,b)=>a+b,0) / nums.length);
      
      records.push({
        universityId: uniId,
        year: currentYear,
        province,
        category: '物理类',
        major: '',
        minScore, avgScore, minRank: 0, enrollment: 0,
      });
    }
  }
  
  return records;
}

// ==================== 爬取单篇文章 ====================
async function crawlArticle(url, uniId, uniName) {
  for (let retry = 0; retry < 3; retry++) {
    try {
      const res = await axios.get(url, {
        headers: {
          'User-Agent': UAs[Math.floor(Math.random() * UAs.length)],
          'Accept-Language': 'zh-CN,zh;q=0.9',
        },
        timeout: 15000,
      });
      
      const $ = cheerio.load(res.data);
      const tables = $('table');
      const contentText = $('.content').text() || $('#article .content').text() || $('body').text();
      
      // Try table format first
      if (tables.length > 0) {
        const records = parseTableFormat($, uniId, tables);
        if (records.length > 0) {
          console.log(`  [TABLE] ${uniName}: ${records.length} records`);
          return records;
        }
      }
      
      // Fall back to text format
      const textRecords = parseTextFormat($, uniId, contentText);
      if (textRecords.length > 0) {
        console.log(`  [TEXT] ${uniName}: ${textRecords.length} records`);
        return textRecords;
      }
      
      console.log(`  [EMPTY] ${uniName}: No data found`);
      return [];
      
    } catch (e) {
      if (retry < 2) {
        await sleep(3000 * (retry + 1));
      } else {
        console.log(`  [FAIL] ${uniName}: ${e.message}`);
        return [];
      }
    }
  }
}

// ==================== 主流程 ====================
async function main() {
  // Load article map
  const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));
  const entries = Object.entries(map.matched);
  
  // Load existing progress
  const progressFile = path.join(OUT_DIR, 'progress.json');
  let progress = {};
  if (fs.existsSync(progressFile)) {
    progress = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
    console.log(`Resuming from progress: ${Object.keys(progress).length} crawled`);
  }
  
  console.log(`Total to crawl: ${entries.length}\n`);
  
  const allData = {};
  let consecutiveErrors = 0;
  
  for (const [uniId, article] of entries) {
    // Skip if already crawled
    if (progress[uniId]) {
      if (progress[uniId].records > 0) allData[uniId] = article; // Already have data
      continue;
    }
    
    console.log(`[${Object.keys(progress).length + 1}/${entries.length}] ${article.uniName}...`);
    
    const records = await crawlArticle(article.url, uniId, article.uniName);
    
    progress[uniId] = { url: article.url, uniName: article.uniName, records: records.length };
    
    if (records.length > 0) {
      allData[uniId] = records;
      consecutiveErrors = 0;
    } else {
      consecutiveErrors++;
    }
    
    // Save progress periodically
    if (Object.keys(progress).length % 20 === 0) {
      fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2), 'utf-8');
      // Save partial data
      const out = flattenRecords(allData);
      fs.writeFileSync(path.join(OUT_DIR, `records-${Object.keys(progress).length}.json`), JSON.stringify(out, null, 2), 'utf-8');
      console.log(`  Checkpoint saved. Total records: ${out.length}`);
    }
    
    // Anti-crawl delay: 1.5-3 seconds
    const delay = 1500 + Math.random() * 1500;
    if (consecutiveErrors < 3) await sleep(delay);
    else await sleep(5000); // Longer delay after errors
  }
  
  // Final save
  const finalRecords = flattenRecords(allData);
  fs.writeFileSync(path.join(OUT_DIR, 'all-records.json'), JSON.stringify(finalRecords, null, 2), 'utf-8');
  fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2), 'utf-8');
  
  console.log(`\n=== Done! Total records: ${finalRecords.length} ===`);
}

function flattenRecords(data) {
  const out = [];
  for (const records of Object.values(data)) {
    if (Array.isArray(records)) out.push(...records);
  }
  return out;
}

main().catch(e => console.error('Fatal:', e.message));
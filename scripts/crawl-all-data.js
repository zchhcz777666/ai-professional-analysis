/**
 * 完整爬虫：爬取 dxsbb.com 上所有高校的录取数据
 * 支持 Table 格式和 Text 格式
 * 
 * 运行: node scripts/crawl-all-data.js
 * 
 * 输出: scripts/crawled-data/all-records.json
 */
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const UAs = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
];
const sleep = ms => new Promise(r => setTimeout(r, ms));

const OUT_DIR = path.join(__dirname, 'crawled-data');
const MAP_FILE = path.join(OUT_DIR, 'uni-article-map-full.json');

const PROVINCES = '北京|天津|河北|山西|内蒙古|辽宁|吉林|黑龙江|上海|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|广西|海南|重庆|四川|贵州|云南|西藏|陕西|甘肃|青海|宁夏|新疆';
const PROV_MAP = {};
for (const p of PROVINCES.split('|')) PROV_MAP[p] = p;

// ==================== Table格式解析 ====================
function parseTables($, uniId) {
  const records = [];
  
  $('table').each((ti, tbl) => {
    const hdrs = []; // 表头
    $(tbl).find('tr:first-child th, tr:first-child td').each((j, c) => hdrs.push($(c).text().trim()));
    const hs = hdrs.join(' ');
    if (!hs.includes('最低分') && !hs.includes('最低分数')) return;
    
    const col = {};
    hdrs.forEach((v, i) => {
      if (v.includes('年份')||/^20\d{2}$/.test(v)) col.year=i;
      if (v.includes('省份')||v.includes('生源地')||v.includes('地区')) col.prov=i;
      if (v.includes('科类')||v.includes('选科')) col.cat=i;
      if (v.includes('专业')) col.major=i;
      if (v.includes('最低分')&&!v.includes('位次')&&!v.includes('排名')) col.min=i;
      if (v.includes('位次')||v.includes('排名')) col.rank=i;
      if (v.includes('平均分')) col.avg=i;
      if (v.includes('人数')||v.includes('计划')||v.includes('录取数')) col.enroll=i;
    });
    
    if (col.prov===undefined&&col.min===undefined) return;
    
    $(tbl).find('tr').each((ri, row) => {
      if (ri===0) return;
      const cells=[]; $(row).find('td').each((j,c)=>cells.push($(c).text().trim()));
      if (cells.length<3) return;
      
      const year = col.year!==undefined ? parseInt(cells[col.year]||'0') : 0;
      let prov = col.prov!==undefined ? (cells[col.prov]||'').trim() : '';
      const min = col.min!==undefined ? parseInt(cells[col.min]||'0') : 0;
      const rank = col.rank!==undefined ? parseInt((cells[col.rank]||'0').replace(/,/g,'')) : 0;
      const avg = col.avg!==undefined ? parseInt(cells[col.avg]||'0') : 0;
      const enroll = col.enroll!==undefined ? parseInt(cells[col.enroll]||'0') : 0;
      const major = col.major!==undefined ? (cells[col.major]||'') : '';
      const cat = col.cat!==undefined ? (cells[col.cat]||'') : '';
      
      if (year<2019||year>2026||!prov||min<100||min>800) return;
      
      records.push({
        universityId: uniId, year,
        province: PROV_MAP[prov] || prov,
        category: cat||'物理类',
        major, minScore: min, avgScore: avg||min,
        minRank: rank, enrollment: enroll
      });
    });
  });
  
  return records;
}

// ==================== Text格式解析 ====================
function parseText($, uniId) {
  const text = $('.content').text() || $('#article .content').text() || $('body').text();
  if (!text) return [];
  
  const records = [];
  const lines = text.replace(/\s+/g, ' ').split(/[。；;]/);
  
  // Find year sections
  let currentYear = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Check for year header
    const yearMatch = trimmed.match(/(\d{4})年/);
    if (yearMatch) currentYear = parseInt(yearMatch[1]);
    if (currentYear<2021||currentYear>2025) continue;
    
    // Extract province scores
    // Pattern: "北京不限II组--697" or "山西一批664692-" or "湖北物理组692分"
    const provPattern = new RegExp(`(${PROVINCES})[^\\d]*?(\\d{3})`);
    const match = trimmed.match(provPattern);
    if (match) {
      const prov = match[1];
      const score = parseInt(match[2]);
      if (score>=100&&score<=800) {
        // Check if there are multiple scores (e.g. 文科664理科692)
        const scores = trimmed.match(/\d{3}/g);
        if (scores) {
          const nums = scores.map(s=>parseInt(s)).filter(s=>s>=100&&s<=800);
          if (nums.length>0) {
            records.push({
              universityId: uniId, year: currentYear,
              province: PROV_MAP[prov]||prov,
              category: '物理类', major: '',
              minScore: Math.min(...nums),
              avgScore: Math.round(nums.reduce((a,b)=>a+b,0)/nums.length),
              minRank: 0, enrollment: 0,
            });
          }
        }
      }
    }
  }
  
  // Remove duplicates (same uni+year+province)
  const seen = new Set();
  return records.filter(r => {
    const key = `${r.year}-${r.province}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ==================== 爬取单篇文章 ====================
async function crawlArticle(url, uniId, uniName) {
  for (let retry=0; retry<3; retry++) {
    try {
      const res = await axios.get(url, {
        headers: { 'User-Agent': UAs[Math.floor(Math.random()*UAs.length)] },
        timeout: 12000
      });
      const $ = cheerio.load(res.data);
      
      // Try table format
      if ($('table').length>0) {
        const tbl = parseTables($, uniId);
        if (tbl.length>0) return { format: 'table', records: tbl };
      }
      
      // Try text format
      const txt = parseText($, uniId);
      if (txt.length>0) return { format: 'text', records: txt };
      
      return { format: 'none', records: [] };
    } catch(e) {
      if (retry<2) await sleep(2000*(retry+1));
      else return { format: 'error', error: e.message, records: [] };
    }
  }
}

// ==================== 主流程 ====================
async function main() {
  const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));
  const entries = Object.entries(map.matched);
  
  const progressFile = path.join(OUT_DIR, 'crawl-progress.json');
  const dataFile = path.join(OUT_DIR, 'all-records.json');
  
  let progress = {};
  let allData = {};
  
  if (fs.existsSync(progressFile)) {
    progress = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
    if (fs.existsSync(dataFile)) {
      const existing = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
      // Re-group by universityId
      for (const rec of existing) {
        if (!allData[rec.universityId]) allData[rec.universityId] = [];
        allData[rec.universityId].push(rec);
      }
    }
    console.log(`Resuming: ${Object.keys(progress).length}/${entries.length} done, ${Object.keys(allData).length} with data`);
  }
  
  let tableCount=0, textCount=0, emptyCount=0, errorCount=0;
  
  for (const [uniId, article] of entries) {
    if (progress[uniId]) {
      if (progress[uniId].format==='table') tableCount++;
      else if (progress[uniId].format==='text') textCount++;
      else if (progress[uniId].format==='none') emptyCount++;
      else errorCount++;
      continue;
    }
    
    process.stdout.write(`[${Object.keys(progress).length+1}/${entries.length}] ${article.uniName}...`);
    
    const result = await crawlArticle(article.url, uniId, article.uniName);
    
    progress[uniId] = { url: article.url, uniName: article.uniName, format: result.format };
    
    if (result.format==='table') {
      console.log(` ${result.records.length} records [TABLE]`);
      tableCount++;
      allData[uniId] = result.records;
    } else if (result.format==='text') {
      console.log(` ${result.records.length} records [TEXT]`);
      textCount++;
      if (result.records.length>0) allData[uniId] = result.records;
    } else if (result.format==='none') {
      console.log(` [EMPTY]`);
      emptyCount++;
    } else {
      console.log(` [ERROR: ${result.error}]`);
      errorCount++;
    }
    
    // Save checkpoint
    if (Object.keys(progress).length % 30 === 0) {
      fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
      const flat = Object.values(allData).flat();
      fs.writeFileSync(dataFile, JSON.stringify(flat, null, 2));
      console.log(`  CP: ${flat.length} records saved`);
    }
    
    await sleep(1200+Math.random()*1500);
  }
  
  // Final save
  const flat = Object.values(allData).flat();
  fs.writeFileSync(dataFile, JSON.stringify(flat, null, 2));
  fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
  
  console.log(`\n=== Done! ===`);
  console.log(`Table: ${tableCount}, Text: ${textCount}, Empty: ${emptyCount}, Error: ${errorCount}`);
  console.log(`Total records: ${flat.length}`);
}

main().catch(e => console.error('Fatal:', e.message));
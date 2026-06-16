/**
 * 测试爬取前 30 篇文章，验证解析效果
 * 运行: node scripts/test-crawl-batch.js
 */
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'crawled-data');
const MAP_FILE = path.join(OUT_DIR, 'uni-article-map-full.json');
const sleep = ms => new Promise(r => setTimeout(r, ms));

const PROVINCE_MAP = {
  '北京':'北京','天津':'天津','河北':'河北','山西':'山西','内蒙古':'内蒙古',
  '辽宁':'辽宁','吉林':'吉林','黑龙江':'黑龙江',
  '上海':'上海','江苏':'江苏','浙江':'浙江','安徽':'安徽','福建':'福建','江西':'江西','山东':'山东',
  '河南':'河南','湖北':'湖北','湖南':'湖南',
  '广东':'广东','广西':'广西','海南':'海南',
  '重庆':'重庆','四川':'四川','贵州':'贵州','云南':'云南','西藏':'西藏',
  '陕西':'陕西','甘肃':'甘肃','青海':'青海','宁夏':'宁夏','新疆':'新疆',
};

async function crawl(url, uniId, uniName) {
  for (let r = 0; r < 2; r++) {
    try {
      const res = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' },
        timeout: 10000
      });
      const $ = cheerio.load(res.data);
      
      // Try table format
      const records = [];
      $('table').each((ti, tbl) => {
        const hdrs = [];
        $(tbl).find('tr:first-child th, tr:first-child td').each((j, cell) => hdrs.push($(cell).text().trim()));
        const hs = hdrs.join(' ');
        if (!hs.includes('最低分') || !hs.includes('专业') && !hs.includes('省份')) return;
        
        const col = {};
        hdrs.forEach((v, i) => {
          if (v.includes('年份')||/^20\d{2}$/.test(v)) col.year=i;
          if (v.includes('省份')) col.prov=i;
          if (v.includes('科类')) col.cat=i;
          if (v.includes('专业')) col.major=i;
          if (v.includes('最低分')&&!v.includes('位次')) col.min=i;
          if (v.includes('位次')||v.includes('排名')) col.rank=i;
        });
        
        if (col.prov===undefined && col.min===undefined) return;
        
        $(tbl).find('tr').each((ri, row) => {
          if (ri===0) return;
          const cells=[]; $(row).find('td').each((j,c)=>cells.push($(c).text().trim()));
          if (cells.length<3) return;
          const year = parseInt(cells[col.year]||'0');
          const prov = PROVINCE_MAP[cells[col.prov]] || '';
          const min = parseInt(cells[col.min]||'0');
          if (year<2020||year>2026||!prov||min<100) return;
          records.push({
            universityId: uniId,
            year, province: prov,
            category: col.cat!==undefined ? cells[col.cat]||'物理类' : '物理类',
            major: col.major!==undefined ? cells[col.major]||'' : '',
            minScore: min,
            minRank: col.rank!==undefined ? parseInt((cells[col.rank]||'0').replace(/,/g,'')) : 0,
          });
        });
      });
      
      return { format: records.length>0?'table':'text', records };
      
    } catch(e) {
      if (r<1) await sleep(2000);
      else return { format: 'error', error: e.message, records:[] };
    }
  }
}

async function main() {
  const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));
  const entries = Object.entries(map.matched);
  
  console.log(`Testing first 30 articles...\n`);
  
  let totalRecords = 0;
  let tableCount = 0, textCount = 0, emptyCount = 0;
  
  for (let i = 0; i < 30; i++) {
    const [id, art] = entries[i];
    const result = await crawl(art.url, id, art.uniName);
    
    if (result.format === 'table') {
      console.log(`[${i+1}] [TABLE] ${art.uniName}: ${result.records.length} records`);
      tableCount++;
      totalRecords += result.records.length;
    } else if (result.format === 'text') {
      console.log(`[${i+1}] [TEXT]  ${art.uniName}: ${result.records.length} records`);
      textCount++;
    } else {
      console.log(`[${i+1}] [EMPTY] ${art.uniName}: ${result.error||'no data'}`);
      emptyCount++;
    }
    
    await sleep(1500+Math.random()*1000);
  }
  
  console.log(`\nSummary:`);
  console.log(`  Table format: ${tableCount}/30 (${totalRecords} records)`);
  console.log(`  Text format: ${textCount}/30`);
  console.log(`  Empty: ${emptyCount}/30`);
}

main().catch(e => console.error('Fatal:', e.message));
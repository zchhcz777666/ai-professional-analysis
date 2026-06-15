/**
 * 测试爬取一篇完整文章，了解数据量和结构
 */
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function main() {
  const url = 'https://www.dxsbb.com/news/31641.html'; // 清华大学
  
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' },
    timeout: 15000
  });
  
  const $ = cheerio.load(res.data);
  console.log(`Title: ${$('title').text()}`);
  console.log(`HTML size: ${res.data.length} bytes`);
  
  let totalRows = 0;
  let aiRows = [];
  
  $('table').each((ti, tbl) => {
    const headers = [];
    $(tbl).find('tr:first-child th, tr:first-child td').each((j, cell) => {
      headers.push($(cell).text().trim());
    });
    
    const headerStr = headers.join(' ');
    if (!headerStr.includes('最低分') && !headerStr.includes('专业')) return;
    
    // Find column indices
    const idx = {};
    headers.forEach((h, i) => {
      if (h.includes('年份') || /^20\d{2}$/.test(h)) idx.year = i;
      if (h.includes('省份')) idx.province = i;
      if (h.includes('科类') || h.includes('选科')) idx.category = i;
      if (h.includes('专业')) idx.major = i;
      if (h.includes('最低分')) idx.minScore = /位次|排名/.test(headerStr) ? i : i;
      if (h.includes('最低分位次') || h.includes('最低排名')) idx.minRank = i;
      if (h.includes('平均分')) idx.avgScore = i;
      if (h.includes('录取人数')) idx.enrollment = i;
    });
    
    console.log(`\nTable ${ti}: cols=${headers.length} | ${headers.join(', ')}`);
    
    let tableRows = 0;
    $(tbl).find('tr').each((ri, row) => {
      if (ri === 0) return;
      const cells = [];
      $(row).find('td').each((j, cell) => cells.push($(cell).text().trim()));
      if (cells.length < 3) return;
      
      tableRows++;
      totalRows++;
      
      const major = idx.major !== undefined ? (cells[idx.major] || '') : '';
      const year = idx.year !== undefined ? parseInt(cells[idx.year] || '0') : 0;
      const province = idx.province !== undefined ? (cells[idx.province] || '') : '';
      const minScore = idx.minScore !== undefined ? parseInt(cells[idx.minScore] || '0') : 0;
      const minRank = idx.minRank !== undefined ? parseInt((cells[idx.minRank] || '0').replace(/,/g, '')) : 0;
      
      // Check if AI related
      if (major.includes('人工智能') || major.includes('计算机') || major.includes('智能') || major.includes('电子') || major.includes('自动化')) {
        aiRows.push({ year, province, major, minScore, minRank, table: ti, row: ri });
      }
    });
    
    console.log(`  Rows: ${tableRows}`);
  });
  
  console.log(`\n\nTotal rows (all majors): ${totalRows}`);
  console.log(`AI-related rows: ${aiRows.length}`);
  console.log(`\nSample AI rows:`);
  aiRows.slice(0, 20).forEach(r => console.log(`  ${r.year} ${r.province}: ${r.major} - ${r.minScore}分/${r.minRank}名`));
  
  // Show provinces covered
  const provinces = [...new Set(aiRows.map(r => r.province))];
  console.log(`\nProvinces covered by AI majors: ${provinces.join(', ')}`);
  
  // Show years covered
  const years = [...new Set(aiRows.map(r => r.year))].sort();
  console.log(`Years covered: ${years.join(', ')}`);
}

main().catch(e => console.error('Fatal:', e.message));
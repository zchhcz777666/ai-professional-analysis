/**
 * 检查文本格式文章的原始内容
 */
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function check(url, name) {
  const res = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36' },
    timeout: 10000
  });
  const $ = cheerio.load(res.data);
  
  const pCount = $('.content p, #article .content p').length;
  const text = ($('.content').text() || $('#article .content').text() || '').trim();
  
  console.log(`\n=== ${name} ===`);
  console.log(`Title: ${$('title').text()}`);
  console.log(`P tags: ${pCount}, Text length: ${text.length}`);
  console.log(`\nFirst 1000 chars of content:`);
  console.log(text.substring(0, 1000));
  console.log(`\n---`);
  console.log(text.substring(1000, 2000));
}

async function main() {
  // Check a few text format schools
  await check('https://www.dxsbb.com/news/31640.html', '北京大学'); // PKU - from article-map
  // Also try fetching the map to get correct URLs
}

main().catch(e => console.error(e.message));
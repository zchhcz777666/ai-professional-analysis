const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': 'https://gaokao.chsi.com.cn/',
  };

  // Get the full page and print all inline script contents
  const url = 'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score';
  const res = await axios.get(url, { headers, timeout: 15000 });
  const $ = cheerio.load(res.data);
  
  console.log('=== ALL inline scripts content ===');
  $('script').each((i, script) => {
    const content = $(script).html() || '';
    if (content.trim()) {
      console.log(`\n--- Script #${i} (${content.length} chars) ---`);
      console.log(content.substring(0, 5000));
    }
  });
  
  // Check for Vue component templates
  console.log('\n\n=== Looking for Vue templates with score-related content ===');
  const html = res.data;
  
  // Get all content specifically for the tab=score section
  const matchScore = html.match(/tab=score[\s\S]{0,5000}/);
  if (matchScore) {
    console.log('Context around tab=score:');
    console.log(matchScore[0].substring(0, 3000));
  }
}

test();
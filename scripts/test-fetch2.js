const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': 'https://gaokao.chsi.com.cn/',
  };

  console.log('=== Examining page structure ===');
  try {
    const url = 'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score';
    const res = await axios.get(url, { headers, timeout: 15000 });
    const $ = cheerio.load(res.data);
    
    // Check for script tags
    console.log(`Script tags: ${$('script').length}`);
    
    // Find scripts that might load data
    $('script').each((i, script) => {
      const src = $(script).attr('src') || '';
      const content = $(script).html() || '';
      if (src.includes('score') || src.includes('admission') || src.includes('data') || 
          content.includes('score') || content.includes('data') || content.includes('ajax') || content.includes('fetch') || content.includes('XMLHttp')) {
        console.log(`\nRelevant script #${i}:`);
        console.log(`  src: ${src.substring(0, 200)}`);
        console.log(`  content preview: ${content.substring(0, 300)}`);
      }
    });

    // Print all unique div IDs and classes that might contain data
    const containers = [];
    $('div[id], div[class]').each((i, div) => {
      const id = $(div).attr('id') || '';
      const cls = $(div).attr('class') || '';
      const text = $(div).text().trim().substring(0, 50);
      if (id || cls) {
        containers.push({ id: id.substring(0, 40), class: cls.substring(0, 40), text: text.substring(0, 30) });
      }
    });
    console.log(`\nDiv containers: ${containers.length}`);
    containers.filter(c => c.id.toLowerCase().includes('score') || c.id.toLowerCase().includes('tab') || c.id.toLowerCase().includes('data') || c.class.toLowerCase().includes('score') || c.class.toLowerCase().includes('tab')).forEach(c => {
      console.log(`  id="${c.id}" class="${c.class}" text="${c.text}"`);
    });

    // Look for API endpoints in the HTML and scripts
    const fullHtml = res.data;
    const apiMatches = fullHtml.match(/api|ajax|fetch|axios|\/sch\//gi);
    console.log(`\nAPI-related keywords found: ${apiMatches ? apiMatches.length : 0}`);
    
    // Look specifically for data-loading patterns
    const dataPatterns = [
      /url.*score|score.*url/gi,
      /load.*data|data.*load/gi,
      /get.*score|score.*get/gi,
      /provinceId|province_id/gi,
      /tab=score/gi,
    ];
    dataPatterns.forEach((pattern, i) => {
      const matches = fullHtml.match(pattern);
      if (matches) {
        console.log(`Pattern ${i}: found ${matches.length} matches`);
      }
    });

    // Try to find if there's an iframe or embed
    console.log(`\nIFrames: ${$('iframe').length}`);
    console.log(`Embeds: ${$('embed').length}`);
    console.log(`Objects: ${$('object').length}`);

    // Print all external script sources
    console.log('\nExternal scripts:');
    $('script[src]').each((i, script) => {
      const src = $(script).attr('src') || '';
      console.log(`  ${src.substring(0, 150)}`);
    });

  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

test();
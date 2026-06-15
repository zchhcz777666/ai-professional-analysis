const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  };

  const url = 'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score';
  const res = await axios.get(url, { headers, timeout: 15000 });
  const $ = cheerio.load(res.data);

  // Print the HTML structure around the main content area
  // Look for #app, .content, .main, .yxk-detail-con, score-related elements
  console.log('=== Main page structure ===');
  const mainSelectors = ['#app', '#content', '.content', '.main', '.yxk-detail', '.score', '#score', '#tab_score', '.ch-table'];
  
  for (const sel of mainSelectors) {
    const el = $(sel);
    if (el.length > 0) {
      console.log(`\n${sel}: ${el.length} elements`);
      console.log(el.first().html()?.substring(0, 2000) || 'empty');
    }
  }

  // Look for all elements with id or class containing "score" or "tab"
  console.log('\n=== Elements with score/tab related IDs/classes ===');
  $('[id*="score" i], [class*="score" i], [id*="tab" i], [class*="tab" i], [id*="fenshu" i], [class*="fenshu" i]').each((i, el) => {
    const tag = el.name;
    const id = $(el).attr('id') || '';
    const cls = $(el).attr('class') || '';
    const html = $(el).html()?.substring(0, 300) || '';
    console.log(`  <${tag}> id="${id}" class="${cls}": ${html}`);
  });

  // Look for the "历年分数线" tab content specifically 
  console.log('\n=== Searching for "历年分数" in HTML ===');
  const idx = res.data.indexOf('历年分数');
  if (idx >= 0) {
    console.log(`Found at index ${idx}, context:\n${res.data.substring(Math.max(0, idx-200), idx + 2000)}`);
  }
  
  // Look for Vue template or data binding
  console.log('\n=== Searching for Vue data bindings ===');
  const vuePatterns = [
    /v-for|v-bind|v-model|v-if|v-show|v-html/gi,
    /{{[\s\S]{0,100}?}}/g,
  ];
  for (const pattern of vuePatterns) {
    let match;
    while ((match = pattern.exec(res.data)) !== null) {
      console.log(`Vue binding: ${match[0].substring(0, 150)}`);
    }
  }

  // Print raw HTML around the score tab navigation
  console.log('\n=== Tab navigation HTML ===');
  const tabMatch = res.data.match(/<div[^>]*class="[^"]*tab[^"]*"[^>]*>[\s\S]{0,3000}?<\/div>/i);
  if (tabMatch) {
    console.log(tabMatch[0].substring(0, 3000));
  }
}

test();
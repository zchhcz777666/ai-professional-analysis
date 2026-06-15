const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': 'https://gaokao.chsi.com.cn/',
  };

  console.log('=== Searching for score/admission related content ===');
  try {
    const url = 'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score';
    const res = await axios.get(url, { headers, timeout: 15000 });
    const html = res.data;
    const $ = cheerio.load(html);
    
    // Search for keywords related to scores
    const keywords = ['分数线', '录取', '最低分', '平均分', '位次', 'score', 'table', '历年', '专业名称'];
    for (const kw of keywords) {
      const regex = new RegExp(kw, 'gi');
      const matches = html.match(regex);
      if (matches) {
        console.log(`Keyword "${kw}": found ${matches.length} matches`);
        
        // Show context around first match
        const idx = html.search(regex);
        if (idx >= 0) {
          const start = Math.max(0, idx - 50);
          const end = Math.min(html.length, idx + 100);
          console.log(`  Context: ...${html.substring(start, end)}...`);
        }
      }
    }

    // Check if there's a score/fenshuxian sub-page
    console.log('\n=== Trying score sub-pages ===');
    
    // Try the category-based pages
    const testUrls = [
      'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3,categoryId-36665,mindex-4.dhtml',  // 录取规则
      'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3,categoryId-36660,mindex-5.dhtml',  // maybe scores
    ];
    
    for (const testUrl of testUrls) {
      try {
        const r = await axios.get(testUrl, { headers, timeout: 10000 });
        const $$ = cheerio.load(r.data);
        const tables = $$('table');
        console.log(`\n${testUrl.substring(0, 100)}: ${tables.length} tables`);
        if (tables.length > 0) {
          $$('table').each((i, table) => {
            const headerTexts = [];
            $$(table).find('tr').first().find('th').each((j, th) => {
              headerTexts.push($$(th).text().trim());
            });
            console.log(`  Table ${i}: [${headerTexts.join(', ').substring(0, 100)}]`);
          });
        }
      } catch (err) {
        console.log(`\n${testUrl.substring(0, 100)}: Error - ${err.message}`);
      }
    }

    // Check for iframes that might load score data
    console.log('\n=== Checking for embedded content ===');
    const iframes = $('iframe');
    console.log(`Iframes: ${iframes.length}`);
    iframes.each((i, iframe) => {
      console.log(`  #${i}: src="${$(iframe).attr('src') || ''}"`);
    });

    // Print all unique link URLs that might be related to scores
    console.log('\n=== Score-related links ===');
    $('a').each((i, a) => {
      const href = $(a).attr('href') || '';
      const text = $(a).text().trim();
      if (href.includes('score') || href.includes('fenshu') || href.includes('fenShu') || href.includes('fsx') || text.includes('分数') || text.includes('录取')) {
        console.log(`  "${text.substring(0, 30)}" -> ${href.substring(0, 100)}`);
      }
    });

    // Check if the page uses location hash or dynamic loading for tab=score
    console.log('\n=== Checking tab logic ===');
    $('script').each((i, script) => {
      const content = $(script).html() || '';
      if (content.includes('tab') || content.includes('score')) {
        const lines = content.split('\n');
        lines.forEach((line, j) => {
          if (line.includes('tab') || line.includes('score')) {
            console.log(`Script #${i} L${j}: ${line.trim().substring(0, 200)}`);
          }
        });
      }
    });

  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

test();
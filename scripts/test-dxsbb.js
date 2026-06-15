const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  };

  console.log('=== 大学生必备网: 清华大学页面 ===');
  try {
    const res = await axios.get('https://www.dxsbb.com/news/10003.html', { headers, timeout: 10000 });
    const $ = cheerio.load(res.data);
    
    // Print page title
    console.log(`Title: ${$('title').text()}`);
    
    // Find content
    console.log(`\n=== Content analysis ===`);
    
    // Look for score/fenshu tables or text
    const keywords = ['分数', '录取', '最低', '平均', '位次', '排名', '招生', '专业'];
    for (const kw of keywords) {
      const elements = [];
      $('*').each((i, el) => {
        if (el.name === 'script' || el.name === 'style') return;
        const text = $(el).text().trim();
        if (text.includes(kw) && text.length < 200) {
          const parent = $(el).parent().text().trim();
          if (parent.length < 500) {
            elements.push(parent);
          }
        }
      });
      if (elements.length > 0) {
        console.log(`\n"${kw}" related content (${elements.length} items):`);
        elements.slice(0, 5).forEach((e, i) => console.log(`  ${i}: ${e.substring(0, 200)}`));
      }
    }

    // Find all links
    console.log(`\n=== All links (first 20) ===`);
    $('a[href]').each((i, a) => {
      if (i >= 20) return false;
      const href = $(a).attr('href') || '';
      const text = $(a).text().trim();
      if (text && !href.startsWith('#')) {
        console.log(`  ${text.substring(0, 30)} -> ${href.substring(0, 100)}`);
      }
    });

    // Check tables
    console.log(`\n=== Tables ===`);
    console.log(`Total tables: ${$('table').length}`);
    $('table').each((i, table) => {
      const headers = [];
      $(table).find('tr').first().find('th, td').each((j, td) => {
        headers.push($(td).text().trim());
      });
      console.log(`Table ${i}: ${headers.join(' | ').substring(0, 150)}`);
    });

  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

test();
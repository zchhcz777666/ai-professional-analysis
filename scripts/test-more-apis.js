const axios = require('axios');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  };

  // Try various known educational data APIs
  const apis = [
    // 中国教育在线掌上高考 API
    { name: 'eol school special score', url: 'https://api.eol.cn/gkcx/api?access_token=&keyword=%E6%B8%85%E5%8D%8E%E5%A4%A7%E5%AD%A6&page=1&size=10&type=&school_type=&uri=apidata/api/gk/school/special/scoreline&school_id=1&province_id=11&year=2024' },
    { name: 'eol provinceline', url: 'https://api.eol.cn/gkcx/api?access_token=&uri=apidata/api/gk/school/provinceline&school_id=1&province_id=11&year=2024' },
    { name: 'eol school proinfo', url: 'https://api.eol.cn/gkcx/api?access_token=&uri=apidata/api/gk/school/provinfo&school_id=1&province_id=11' },
    // 阳光高考可能的API
    { name: 'chsi wap score', url: 'https://gaokao.chsi.com.cn/wap/sch/score/3?provinceId=11&year=2024' },
    { name: 'chsi wap admission', url: 'https://gaokao.chsi.com.cn/wap/sch/admission/3?provinceId=11&year=2024' },
    // Alternative: get the score page as iframe content
    { name: 'chsi score iframe', url: 'https://gaokao.chsi.com.cn/sch/schoolInfoScore--schId-3.dhtml?provinceId=11&year=2024' },
    // Try the tab=score as a separate dhtml page
    { name: 'chsi tab score', url: 'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3,categoryId-36650,tag-score.dhtml' },
  ];

  for (const api of apis) {
    try {
      const res = await axios.get(api.url, { 
        headers: { ...headers, 'Accept': 'application/json, text/html, */*' },
        timeout: 8000 
      });
      const data = res.data;
      const type = res.headers['content-type'] || '';
      
      if (typeof data === 'object') {
        console.log(`\n${api.name}: JSON response`);
        console.log(`  Keys: ${Object.keys(data).join(', ')}`);
        if (data.data) {
          if (Array.isArray(data.data)) {
            console.log(`  data Array[${data.data.length}]`);
            if (data.data.length > 0) console.log(`  First: ${JSON.stringify(data.data[0]).substring(0, 300)}`);
          } else {
            console.log(`  data object: ${JSON.stringify(data.data).substring(0, 400)}`);
          }
        }
      } else if (typeof data === 'string') {
        console.log(`\n${api.name}: HTML/text (${data.length} chars)`);
        if (data.includes('省份') || data.includes('专业') || data.includes('分数') || data.includes('录取') || data.includes('select') || data.includes('table')) {
          console.log(`  Contains score-related keywords`);
          // Check for select options or table structure
          const $ = require('cheerio').load(data);
          const tables = $('table');
          const selects = $('select');
          console.log(`  Tables: ${tables.length}, Selects: ${selects.length}`);
          if (tables.length > 0) {
            $('table').each((i, t) => {
              const h = [];
              $(t).find('tr:first-child th, tr:first-child td').each((j, c) => h.push($(c).text().trim()));
              console.log(`  Table ${i}: [${h.join(', ').substring(0, 100)}]`);
            });
          }
        }
      }
    } catch (e) {
      // silently skip
    }
  }

  // One more attempt: try to fetch the page with ?tab=score as AJAX
  console.log('\n\n=== Trying XHR with tab=score ===');
  try {
    const res = await axios.get('https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score', {
      headers: {
        ...headers,
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'text/html, */*',
      },
      timeout: 10000
    });
    const html = res.data;
    console.log(`HTML length: ${html.length}`);
    
    // Check for hidden data
    if (html.includes('score') || html.includes('Score')) {
      console.log('Contains "score" keyword');
    }
    
    // Use cheerio to check for any hidden inputs or data attributes
    const $ = require('cheerio').load(html);
    const hiddenInputs = $('input[type="hidden"]');
    console.log(`Hidden inputs: ${hiddenInputs.length}`);
    hiddenInputs.each((i, inp) => {
      console.log(`  ${$(inp).attr('name') || ''} = ${$(inp).attr('value') || ''}`);
    });
    
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

test();
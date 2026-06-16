const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': 'https://gaokao.chsi.com.cn/',
  };

  console.log('=== Test 1: 清华大学 AI专业录取数据 (北京, 2024) ===');
  try {
    const url1 = 'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?provinceId=11&year=2024&tab=score';
    const res1 = await axios.get(url1, { headers, timeout: 15000 });
    console.log(`Status: ${res1.status}, HTML length: ${res1.data.length}`);
    
    const $ = cheerio.load(res1.data);
    
    // 查找所有table
    console.log(`\nTables found: ${$('table').length}`);
    $('table').each((i, table) => {
      const classAttr = $(table).attr('class') || '(no class)';
      const headers = [];
      $(table).find('tr').first().find('th').each((j, th) => {
        headers.push($(th).text().trim());
      });
      if (headers.length > 0) {
        console.log(`  Table #${i}: class="${classAttr}", headers: [${headers.join(', ').substring(0, 100)}]`);
        // 统计行数
        const rows = $(table).find('tr').length;
        console.log(`  Rows: ${rows}`);
      }
    });

    // 查找包含"专业名称"或"最低分"的table
    console.log('\n--- Searching for admission tables ---');
    $('table').each((i, table) => {
      const html = $(table).html() || '';
      if (html.includes('专业名称') || html.includes('最低分') || html.includes('最低位次')) {
        console.log(`Found admission table #${i}:`);
        $(table).find('tr').each((j, tr) => {
          const cells = [];
          $(tr).find('th, td').each((k, td) => {
            cells.push($(td).text().trim());
          });
          console.log(`  Row ${j}: ${cells.join(' | ').substring(0, 200)}`);
        });
      }
    });

  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (err.response) {
      console.log(`Status: ${err.response.status}, Body preview: ${(err.response.data || '').toString().substring(0, 500)}`);
    }
  }

  console.log('\n=== Test 2: 使用搜索获取学校列表 ===');
  try {
    // 搜索清华大学看搜索结果
    const url2 = 'https://gaokao.chsi.com.cn/sch/search--ss-on,option-qg,searchType-1,start-0.dhtml?q=%E6%B8%85%E5%8D%8E';
    const res2 = await axios.get(url2, { headers, timeout: 15000 });
    const $2 = cheerio.load(res2.data);
    
    // 找所有包含schId的链接
    const schLinks = [];
    $2('a[href*="schId"]').each((i, a) => {
      const href = $2(a).attr('href') || '';
      const match = href.match(/schId-(\d+)/);
      if (match) {
        schLinks.push({ id: parseInt(match[1]), text: $2(a).text().trim().replace(/\s+/g, ' ') });
      }
    });
    console.log(`Found ${schLinks.length} school links`);
    schLinks.slice(0, 5).forEach(s => console.log(`  schId=${s.id}: ${s.text}`));
    
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }

  console.log('\n=== Test 3: 尝试不指定省份的录取页面 ===');
  try {
    const url3 = 'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-3.dhtml?tab=score';
    const res3 = await axios.get(url3, { headers, timeout: 15000 });
    console.log(`Status: ${res3.status}, HTML length: ${res3.data.length}`);
    
    const $3 = cheerio.load(res3.data);
    console.log(`Tables found: ${$3('table').length}`);
    $3('table').each((i, table) => {
      const headers = [];
      $(table).find('tr').first().find('th').each((j, th) => {
        headers.push($(th).text().trim());
      });
      if (headers.length > 0) {
        console.log(`  Table #${i}: headers: [${headers.join(', ').substring(0, 100)}]`);
      }
    });
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

test();
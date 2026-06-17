/**
 * 阳光高考 AJAX API 探索
 * 测试 wap/schinfo 接口和搜索页结构
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'crawled-data');
const COOKIE = fs.readFileSync(path.join(DATA_DIR, 'chsi-cookie.txt'), 'utf-8').trim();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function main() {
  // 1. wap/schinfo API — 学校详细信息
  console.log('=== wap/schinfo API ===');
  const r1 = await fetch('https://gaokao.chsi.com.cn/wap/sch/schinfo/1003', {
    headers: {
      'User-Agent': UA, 'Cookie': COOKIE,
      'Referer': 'https://gaokao.chsi.com.cn/sch/schoolInfo--schId-1003.dhtml',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });
  const d1 = await r1.text();
  console.log('Status:', r1.status);
  console.log('Response:', d1.substring(0, 800));

  // 2. 检查搜索页结构
  console.log('\n=== 搜索页学校列表 ===');
  const html = fs.readFileSync(path.join(DATA_DIR, 'chsi-search.html'), 'utf-8');
  
  // 找所有学校名称和 ID
  const nameMatches = [...html.matchAll(/>([\u4e00-\u9fa5]{2,8}(?:大学|学院))</g)].map(m => m[1]);
  console.log('校名出现:', [...new Set(nameMatches)].slice(0, 30));

  const idMatches = [...html.matchAll(/schId[=-](\d+)/g)].map(m => m[1]);
  console.log('schIds 出现:', [...new Set(idMatches)].slice(0, 20));

  // 找数据加载的 JS
  const jsBlocks = [...html.matchAll(/<script[^>]*>([\s\S]{50,2000}?)<\/script>/gi)];
  for (let i = 0; i < jsBlocks.length; i++) {
    const js = jsBlocks[i][1];
    if (js.includes('$.get') || js.includes('fetch(') || js.includes('ajax') || js.includes('/wap/')) {
      console.log(`\nJS块[${i}] 含 API 调用:`);
      console.log(js.substring(0, 600));
    }
  }

  // 3. 直接搜索特定大学
  console.log('\n=== 搜索指定大学 ===');
  const targetUnis = ['清华大学', '北京大学', '南京大学', '上海交通大学'];
  for (const name of targetUnis) {
    try {
      const r = await fetch(`https://gaokao.chsi.com.cn/sch/search--ss-on,option-qg,searchType-1,keyword-${encodeURIComponent(name)},start-0.dhtml`, {
        headers: { 'User-Agent': UA, 'Cookie': COOKIE },
      });
      const h = await r.text();
      const sid = h.match(/schId[-=](\d+)/);
      console.log(`${name}: status=${r.status}, schId=${sid ? sid[1] : 'not found'}`);
      // 保存第一所
      if (name === '清华大学') {
        fs.writeFileSync(path.join(DATA_DIR, `chsi-search-${name}.html`), h, 'utf-8');
      }
    } catch (e) {
      console.log(`${name}: error ${e.message}`);
    }
  }
}

main().catch(e => console.error('Error:', e.message));

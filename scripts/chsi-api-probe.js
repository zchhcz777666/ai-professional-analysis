/**
 * 阳光高考录取数据抓取 — 直接找 API
 * 通过移动端 wap 接口找到录取数据
 */
const fs = require('fs');
const path = require('path');
const DATA_DIR = path.join(__dirname, 'crawled-data');
const COOKIE = fs.readFileSync(path.join(DATA_DIR, 'chsi-cookie.txt'), 'utf-8').trim();
const UA = 'Mozilla/5.0';

const HEADERS = {
  'User-Agent': UA, 'Cookie': COOKIE,
  'Referer': 'https://gaokao.chsi.com.cn/',
};

async function fetchT(url, extra = {}) {
  const r = await fetch(url, { headers: { ...HEADERS, ...extra }, timeout: 10000 });
  return { status: r.status, text: await r.text(), url: r.url };
}

async function main() {
  console.log('=== 阳光高考 API 全面探测 ===\n');

  // === 1. 学校搜索功能 ===
  console.log('1. 搜索学校');
  // 搜索清华
  const r1 = await fetchT('https://gaokao.chsi.com.cn/sch/search.do?keyword=清华大学');
  console.log(`  搜索清华: ${r1.status}`);
  // 找 schId
  const sid = r1.text.match(/schId[-=](\d+)/);
  const name = r1.text.match(/>([^<]{2,10}(?:大学|学院))</);
  console.log(`  schId: ${sid ? sid[1] : '?'}, name: ${name ? name[1] : '?'}`);

  // === 2. 学校列表页（分省份/类别浏览）===
  console.log('\n2. 学校列表页');
  // 按省份浏览: 江苏省(32)
  const r2 = await fetchT('https://gaokao.chsi.com.cn/sch/search--ss-on,option-qg,searchType-1,.html?start=0&province=32');
  console.log(`  江苏学校: ${r2.status}, size=${r2.text.length}`);
  // 找学校 IDs
  const schools = [...r2.text.matchAll(/schId-(\d+)\.dhtml/g)].map(m => m[1]);
  const schoolsName = [...r2.text.matchAll(/schId-\d+,categoryId-\d+,mindex-\d\.dhtml[^>]*>([^<]+)</g)].map(m => m[1]);
  console.log(`  Schools found: ${[...new Set(schools)].length}, ex: ${[...new Set(schools)].slice(0,10)}`);
  console.log(`  Names: ${schoolsName.slice(0,10)}`);

  // === 3. 移动端接口 ===
  console.log('\n3. 移动端接口');
  const wapEndpoints = [
    'https://gaokao.chsi.com.cn/wap/sch/score/1003',
    'https://gaokao.chsi.com.cn/wap/sch/enroll/1003',
    'https://gaokao.chsi.com.cn/wap/sch/hire/1003',
    'https://gaokao.chsi.com.cn/wap/sch/plan/1003',
    'https://gaokao.chsi.com.cn/wap/sch/schinfo/1003',
    'https://gaokao.chsi.com.cn/wap/sch/scoreprovince',
  ];
  for (const url of wapEndpoints) {
    const r = await fetchT(url, { 'X-Requested-With': 'XMLHttpRequest' });
    console.log(`  ${url.split('/wap/sch/')[1]}: ${r.status} ${r.text.substring(0,100)}`);
  }

  // === 4. 实际录取数据 ===
  // 从搜索页获取学校列表，然后逐个获取录取信息
  console.log('\n4. 录取数据抓取测试');
  // 先找几所学校的真实 ID（从搜索页）
  // 清华在学信网的 yxdm = 10003, schId 可能不同
  // 试试通过 yxdm（院校代码）查询
  const testSchools = [
    { name: '南京大学', yxdm: '10284' },
    { name: '东南大学', yxdm: '10286' },
    { name: '南京理工大学', yxdm: '10288' },
    { name: '南京航空航天大学', yxdm: '10287' },
  ];
  for (const s of testSchools) {
    const r = await fetchT(`https://gaokao.chsi.com.cn/sch/search.do?keyword=${encodeURIComponent(s.name)}`);
    const sid = r.text.match(/schId-(\d+)/);
    console.log(`  ${s.name}: schId=${sid ? sid[1] : '?'}`);
  }

  console.log('\n✅ 探测完成');
}

main().catch(e => console.error('Error:', e.message));

/**
 * eol.cn 跨省录取数据爬取（简化调试版）
 */
const PROVINCE_IDS = {
  '北京': 11, '天津': 12, '河北': 13, '山西': 14, '内蒙古': 15,
  '辽宁': 21, '吉林': 22, '黑龙江': 23,
  '上海': 31, '江苏': 32, '浙江': 33, '安徽': 34, '福建': 35, '江西': 36, '山东': 37,
  '河南': 41, '湖北': 42, '湖南': 43, '广东': 44, '广西': 45, '海南': 46,
  '重庆': 50, '四川': 51, '贵州': 52, '云南': 53, '西藏': 54,
  '陕西': 61, '甘肃': 62, '青海': 63, '宁夏': 64, '新疆': 65,
};
const PROVINCE_NAMES = Object.fromEntries(Object.entries(PROVINCE_IDS).map(([k, v]) => [v, k]));
const ALL_PROVINCES = Object.entries(PROVINCE_IDS).map(([name, id]) => ({ name, id }));

const fs = require('fs');
const path = require('path');
const API_BASE = 'https://api.eol.cn/gkcx/api/';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchSchools() {
  const all = [];
  let page = 1;
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      const url = `${API_BASE}?page=${page}&request_type=1&school_type=6000&size=50&sort=view_total&uri=apidata/api/gk/school/lists`;
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      const d = await r.json();
      if (d.code === '1069' || d.code === 1069) {
        console.log(`限流，等待 30s... (attempt ${attempt + 1})`);
        await sleep(30000);
        continue;
      }
      if (!d.data?.item?.length) break;
      all.push(...d.data.item);
      const total = d.data.numFound || 0;
      console.log(`学校列表: ${all.length}/${total} (page ${page})`);
      if (all.length >= total) break;
      page++;
      await sleep(200);
    } catch (e) {
      console.log(`错误: ${e.message}, 重试...`);
      await sleep(5000);
    }
  }
  return all;
}

function buildIndex(schools) {
  const idx = {};
  for (const s of schools) {
    const n = s.name.replace(/[（(].*[)）]/g, '').replace(/\s+/g, '').trim();
    idx[n] = s;
    idx[s.name] = s;
  }
  return idx;
}

function loadOurUniversities() {
  const content = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'universities.ts'), 'utf-8');
  const map = {};
  const ids = [...content.matchAll(/id:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const names = [...content.matchAll(/name:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  for (let i = 0; i < Math.min(ids.length, names.length); i++) map[names[i]] = ids[i];
  return map;
}

async function fetchScore(schoolId, provId, year) {
  const url = `${API_BASE}?access_token=&local_province_id=${provId}&school_id=${schoolId}&signsafe=&uri=apidata/api/gk/score/province&year=${year}`;
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  return r.json();
}

async function main() {
  console.log('=== eol.cn 跨省录取数据爬取 ===\n');

  // 1. 加载学校匹配
  const ourMap = loadOurUniversities();
  console.log(`我们的大学: ${Object.keys(ourMap).length} 所`);

  console.log('获取 eol.cn 学校列表...');
  const eolSchools = await fetchSchools();
  console.log(`eol 学校: ${eolSchools.length} 所`);

  const eolIndex = buildIndex(eolSchools);
  const matched = [];
  for (const [name, id] of Object.entries(ourMap)) {
    let m = eolIndex[name] || eolIndex[name.replace(/[（(][^)）]*[)）]/g, '').trim()];
    if (!m) m = Object.values(eolIndex).find(s => s.name.includes(name) || name.includes(s.name));
    if (m) matched.push({ id, eolId: m.school_id });
  }
  console.log(`匹配成功: ${matched.length} / ${Object.keys(ourMap).length}\n`);

  if (matched.length === 0) {
    console.log('❌ 没有匹配到学校，退出');
    return;
  }

  // 2. 单省测试 — 江苏
  const TEST_PROV = { name: '江苏', id: 32 };
  console.log(`测试查询: ${TEST_PROV.name} (${matched.length} 所学校)`);

  const allRecords = [];
  for (let i = 0; i < matched.length; i++) {
    const school = matched[i];
    try {
      const data = await fetchScore(school.eolId, TEST_PROV.id, 2025);
      if (data.code === '1069' || data.code === 1069) {
        console.log(`  限流！已获取 ${allRecords.length} 条记录`);
        break;
      }
      const items = data.data?.item || [];
      for (const r of items) {
        const minScore = parseInt(r.min);
        if (isNaN(minScore) || minScore <= 0) continue;
        allRecords.push({
          universityId: school.id,
          province: TEST_PROV.name,
          year: 2025,
          minScore,
          minRank: parseInt(r.min_section) || 0,
          source: `eol-api:${TEST_PROV.name}考试院`,
        });
      }
      if ((i + 1) % 10 === 0) {
        console.log(`  进度: ${i + 1}/${matched.length}, 记录: ${allRecords.length}`);
      }
      await sleep(300);
    } catch (e) {
      console.log(`  ${school.id}: ${e.message}`);
    }
  }

  console.log(`\n✅ 完成! 共 ${allRecords.length} 条记录`);

  // 保存
  const outPath = path.join(__dirname, 'crawled-data', 'test-records.json');
  fs.writeFileSync(outPath, JSON.stringify(allRecords, null, 2), 'utf-8');
  console.log(`已保存: ${outPath}`);
}

main().catch(e => console.error('\n❌ 错误:', e));

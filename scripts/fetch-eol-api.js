/**
 * eol.cn JSON API 录取数据爬取器（跨省全量版）
 *
 * 对每所大学查询其在全部 31 个省份的录取数据
 * 含自动重试（限流恢复）、进度断点续传
 *
 * 运行: node scripts/fetch-eol-api.js
 * 输出: scripts/crawled-data/api-records.json
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
const UNI_TS_FILE = path.join(__dirname, '..', 'src', 'data', 'universities.ts');
const OUTPUT_FILE = path.join(__dirname, 'crawled-data', 'api-records.json');
const PROGRESS_FILE = path.join(__dirname, 'crawled-data', 'api-progress.json');
const CRAWLED_DIR = path.join(__dirname, 'crawled-data');
const API_BASE = 'https://api.eol.cn/gkcx/api/';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const CONCURRENCY = 5; // 并行请求数
const BATCH_DELAY_MS = 300; // 每批间隔

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function loadOurUniversities() {
  const content = fs.readFileSync(UNI_TS_FILE, 'utf-8');
  const map = {};
  const ids = [...content.matchAll(/id:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const names = [...content.matchAll(/name:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  for (let i = 0; i < Math.min(ids.length, names.length); i++) map[names[i]] = ids[i];
  return map;
}

async function fetchAllSchools() {
  const all = [];
  let page = 1;
  // 初始等待，让限流恢复
  await sleep(30000);
  while (true) {
    const url = `${API_BASE}?page=${page}&request_type=1&school_type=6000&size=30&sort=view_total&uri=apidata/api/gk/school/lists`;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    const data = await res.json();
    if (data.code === '1069' || data.code === 1069) {
      process.stdout.write(`\r  限流，等待 60s...`);
      await sleep(60000);
      continue;
    }
    if (!data.data?.item?.length) break;
    all.push(...data.data.item);
    const total = data.data.numFound || 0;
    process.stdout.write(`\r  获取学校列表: ${all.length}/${total}`);
    if (all.length >= total) break;
    page++;
    await sleep(100);
  }
  console.log(`\n  共 ${all.length} 所学校`);
  return all;
}

function buildIndex(schools) {
  const idx = {};
  for (const s of schools) {
    idx[s.name] = s;
    const clean = s.name.replace(/[（(][^)）]*[)）]/g, '').trim();
    if (clean !== s.name) idx[clean] = s;
  }
  return idx;
}

/** 带自动重试的请求 */
async function fetchScoreWithRetry(schoolId, provId, year) {
  const url = `${API_BASE}?access_token=&local_province_id=${provId}&school_id=${schoolId}&signsafe=&uri=apidata/api/gk/score/province&year=${year}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': 'https://gkcx.eol.cn/' } });
      const data = await res.json();
      if (data.code === '1069' || data.code === 1069) {
        const wait = 30000;
        process.stdout.write(`\n  限流，等待 ${wait / 1000}s...`);
        await sleep(wait);
        continue;
      }
      return data.code === '0000' && data.data?.item ? data.data.item : [];
    } catch {
      await sleep(5000);
    }
  }
  return [];
}

function parseRecords(rawRecords, schoolId, provName, year) {
  const out = [];
  for (const r of rawRecords) {
    const minScore = parseInt(r.min);
    if (isNaN(minScore) || minScore <= 0) continue;

    const typeName = r.local_type_name || '';
    let category = '物理类';
    if (typeName.includes('历史')) category = '历史类';
    else if (typeName.includes('综合')) category = '综合';
    else if (typeName.includes('文科')) category = '历史类';
    else if (typeName.includes('理科')) category = '物理类';

    out.push({
      universityId: schoolId,
      province: provName,
      year,
      category,
      minScore,
      avgScore: (r.average && r.average !== '-') ? (parseInt(r.average) || minScore) : minScore,
      minRank: parseInt(r.min_section) || 0,
      enrollment: parseInt(r.num) || 0,
      source: `eol-api:${provName}考试院`,
    });
  }
  return out;
}

async function main() {
  console.log('=== eol.cn JSON API 录取数据爬取（跨省全量版）===\n');
  if (!fs.existsSync(CRAWLED_DIR)) fs.mkdirSync(CRAWLED_DIR, { recursive: true });

  // 1. 匹配大学
  const ourMap = loadOurUniversities();
  const eolSchools = await fetchAllSchools();
  const eolIndex = buildIndex(eolSchools);

  const matched = [];
  for (const [name, id] of Object.entries(ourMap)) {
    let m = eolIndex[name] || eolIndex[name.replace(/[（(][^)）]*[)）]/g, '').trim()];
    if (!m) m = Object.values(eolIndex).find(s => s.name.includes(name) || name.includes(s.name));
    if (m) matched.push({ id, eolId: m.school_id });
  }
  console.log(`匹配成功: ${matched.length} / ${Object.keys(ourMap).length} 所\n`);

  // 2. 加载/初始化进度
  let completed = new Set();
  if (fs.existsSync(PROGRESS_FILE)) {
    completed = new Set(JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8')));
    console.log(`已有进度: ${completed.size} 个省份已完成\n`);
  }

  // 3. 逐省查询 — 外层循环省份，内层循环学校（省为单位看进度）
  const allRecords = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    allRecords.push(...JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8')));
    console.log(`已有记录: ${allRecords.length} 条`);
  }

  for (const prov of ALL_PROVINCES) {
    const progressKey = `${prov.id}`;
    if (completed.has(progressKey)) {
      console.log(`[${prov.name}] 已跳过（已完成）`);
      continue;
    }

    console.log(`\n[${prov.name}] 查询 ${matched.length} 所学校...`);
    let provCount = 0;
    let apiCalls = 0;

    for (let i = 0; i < matched.length; i += CONCURRENCY) {
      const batch = matched.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map(school =>
          fetchScoreWithRetry(school.eolId, prov.id, 2025).then(records => {
            apiCalls++;
            return parseRecords(records, school.id, prov.name, 2025);
          })
        )
      );

      for (const recs of results) {
        allRecords.push(...recs);
        provCount += recs.length;
      }

      process.stdout.write(`\r  进度: ${Math.min(i + CONCURRENCY, matched.length)}/${matched.length} (本省 ${provCount} 条)`);
      await sleep(BATCH_DELAY_MS);
    }

    // 标记完成
    completed.add(progressKey);
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify([...completed]), 'utf-8');

    // 每省完成后保存
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allRecords), 'utf-8');

    console.log(`\n  ✅ ${prov.name} 完成，${provCount} 条，API 调用 ${apiCalls} 次`);
  }

  // 4. 最终统计
  console.log('\n\n=== 最终统计 ===');
  console.log(`总记录数: ${allRecords.length}`);

  const byProv = {};
  for (const r of allRecords) {
    byProv[r.province] = (byProv[r.province] || 0) + 1;
  }
  console.log(`覆盖省份: ${Object.keys(byProv).length} 个`);
  for (const [prov, count] of Object.entries(byProv).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${prov}: ${count} 条`);
  }

  // 删除进度文件（任务完成）
  fs.unlinkSync(PROGRESS_FILE);
  const size = fs.statSync(OUTPUT_FILE).size;
  console.log(`\n输出: ${OUTPUT_FILE} (${(size / 1024).toFixed(1)} KB)`);
}

main().catch(err => { console.error('\n错误:', err); process.exit(1); });

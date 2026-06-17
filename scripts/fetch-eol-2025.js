/**
 * eol.cn 2025 录取数据爬取 — 专注剩余省份
 *
 * 已有：北京/天津/河北 (api-records.json, 2191条)
 * 目标：爬取其余 28 省，总共 254 所大学 × 31 省 = 7874 条
 *
 * 使用: node scripts/fetch-eol-2025.js
 */
const fs = require('fs');
const path = require('path');

// === 配置 ===
const PROVINCES = [
  { name: '北京', id: 11 }, { name: '天津', id: 12 }, { name: '河北', id: 13 },
  { name: '山西', id: 14 }, { name: '内蒙古', id: 15 },
  { name: '辽宁', id: 21 }, { name: '吉林', id: 22 }, { name: '黑龙江', id: 23 },
  { name: '上海', id: 31 }, { name: '江苏', id: 32 }, { name: '浙江', id: 33 },
  { name: '安徽', id: 34 }, { name: '福建', id: 35 }, { name: '江西', id: 36 },
  { name: '山东', id: 37 }, { name: '河南', id: 41 }, { name: '湖北', id: 42 },
  { name: '湖南', id: 43 }, { name: '广东', id: 44 }, { name: '广西', id: 45 },
  { name: '海南', id: 46 }, { name: '重庆', id: 50 }, { name: '四川', id: 51 },
  { name: '贵州', id: 52 }, { name: '云南', id: 53 }, { name: '西藏', id: 54 },
  { name: '陕西', id: 61 }, { name: '甘肃', id: 62 }, { name: '青海', id: 63 },
  { name: '宁夏', id: 64 }, { name: '新疆', id: 65 },
];
const PROV_NAME = Object.fromEntries(PROVINCES.map(p => [p.id, p.name]));

const API_BASE = 'https://api.eol.cn/gkcx/api/';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const YEAR = 2025;
const OUTPUT = path.join(__dirname, 'crawled-data', 'api-records.json');
const PROGRESS = path.join(__dirname, 'crawled-data', 'api-progress.json');
const MAX_CONCURRENT = 3;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 加载大学列表
function loadUniversities() {
  const u = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'universities.ts'), 'utf-8');
  const ids = [...u.matchAll(/id:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const names = [...u.matchAll(/name:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const map = {};
  for (let i = 0; i < Math.min(ids.length, names.length); i++) map[ids[i]] = names[i];
  return map;
}

// 从 eol.cn 获取学校列表建立 school_id 映射
async function fetchSchoolMap() {
  const all = [];
  let page = 1;
  while (true) {
    const url = `${API_BASE}?page=${page}&request_type=1&school_type=6000&size=50&uri=apidata/api/gk/school/lists`;
    let retries = 3;
    while (retries > 0) {
      try {
        const r = await fetch(url, { headers: { 'User-Agent': UA }, timeout: 10000 });
        const d = await r.json();
        if (d.code === '0000' && d.data?.item?.length) {
          all.push(...d.data.item);
          break;
        }
        if (d.code === '1069') { await sleep(30000); retries--; continue; }
        break;
      } catch { await sleep(5000); retries--; }
    }
    if (retries === 0) break;
    const total = all[0]?._total || all.length + 1;
    process.stdout.write(`\r  学校列表: ${all.length}`);
    if (all.length >= total) break;
    page++;
    await sleep(200);
  }
  console.log(`\n  eol.cn 学校数: ${all.length}`);
  // 建立名称→school_id 映射
  const map = {};
  for (const s of all) {
    map[s.name] = s.school_id;
    // 去掉括号的变体
    const clean = s.name.replace(/[（(].*[）)]/g, '').trim();
    if (clean !== s.name) map[clean] = s.school_id;
  }
  console.log(`  school_id 映射数: ${Object.keys(map).length}`);
  return map;
}

// 获取单个学校-省份的录取数据
async function fetchScore(schoolId, provId) {
  const url = `${API_BASE}?access_token=&local_province_id=${provId}&school_id=${schoolId}&signsafe=&uri=apidata/api/gk/score/province&year=${YEAR}`;
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': 'https://gkcx.eol.cn/' } });
  const d = await r.json();
  if (!d.code || d.code === '0000') return d.data?.item || [];
  if (d.code === '1069') return { rateLimit: true };
  return [];
}

async function main() {
  console.log('=== eol.cn 2025 数据爬取 ===\n');

  // 1. 获取学校→school_id 映射
  console.log('正在获取学校列表...');
  const schoolMap = await fetchSchoolMap();
  const unis = loadUniversities();
  console.log(`我们学校: ${Object.keys(unis).length}`);

  // 匹配
  const match = {};
  let notFound = [];
  for (const [id, name] of Object.entries(unis)) {
    if (schoolMap[name]) match[id] = { name, schoolId: schoolMap[name] };
    else notFound.push(name);
  }
  console.log(`匹配 school_id: ${Object.keys(match).length}, 未匹配: ${notFound.length}`);
  if (notFound.length > 0) console.log('未匹配:', notFound.slice(0, 10));

  if (Object.keys(match).length === 0) {
    console.log('没有匹配到任何学校，退出');
    return;
  }

  // 2. 加载已有记录
  let existing = [];
  if (fs.existsSync(OUTPUT)) existing = JSON.parse(fs.readFileSync(OUTPUT, 'utf-8'));
  const existingSet = new Set(existing.map(r => `${r.universityId}|${r.province}`));
  console.log(`已有记录: ${existing.length} 条, 去重后: ${existingSet.size} 对`);

  // 3. 计算需要爬取的任务
  const tasks = [];
  for (const [uid, info] of Object.entries(match)) {
    for (const prov of PROVINCES) {
      if (!existingSet.has(`${uid}|${prov.name}`)) {
        tasks.push({ uid, name: info.name, schoolId: info.schoolId, prov });
      }
    }
  }
  console.log(`需要爬取: ${tasks.length} 条\n`);

  if (tasks.length === 0) {
    console.log('所有数据已获取完毕！');
    return;
  }

  // 4. 爬取
  let newRecords = [];
  let rates = 0; // 限流次数
  const startTime = Date.now();

  for (let i = 0; i < tasks.length; i += MAX_CONCURRENT) {
    const batch = tasks.slice(i, i + MAX_CONCURRENT);
    const batchStart = Date.now();

    const results = await Promise.all(batch.map(t => fetchScore(t.schoolId, t.prov.id).catch(e => [])));

    for (let j = 0; j < batch.length; j++) {
      const t = batch[j];
      const items = results[j];

      if (items?.rateLimit) {
        rates++;
        console.log(`  [${i + j + 1}/${tasks.length}] ⏳ ${t.name}@${t.prov.name} 限流`);
        // 等待恢复
        await sleep(45000);
        // 重试
        const retry = await fetchScore(t.schoolId, t.prov.id).catch(e => []);
        if (Array.isArray(retry) && retry.length > 0) {
          for (const item of retry) {
            newRecords.push({
              universityId: t.uid,
              province: t.prov.name,
              year: YEAR,
              category: item.spname || '',
              minScore: item.min_score || 0,
              avgScore: item.average_score || 0,
              minRank: item.min_section || 0,
              enrollment: item.enrollment || 0,
              source: `eol-api:${t.prov.name}`
            });
          }
          process.stdout.write(`\r  ✅ ${newRecords.length} 条新记录`);
        }
        continue;
      }

      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          newRecords.push({
            universityId: t.uid,
            province: t.prov.name,
            year: YEAR,
            category: item.spname || '',
            minScore: item.min_score || 0,
            avgScore: item.average_score || 0,
            minRank: item.min_section || 0,
            enrollment: item.enrollment || 0,
            source: `eol-api:${t.prov.name}`
          });
        }
      }
    }

    process.stdout.write(`\r  进度: ${Math.min(i + MAX_CONCURRENT, tasks.length)}/${tasks.length}, 新记录: ${newRecords.length}, 限流: ${rates} 次`);

    // 每完成 20 个任务保存一次
    if ((i + MAX_CONCURRENT) % 20 < MAX_CONCURRENT || i + MAX_CONCURRENT >= tasks.length) {
      const all = [...existing, ...newRecords];
      fs.writeFileSync(OUTPUT, JSON.stringify(all, null, 2), 'utf-8');
    }

    // 批次间短延迟
    await sleep(500);
  }

  // 最终保存
  const all = [...existing, ...newRecords];
  fs.writeFileSync(OUTPUT, JSON.stringify(all, null, 2), 'utf-8');
  
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n\n✅ 完成! 新增 ${newRecords.length} 条, 共 ${all.length} 条, 用时 ${elapsed} 分钟`);
}

main().catch(e => console.error('错误:', e));

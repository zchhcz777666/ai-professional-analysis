/**
 * eol.cn 精准爬虫 — 只爬 scores.json 中当前 unknown 的 (uni,prov,year) 组合
 * 2023-2025 年，用 eol.cn 真实数据替换假数据
 */
const fs = require('fs');
const path = require('path');

const PROVINCES = {
  '11':'北京','12':'天津','13':'河北','14':'山西','15':'内蒙古',
  '21':'辽宁','22':'吉林','23':'黑龙江',
  '31':'上海','32':'江苏','33':'浙江','34':'安徽','35':'福建','36':'江西','37':'山东',
  '41':'河南','42':'湖北','43':'湖南','44':'广东','45':'广西','46':'海南',
  '50':'重庆','51':'四川','52':'贵州','53':'云南','54':'西藏',
  '61':'陕西','62':'甘肃','63':'青海','64':'宁夏','65':'新疆',
};
const PROV_BY_NAME = Object.fromEntries(Object.entries(PROVINCES).map(([k,v]) => [v, k]));

const API_BASE = 'https://api.eol.cn/gkcx/api/';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const YEARS = [2023, 2024, 2025];
const OUTPUT = path.join(__dirname, 'crawled-data', 'eol-fill-records.json');
const MAX_CONCURRENT = 2;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function log(msg) { console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`); }

function loadUniversities() {
  const u = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'universities.ts'), 'utf-8');
  const ids = [...u.matchAll(/id:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const names = [...u.matchAll(/name:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const map = {};
  for (let i = 0; i < Math.min(ids.length, names.length); i++) map[ids[i]] = names[i];
  return map;
}

const UNI_ALIAS = {
  'bjut2': 'bjut', 'scnu2': 'scnu', 'hunnu2': 'hunnu', 'gxu2': 'gxu',
  'ynu2': 'ynu', 'guet2': 'guet', 'nepu2': 'nepu', 'zzu2': 'zzu',
  'fzu2': 'fzu', 'jxnu2': 'jxnu', 'henu2': 'henu', 'xaut2': 'xaut',
  'nchu2': 'nchu', 'hbut2': 'hbut', 'cqjtu2': 'cqjtu', 'hebust2': 'hebust',
  'sxu2': 'sxu', 'xju2': 'xju', 'gzu2': 'gsu', 'nxu2': 'nxu',
  'hainanu2': 'hainanu', 'tibetu2': 'tibetu',
  'whut': 'hust_wut', 'shu': 'nuaa_cqu',
};

async function fetchSchoolMap() {
  const all = [];
  let page = 1;
  let prevLength = 0;
  while (all.length < 10000 && all.length > prevLength) {
    prevLength = all.length;
    const url = `${API_BASE}?page=${page}&request_type=1&school_type=6000&size=200&uri=apidata/api/gk/school/lists`;
    let retries = 3;
    let gotData = false;
    while (retries > 0) {
      try {
        const r = await fetch(url, { headers: { 'User-Agent': UA }, timeout: 15000 });
        const d = await r.json();
        if (d.code === '0000' && d.data?.item) {
          all.push(...d.data.item);
          gotData = true;
          break;
        }
        if (d.code === '1069') { await sleep(30000); retries--; continue; }
        break;
      } catch { await sleep(5000); retries--; }
    }
    if (!gotData) break;
    log(`学校列表: ${all.length}`);
    page++;
    await sleep(150);
  }

  log(`eol.cn 学校总数: ${all.length}`);
  const map = {};
  for (const s of all) {
    map[s.name] = s.school_id;
    const clean = s.name.replace(/[（(].*[）)]/g, '').trim();
    if (clean !== s.name) map[clean] = s.school_id;
  }
  return map;
}

async function fetchScore(schoolId, provId, year) {
  const url = `${API_BASE}?access_token=&local_province_id=${provId}&school_id=${schoolId}&signsafe=&uri=apidata/api/gk/score/province&year=${year}`;
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': 'https://gkcx.eol.cn/' } });
  const d = await r.json();
  if (!d.code || d.code === '0000') return d.data?.item || [];
  if (d.code === '1069') return { rateLimit: true };
  return [];
}

function extractRecord(item) {
  const cat = item.spname || item.local_type_name || item.zslx_name || '';
  const score = item.min_score || item.min || 0;
  const avgScore = item.average_score || item.average || 0;
  const rank = item.min_section || 0;
  const enroll = item.enrollment || item.num || 0;
  return { category: String(cat), minScore: Number(score), avgScore: Number(avgScore), minRank: Number(rank), enrollment: Number(enroll) };
}

async function main() {
  log('=== eol.cn 精准爬虫 (2023-2025. 只 fill unknown) ===\n');

  // 1. 加载 scores.json 找出 need-to-fill 的组合
  const scores = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'scores.json'), 'utf-8'));
  
  const needToFill = new Map(); // key: "uniId|prov" => [{year, category, origRecord}]
  for (const r of scores) {
    if (r.year < 2023 || r.year > 2025) continue;
    if (r.source && r.source !== 'unknown') continue; // 已有真实来源
    const key = `${r.universityId}|${r.province}`;
    if (!needToFill.has(key)) needToFill.set(key, []);
    needToFill.get(key).push({ year: r.year, category: r.category, record: r });
  }
  log(`需要填充的组合: ${needToFill.size} (uni|prov)`);

  const allTargets = [...needToFill.entries()].flatMap(([key, items]) => {
    const [uniId, provName] = key.split('|');
    const provId = PROV_BY_NAME[provName];
    if (!provId) return [];
    return items.map(item => ({
      uniId, provName, provId,
      year: item.year,
      category: item.category,
    }));
  });
  log(`总任务数: ${allTargets.length} (uni|prov|year)\n`);

  if (allTargets.length === 0) { log('无需填充！'); return; }

  // 2. 获取 eol school list 映射
  log('正在获取 eol.cn 学校列表...');
  const schoolMap = await fetchSchoolMap();
  const unis = loadUniversities();

  // 匹配需要填充的学校
  const schoolIdMap = {}; // uniId => schoolId
  let notFound = [];
  const neededIds = new Set(allTargets.map(t => t.uniId));
  for (const id of neededIds) {
    const name = unis[id] || '';
    // 如果有别名，尝试用别名的原名匹配
    const primaryId = UNI_ALIAS[id] || id;
    const primaryName = unis[primaryId] || name;
    
    let schoolId = schoolMap[name] || schoolMap[primaryName];
    if (!schoolId && name) {
      // 尝试模糊匹配：名称中间部分
      const shortName = name.replace(/2$/,''); // bjut2 => bjut
      const nameWithoutNum = name.replace(/\d+$/, '');
      schoolId = schoolMap[shortName] || schoolMap[nameWithoutNum];
    }
    if (schoolId) schoolIdMap[id] = schoolId;
    else notFound.push(`${id}(${name})`);
  }

  log(`匹配到 eol school_id: ${Object.keys(schoolIdMap).length} 校`);
  if (notFound.length > 0) log(`未匹配: ${notFound.join(', ')}`);
  
  // 调试：检查一个具体案例
  const sampleTarget = allTargets[0];
  if (sampleTarget) {
    const inMap = schoolIdMap[sampleTarget.uniId];
    const sampleUniName = unis[sampleTarget.uniId] || '?';
    log(`调试: allTargets[0] = ${sampleTarget.uniId}(${sampleUniName}) @ ${sampleTarget.provName} ${sampleTarget.year}, schoolId = ${inMap || 'NOT FOUND'}`);
    const mapKeys = Object.keys(schoolIdMap).slice(0, 5);
    log(`schoolIdMap 前5个key: ${mapKeys.join(', ')}`);
  }

  // 3. 构建任务列
  const tasks = allTargets.filter(t => schoolIdMap[t.uniId]);
  log(`有 school_id 的任务: ${tasks.length}`);
  
  if (tasks.length === 0) { log('没有可爬取的任务！'); return; }

  // 4. 爬取
  let newRecords = [];
  let rateLimited = 0;
  const startTime = Date.now();

  for (let i = 0; i < tasks.length; i += MAX_CONCURRENT) {
    const batch = tasks.slice(i, i + MAX_CONCURRENT);
    
    const results = await Promise.all(batch.map(t =>
      fetchScore(schoolIdMap[t.uniId], t.provId, t.year).catch(e => [])
    ));

    for (let j = 0; j < batch.length; j++) {
      const t = batch[j];
      const items = results[j];

      if (items?.rateLimit) {
        rateLimited++;
        log(`[${i + j + 1}/${tasks.length}] ⏳ ${t.uniId}@${t.provName} ${t.year} 限流，等待45s`);
        await sleep(45000);
        const retry = await fetchScore(schoolIdMap[t.uniId], t.provId, t.year).catch(e => []);
        if (Array.isArray(retry) && retry.length > 0) {
          for (const item of retry) {
            const rec = extractRecord(item);
            // 检查类别是否匹配
            const normTarget = t.category.replace(/[（(].*/g,'').trim();
            const normRec = rec.category.replace(/[（(].*/g,'').trim();
            const isMatch = !normTarget || !normRec || normTarget.includes(normRec) || normRec.includes(normTarget);
            if (isMatch && rec.minScore > 0) {
              newRecords.push({ ...t, minScore: rec.minScore, minRank: rec.minRank, source: 'eol-api' });
            }
          }
        }
        continue;
      }

      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const rec = extractRecord(item);
          if (rec.minScore <= 0) continue;
          // 类别匹配：优先 exact match，其次 normalized
          const normTarget = t.category.replace(/[（(].*/g, '').trim();
          const normRec = rec.category.replace(/[（(].*/g, '').trim();
          const isExact = rec.category === t.category || normRec === normTarget;
          const isFuzzy = !normTarget || !normRec || normTarget.includes(normRec) || normRec.includes(normTarget);
          
          if (isExact || isFuzzy) {
            newRecords.push({
              uniId: t.uniId,
              province: t.provName,
              year: t.year,
              category: rec.category,
              minScore: rec.minScore,
              minRank: rec.minRank,
              source: 'eol-api',
              matchType: isExact ? 'exact' : 'fuzzy',
            });
          }
        }
      }
    }

    if ((i + 1) % 20 === 0 || (i + MAX_CONCURRENT) >= tasks.length) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const done = Math.min(i + MAX_CONCURRENT, tasks.length);
      log(`进度: ${done}/${tasks.length}, 新记录: ${newRecords.length}, 限流: ${rateLimited}, ${elapsed}s`);
      fs.writeFileSync(OUTPUT, JSON.stringify(newRecords, null, 2), 'utf-8');
    }

    await sleep(1200 + Math.random() * 1800);
  }

  // 最终保存
  fs.writeFileSync(OUTPUT, JSON.stringify(newRecords, null, 2), 'utf-8');
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  
  // 统计
  const byMatch = {};
  newRecords.forEach(r => { byMatch[r.matchType] = (byMatch[r.matchType]||0)+1; });
  log(`\n✅ 完成! 新增 ${newRecords.length} 条, 用时 ${elapsed} 分钟`);
  log(`匹配类型: ${JSON.stringify(byMatch)}`);
  
  // 按年统计
  for (const year of YEARS) {
    const yr = newRecords.filter(r => r.year === year);
    log(`${year}: ${yr.length} 条`);
  }
}

main().catch(e => log(`错误: ${e.message}`));

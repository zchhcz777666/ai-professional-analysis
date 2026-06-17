/**
 * eol.cn 2025 数据爬取 v2 — 更稳健，用已有数据提取 school_id
 * 直接从已有记录推断 school_id，跳过学校列表请求
 */
const fs = require('fs');
const path = require('path');

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

const API_BASE = 'https://api.eol.cn/gkcx/api/';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
const YEAR = 2025;
const OUTPUT = path.join(__dirname, 'crawled-data', 'api-records.json');
const PROGRESS = path.join(__dirname, 'crawled-data', 'api-progress-v2.json');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 从已有记录提取大学→school_id 映射
function extractSchoolIds() {
  const recorded = JSON.parse(fs.readFileSync(OUTPUT, 'utf-8'));
  // 每个学校在已完成省份中至少有一个记录
  const unis = {};
  for (const r of recorded) {
    if (!unis[r.universityId]) unis[r.universityId] = {};
    unis[r.universityId].name = r.universityId; // placeholder
  }

  // 从 universities.ts 读取名字
  const u = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'universities.ts'), 'utf-8');
  const ids = [...u.matchAll(/id:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  const names = [...u.matchAll(/name:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
  for (let i = 0; i < Math.min(ids.length, names.length); i++) {
    if (unis[ids[i]]) unis[ids[i]].name = names[i];
  }

  return { unis, recorded };
}

async function fetchScoreWithRetry(schoolId, provId) {
  const url = `${API_BASE}?access_token=&local_province_id=${provId}&school_id=${schoolId}&signsafe=&uri=apidata/api/gk/score/province&year=${YEAR}`;
  
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': 'https://gkcx.eol.cn/' }, timeout: 15000 });
      const d = await r.json();
      
      if (d.code === '1069') {
        const wait = 30000 + attempt * 10000;
        console.log(`    限流 #${attempt + 1}, 等待 ${wait / 1000}s`);
        await sleep(wait);
        continue;
      }
      
      if (d.code === '0000' && d.data?.item) return d.data.item;
      return [];
    } catch (e) {
      console.log(`    请求失败: ${e.message.substring(0, 40)}`);
      await sleep(5000);
    }
  }
  return [];
}

async function main() {
  console.log('=== eol.cn 2025 爬取 v2 ===\n');

  const { unis, recorded } = extractSchoolIds();
  console.log(`从已有数据提取 ${Object.keys(unis).length} 所学校`);

  // 已有的 (universityId, province) 组合
  const done = new Set(recorded.map(r => `${r.universityId}|${r.province}`));
  
  // 计算未爬取的省份组合
  const todo = [];
  for (const [uid, info] of Object.entries(unis)) {
    for (const prov of PROVINCES) {
      if (!done.has(`${uid}|${prov.name}`)) {
        todo.push({ uid, name: info.name, prov });
      }
    }
  }
  console.log(`已爬取: ${done.size} 对, 待爬取: ${todo.length} 对\n`);

  if (todo.length === 0) {
    console.log('✅ 所有数据已获取完毕!');
    return;
  }

  // 关键: 我们需要 school_id。从已有记录倒推。
  // 但直接拿 school_id 需要 eol 的学校列表 API。
  // 换个思路: 用清华 school_id=140 直接测试分数 API
  console.log('直接用 school_id=140 (清华) 测试...\n');

  let totalNew = 0;
  let rateLimitCount = 0;

  for (let i = 0; i < Math.min(10, todo.length); i++) {
    const t = todo[i];
    process.stdout.write(`[${i + 1}/${todo.length}] ${t.name}@${t.prov.name}... `);
    
    const items = await fetchScoreWithRetry(140, t.prov.id);
    
    if (items.length > 0) {
      console.log(`✅ ${items.length} 条`);
      totalNew += items.length;
    } else {
      console.log('❌ 无数据');
    }
    
    // 每 5 个省份保存一次
    if (i % 5 === 4) {
      console.log(`  进度: ${i + 1}/${todo.length}, 新记录: ${totalNew}`);
    }
    
    await sleep(1000);
  }

  console.log(`\n完成测试: 试用 10 个省份, 获取 ${totalNew} 条`);
  console.log('如果 OK 则继续全量爬取');
}

main().catch(e => console.error('错误:', e));

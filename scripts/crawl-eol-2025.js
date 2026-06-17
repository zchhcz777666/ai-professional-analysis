const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================
const BASE_URL = 'https://static-data.gaokao.cn/www/2.0';
const SCORES_FILE = path.join(__dirname, '..', 'src', 'data', 'scores.json');
const OUTPUT_FILE = path.join(__dirname, 'crawled-data', 'eol-2025-records.json');
const MAPPING_FILE = path.join(__dirname, 'crawled-data', 'gaokao-to-uni-mapping.json');

// 类型映射
const TYPE_MAP = {
  '1': '理科', '2': '文科', '3': '综合',
  '4': '艺术类', '5': '体育类',
  '2073': '物理类', '2074': '历史类',
  '2292': '艺术类(历史)', '2293': '艺术类(物理)',
  '2294': '体育类(历史)', '2295': '体育类(物理)',
};

// 省份映射
const PROVINCE_MAP = {
  '11': '北京', '12': '天津', '13': '河北', '14': '山西', '15': '内蒙古',
  '21': '辽宁', '22': '吉林', '23': '黑龙江',
  '31': '上海', '32': '江苏', '33': '浙江', '34': '安徽', '35': '福建', '36': '江西', '37': '山东',
  '41': '河南', '42': '湖北', '43': '湖南', '44': '广东', '45': '广西', '46': '海南',
  '50': '重庆', '51': '四川', '52': '贵州', '53': '云南', '54': '西藏',
  '61': '陕西', '62': '甘肃', '63': '青海', '64': '宁夏', '65': '新疆',
};

// ==================== 学校名称映射 ====================
async function buildSchoolNameMap() {
  console.log('Building school name mapping...');
  
  // 1. 从 gaokao.cn 获取学校列表
  const r = await axios.get(BASE_URL + '/school/name.json', { timeout: 15000 });
  const gaokaoSchools = r.data.data;
  console.log('Gaokao schools in API:', gaokaoSchools.length);
  
  // 2. 从 universities.ts 提取中文校名
  const uniData = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'universities.ts'), 'utf-8');
  const nameRegex = /id:\s*'(\w+)'[^]*?name:\s*'([^']+)'/g;
  let m;
  const uniNameMap = {};
  while ((m = nameRegex.exec(uniData)) !== null) {
    uniNameMap[m[1]] = m[2];
  }
  console.log('Universities in system:', Object.keys(uniNameMap).length);
  
  // 3. 精确匹配：中文名完全相同（优先使用不带2后缀的版本）
  const nameToId = {};
  Object.entries(uniNameMap).forEach(([id, name]) => {
    if (nameToId[name] && !id.endsWith('2')) {
      nameToId[name] = id;
    } else if (!nameToId[name]) {
      nameToId[name] = id;
    }
  });
  
  // 4. 手动修正特殊名称（包括改名、校区、多ID映射）
  const nameOverrides = {
    '华北电力大学（北京）': 'ncepu',
    '华北电力大学（保定）': 'ncepubd',
    '哈尔滨工业大学（深圳）': 'hit_sz',
    '哈尔滨工业大学（威海）': 'hit_wh',
    '电子科技大学（沙河校区）': 'uestc_us',
    '中国矿业大学（北京）': 'cumtb',
    '中国石油大学（华东）': 'upc',
    '中国石油大学（北京）': 'cup',
    // 改名的学校
    '福建理工大学': 'fjut',        // 原福建工程学院 2023年改名
    '湖州师范大学': 'hztc',        // 原湖州师范学院 2023年改名
    '天水师范大学': 'tsnc',        // 原天水师范学院 2024年改名
    '绍兴大学': 'usx',            // 原绍兴文理学院 2023年改名
    // 同名多ID的学校，强制映射到特定ID
    '武汉理工大学': 'hust_wut',    // 排除 whut
    '上海大学': 'nuaa_cqu',       // 排除 shu
    '北京工业大学': 'bjut',        // 排除 bjut2
    '湖南师范大学': 'hunnu',       // 排除 hunnu2
    '华南师范大学': 'scnu',        // 排除 scnu2
    '广西大学': 'gxu',            // 排除 gxu2
    '云南大学': 'ynu',            // 排除 ynu2
    '桂林电子科技大学': 'guet',    // 排除 guet2
    '东北石油大学': 'nepu',        // 排除 nepu2
    '郑州大学': 'zzu',            // 排除 zzu2
    '河南大学': 'henu',           // 排除 henu2
    '重庆交通大学': 'cqjtu',       // 排除 cqjtu2
    '河北科技大学': 'hebust',      // 排除 hebust2
    '山西大学': 'sxu',            // 排除 sxu2
    '新疆大学': 'xju',            // 排除 xju2
    '海南大学': 'hainanu',        // 排除 hainanu2
    '西藏大学': 'tibetu',         // 排除 tibetu2
    '福州大学': 'fzu',            // 排除 fzu2
    '贵州大学': 'gsu',            // 排除 gzu2
    '江西师范大学': 'jxnu',        // 排除 jxnu2
    '西安理工大学': 'xaut',        // 排除 xaut2
    '宁夏大学': 'nxu',            // 排除 nxu2
    '南昌航空大学': 'nchu',        // 排除 nchu2
    '湖北工业大学': 'hbut',        // 排除 hbut2
  };
  Object.entries(nameOverrides).forEach(([gaokaoName, uniId]) => {
    nameToId[gaokaoName] = uniId;
  });
  
  // 5. 构建映射
  const gaokaoToUni = {};
  let matched = 0;
  let unmatched = [];
  
  gaokaoSchools.forEach(gs => {
    let uniId = nameToId[gs.name];
    
    // 模糊匹配：移除括号内容再试试
    if (!uniId) {
      const simplified = gs.name.replace(/[（(].*?[）)]/g, '').trim();
      uniId = nameToId[simplified];
    }
    
    // 模糊匹配：关键字搜索
    if (!uniId) {
      const keywords = gs.name.replace(/[（(].*?[）)]/g, '').trim();
      const found = Object.entries(uniNameMap).find(([id, name]) => {
        return name.includes(keywords) || keywords.includes(name);
      });
      if (found) uniId = found[0];
    }
    
    if (uniId) {
      // 确保 school_id 为字符串，与 samescore3 API 返回类型一致
      gaokaoToUni[String(gs.school_id)] = { uniId, name: gs.name };
      matched++;
    } else {
      unmatched.push(gs.name);
    }
  });
  
  console.log('Matched:', matched);
  console.log('Unmatched:', unmatched.length);
  if (unmatched.length > 0) {
    console.log('Unmatched samples:', unmatched.slice(0, 30).join(', '));
  }
  
  // 保存映射
  const outDir = path.dirname(MAPPING_FILE);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(MAPPING_FILE, JSON.stringify({
    gaokaoToUni: Object.fromEntries(
      Object.entries(gaokaoToUni).map(([k, v]) => [k, v])
    ),
    uniNameMap
  }, null, 2), 'utf-8');
  console.log('Saved mapping to:', MAPPING_FILE);
  
  // 打印系统中的学校哪些没匹配上
  const matchedIds = new Set(Object.values(gaokaoToUni).map(v => v.uniId));
  const missingUnis = Object.entries(uniNameMap).filter(([id]) => !matchedIds.has(id));
  if (missingUnis.length > 0) {
    console.log('\n系统中未匹配的学校:');
    missingUnis.forEach(([id, name]) => {
      console.log('  ' + id + ': ' + name);
    });
  }
  
  return { gaokaoToUni, gaokaoSchools };
}

// ==================== 爬取 samescore3 数据 ====================
async function crawlSamescore(schoolMap, typeMap) {
  const allRecords = [];
  const seen = new Set();
  const scoreRange = [];
  for (let s = 300; s <= 700; s += 10) scoreRange.push(s);
  
  console.log('\nCrawling samescore3 API...');
  console.log('Score range: 300-700 step 10 (' + scoreRange.length + ' calls)');
  
  // Track progress
  let callCount = 0;
  let lastReport = Date.now();
  
  for (const score of scoreRange) {
    try {
      const url = BASE_URL + '/samescore3/2025/' + score + '.json';
      const r = await axios.get(url, {
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      
      const data = r.data.data;
      if (!data) continue;
      
      let count = 0;
      Object.entries(data).forEach(([provId, typeData]) => {
        const province = PROVINCE_MAP[provId];
        if (!province) return;
        
        Object.entries(typeData).forEach(([typeCode, items]) => {
          const category = typeMap[typeCode] || '其他';
          
          items.forEach(item => {
            const schoolInfo = schoolMap[item.school_id];
            if (!schoolInfo) return;
            
            const key = item.school_id + '|' + provId + '|' + typeCode + '|' + (item.batch || '');
            if (seen.has(key)) return;
            seen.add(key);
            
            allRecords.push({
              schoolId: item.school_id,
              provinceId: provId,
              province: province,
              category: category,
              batch: item.batch || '',
              zslx: item.zslx || '',
              minScore: item.min || 0,
              minRank: parseInt(item.eol_rank) || 0,
              schoolName: item.name,
              universityId: schoolInfo.uniId
            });
            count++;
          });
        });
      });
      
      callCount++;
      const now = Date.now();
      if (now - lastReport > 5000) {
        const pct = Math.round(callCount / scoreRange.length * 100);
        console.log('Progress: ' + pct + '% (' + callCount + '/' + scoreRange.length + ' calls), records: ' + allRecords.length);
        lastReport = now;
      }
      
      // 随机延时 0.5-1.5s
      await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
      
    } catch (e) {
      if (e.response?.status !== 404) {
        console.log('Score ' + score + ' error: ' + (e.response?.status || e.message));
      }
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  
  return allRecords;
}

// ==================== 主流程 ====================
async function main() {
  console.log('=== EOL(CN) -> Gaokao.cn 2025 数据爬虫 ===\n');
  
  // 1. 构建学校映射
  const { gaokaoToUni } = await buildSchoolNameMap();
  console.log('\nMapped school count:', Object.keys(gaokaoToUni).length);
  
  // 2. 获取类型映射
  try {
    const dicR = await axios.get(BASE_URL + '/config/dicprovince/dic.json', { timeout: 10000 });
    if (dicR.data.data) {
      Object.entries(dicR.data.data).forEach(([k, v]) => {
        if (!TYPE_MAP[k]) TYPE_MAP[k] = v;
      });
    }
  } catch (e) { /* ignore */ }
  
  // 3. 爬取数据
  const records = await crawlSamescore(gaokaoToUni, TYPE_MAP);
  console.log('\nTotal unique records:', records.length);
  
  // 4. 统计
  const uniStats = {};
  records.forEach(r => {
    if (!uniStats[r.universityId]) uniStats[r.universityId] = { provinces: new Set(), categories: new Set() };
    uniStats[r.universityId].provinces.add(r.province);
    uniStats[r.universityId].categories.add(r.category);
  });
  console.log('Universities covered:', Object.keys(uniStats).length);
  
  const catStats = {};
  records.forEach(r => {
    catStats[r.category] = (catStats[r.category] || 0) + 1;
  });
  console.log('Categories:', JSON.stringify(catStats));
  
  // 5. 保存结果
  const outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(records, null, 2), 'utf-8');
  console.log('\nSaved to:', OUTPUT_FILE);
  console.log('File size:', Math.round(fs.statSync(OUTPUT_FILE).size / 1024) + 'KB');
}

main().catch(console.error);

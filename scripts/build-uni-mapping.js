const fs = require('fs');
const path = require('path');

// ==================== 构建完整的学校映射 ====================
function buildCompleteMapping() {
  console.log('Building complete school name mapping...');
  
  // 1. 从 universities.ts 提取中文校名
  const uniData = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'universities.ts'), 'utf-8');
  const nameRegex = /id:\s*'(\w+)'[^]*?name:\s*'([^']+)'/g;
  let m;
  const uniNameMap = {};
  while ((m = nameRegex.exec(uniData)) !== null) {
    uniNameMap[m[1]] = m[2];
  }
  console.log('Universities in system:', Object.keys(uniNameMap).length);
  
  // 2. 从本地 gaokao-school-map.json 加载
  const gaokaoSchools = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'gaokao-school-map.json'), 'utf-8'));
  console.log('Gaokao schools in cache:', gaokaoSchools.length);
  
  // 3. 构建 name -> id 映射（优先使用不带2后缀的版本）
  const nameToId = {};
  Object.entries(uniNameMap).forEach(([id, name]) => {
    // 如果已有映射，优先保留不带2的
    if (nameToId[name] && !id.endsWith('2')) {
      nameToId[name] = id;
    } else if (!nameToId[name]) {
      nameToId[name] = id;
    }
  });
  
  // 手动修正/补充
  const extraMappings = {
    '福建理工大学': 'fjut',          // 原福建工程学院 2023年改名
    '湖州师范大学': 'hztc',          // 原湖州师范学院 2023年改名
    '天水师范大学': 'tsnc',          // 原天水师范学院 2024年改名
    '绍兴大学': 'usx',              // 原绍兴文理学院 2023年改名
    '华北电力大学（北京）': 'ncepu',
    '华北电力大学（保定）': 'ncepubd',
    '哈尔滨工业大学（深圳）': 'hit_sz',
    '哈尔滨工业大学（威海）': 'hit_wh',
    '电子科技大学（沙河校区）': 'uestc_us',
    '中国矿业大学（北京）': 'cumtb',
    '中国石油大学（华东）': 'upc',
    '中国石油大学（北京）': 'cup',
  };
  Object.entries(extraMappings).forEach(([gaokaoName, uniId]) => {
    nameToId[gaokaoName] = uniId;
  });
  
  // 4. 构建 gaokao school_id -> (uniId, name) 映射
  const gaokaoToUni = {};
  let matched = 0;
  
  gaokaoSchools.forEach(gs => {
    let uniId = nameToId[gs.name];
    
    // 模糊：去掉括号内容后匹配
    if (!uniId) {
      const simple = gs.name.replace(/[（(].*?[）)]/g, '').trim();
      uniId = nameToId[simple];
    }
    
    // 模糊：用简化名搜索
    if (!uniId) {
      const simple = gs.name.replace(/[（(].*?[）)]/g, '').trim();
      const found = Object.entries(uniNameMap).find(([, name]) => 
        name.includes(simple) || simple.includes(name)
      );
      if (found) uniId = found[0];
    }
    
    if (uniId) {
      gaokaoToUni[String(gs.id)] = { uniId, name: gs.name };
      matched++;
    }
  });
  
  console.log('Matched gaokao schools:', matched);
  
  // 5. 检查未匹配的学校
  const matchedIds = new Set(Object.values(gaokaoToUni).map(v => v.uniId));
  const missingUnis = Object.entries(uniNameMap).filter(([id]) => !matchedIds.has(id));
  if (missingUnis.length > 0) {
    console.log('\n系统中未匹配的学校 (' + missingUnis.length + '):');
    missingUnis.forEach(([id, name]) => {
      console.log('  ' + id + ': ' + name);
    });
  } else {
    console.log('所有学校匹配成功!');
  }
  
  console.log('\nTotal mapped:', Object.keys(gaokaoToUni).length);
  return gaokaoToUni;
}

// 执行
const result = buildCompleteMapping();

// 保存
const outFile = path.join(__dirname, 'crawled-data', 'gaokao-to-uni-mapping.json');
fs.writeFileSync(outFile, JSON.stringify(result, null, 2), 'utf-8');
console.log('\nSaved to:', outFile);

// 验证关键学校
const keyUnis = ['tsinghua','pku','zju','sjtu','hust_wut','scnu','nuaa_cqu','hunnu','gxu','fjut','hztc','tsnc','usx'];
keyUnis.forEach(id => {
  const found = Object.entries(result).find(([, v]) => v.uniId === id);
  console.log(id + ': ' + (found ? 'OK (school_id=' + found[0] + ')' : 'MISSING'));
});

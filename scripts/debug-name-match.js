const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function main() {
  // 读取 universities.ts
  const uniData = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'universities.ts'), 'utf-8');
  const nameRegex = /id:\s*'(\w+)'[^]*?name:\s*'([^']+)'/g;
  let m;
  const uniNameMap = {};
  while ((m = nameRegex.exec(uniData)) !== null) {
    uniNameMap[m[1]] = m[2];
  }
  
  // 从 gaokao API 获取学校列表
  const r = await axios.get('https://static-data.gaokao.cn/www/2.0/school/name.json', { timeout: 15000 });
  const gaokaoSchools = r.data.data;
  
  const unmatched = ['hust_wut', 'uestc_us', 'scnu', 'nuaa_cqu', 'hunnu', 'gxu', 'ynu', 'guet', 'nepu', 'zzu', 'henu', 'cqjtu', 'sxu', 'xju', 'hainanu', 'tibetu', 'fjut', 'hztc', 'usx', 'tsnc'];
  
  console.log('=== 未匹配学校诊断 ===\n');
  
  unmatched.forEach(id => {
    const ourName = uniNameMap[id];
    if (!ourName) {
      console.log(id + ': 系统内未找到该ID');
      return;
    }
    
    // 在 gaokao 列表中查找
    const exact = gaokaoSchools.filter(s => s.name === ourName);
    const matchAll = gaokaoSchools.filter(s => s.name.includes(ourName) || ourName.includes(s.name));
    
    if (exact.length > 0) {
      console.log(id + ' ("' + ourName + '") -> gaokao_id=' + exact[0].school_id + ' [精确匹配]');
    } else if (matchAll.length > 0) {
      // 看看差异
      matchAll.forEach(s => {
        console.log(id + ' ("' + ourName + '") -> gaokao_id=' + s.school_id + ' ["' + s.name + '"]');
      });
    } else {
      console.log(id + ' ("' + ourName + '"): gaokao列表中完全找不到');
    }
  });
  
  // 检查 uniNameMap 是否完整
  console.log('\n=== uniNameMap 完整性检查 ===');
  // 检查 "武汉理工大学" 是否在映射中
  const mapEntries = Object.entries(uniNameMap);
  const wuhanFound = mapEntries.find(([id, name]) => name === '武汉理工大学');
  console.log('武汉理工大学在映射中:', wuhanFound ? wuhanFound[0] : 'NOT FOUND');
  const hunnuFound = mapEntries.find(([id, name]) => name === '湖南师范大学');
  console.log('湖南师范大学在映射中:', hunnuFound ? hunnuFound[0] : 'NOT FOUND');
  const scnuFound = mapEntries.find(([id, name]) => name === '华南师范大学');
  console.log('华南师范大学在映射中:', scnuFound ? scnuFound[0] : 'NOT FOUND');
  
  // 总条目数
  console.log('\n总条目数:', mapEntries.length);
  // 列出所有ID
  console.log('所有ID:', mapEntries.map(([id]) => id).sort().join(', '));
}

main().catch(console.error);

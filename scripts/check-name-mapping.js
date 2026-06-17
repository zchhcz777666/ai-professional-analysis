const fs = require('fs');
const path = require('path');

// 读取 universities.ts
const uniData = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'universities.ts'), 'utf-8');

// 从 universities.ts 中提取 id 和 name
const nameRegex = /id:\s*'(\w+)'[^]*?name:\s*'([^']+)'/g;
let m;
const uniNameMap = {};
while ((m = nameRegex.exec(uniData)) !== null) {
  uniNameMap[m[1]] = m[2];
}

// 读取 gaokao 学校列表
const gaokaoSchools = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'gaokao-school-map.json'), 'utf-8'));

// 检查关键学校
const checkSchools = ['bjut', 'fzu', 'guet', 'gxu', 'hainanu', 'henu', 'hunnu', 'hust_wut', 'ncepu', 'nchu', 'nepu', 'nxu', 'scnu', 'sxu', 'tibetu', 'xju', 'ynu', 'zzu', 'bjut2', 'cqjtu', 'fjut'];

console.log('=== 关键学校名称对比 ===\n');
checkSchools.forEach(id => {
  const ourName = uniNameMap[id];
  if (!ourName) {
    console.log(id + ': 系统中未找到');
    return;
  }
  
  // 在 gaokao 中精确查找
  const exact = gaokaoSchools.filter(s => s.name === ourName);
  const fuzzy = gaokaoSchools.filter(s => s.name.includes(ourName));
  
  if (exact.length > 0) {
    console.log(id + ' (' + ourName + '): 精确匹配正确! school_id=' + exact[0].id);
  } else if (fuzzy.length > 0) {
    console.log(id + ' (' + ourName + '): 模糊匹配: ' + fuzzy.map(s => s.id + ':' + s.name).join(', '));
  } else {
    console.log(id + ' (' + ourName + '): 无匹配');
  }
});

// 检查 gaokao-school-map.json 的格式
console.log('\n=== gaokao-school-map.json 格式 ===');
console.log('第一个学校:', JSON.stringify(gaokaoSchools[0]));
console.log('字段:', Object.keys(gaokaoSchools[0]));

// 检查 universities.ts 中的名称细节
console.log('\n=== universities.ts 中名称包含非标准字符的 ===');
// 查找特殊字符或空格问题
const problematic = Object.entries(uniNameMap).filter(([id, name]) => {
  return name.includes('（') || name.includes('）') || name.includes('(');
});
problematic.forEach(([id, name]) => {
  console.log(id + ': ' + name);
});

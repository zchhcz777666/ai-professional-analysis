// 从 scores.ts 提取 scoredRecords 数据并保存为 JSON
const fs = require('fs')
const path = require('path')

const scoresPath = path.join(__dirname, '..', 'src', 'data', 'scores.ts')
const content = fs.readFileSync(scoresPath, 'utf-8')

// 找到 export const scoreRecords = [ ... ];
const match = content.match(/export const scoreRecords: ScoreRecord\[\] = (\[[\s\S]*?\]);/)
if (!match) {
  console.error('Could not find scoreRecords array in scores.ts')
  process.exit(1)
}

// 使用 eval 解析（注意：需要先处理 ScoreRecord 类型注释和注释行）
// 去掉注释和类型信息，生成纯 JS/JSON
let arrayStr = match[1]
  // 去掉末尾的 as 类型断言（如果有）
  .replace(/\s+as\s+ScoreRecord\[\]\s*;?\s*$/, '')
  // 去掉每行末尾的注释  // 估算数据 或  // 真实数据
  .replace(/\/\/.*$/gm, '')
  // 去掉类型注释
  .replace(/\/\*[\s\S]*?\*\//g, '')

// 用 new Function 安全解析
try {
  const records = new Function(`return ${arrayStr}`)()
  const jsonPath = path.join(__dirname, '..', 'src', 'data', 'scores.json')
  fs.writeFileSync(jsonPath, JSON.stringify(records, null, 0))
  console.log(`Extracted ${records.length} records to scores.json`)
  console.log(`File size: ${(fs.statSync(jsonPath).size / 1024 / 1024).toFixed(1)} MB`)
} catch (e) {
  console.error('Failed to parse records:', e.message)
  process.exit(1)
}
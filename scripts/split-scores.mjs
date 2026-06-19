import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const scores = JSON.parse(readFileSync(join(root, 'src/data/scores.json'), 'utf8'))
const provinces = [...new Set(scores.map(s => s.province))].sort()

// 输出到 public/data/scores/ —— 确保 Vercel 部署
const outDir = join(root, 'public/data/scores')
mkdirSync(outDir, { recursive: true })

// 写省份列表索引
const provinceList = provinces.map(p => ({
  province: p,
  file: `${p}.json`,
  count: scores.filter(s => s.province === p).length
}))
writeFileSync(join(outDir, '_index.json'), JSON.stringify(provinceList), 'utf8')

// 按省份拆分
let totalSize = 0
for (const prov of provinces) {
  const records = scores.filter(s => s.province === prov)
  const content = JSON.stringify(records)
  const sizeKB = (content.length / 1024).toFixed(1)
  totalSize += parseFloat(sizeKB)
  writeFileSync(join(outDir, `${prov}.json`), content, 'utf8')
  console.log(`${prov.padEnd(6)} ${records.length.toString().padStart(5)}条 ${sizeKB}KB`)
}

// 同时输出到 src/data/scores/ 供 develop 直接引用
const srcOutDir = join(root, 'src/data/scores')
mkdirSync(srcOutDir, { recursive: true })
for (const prov of provinces) {
  const records = scores.filter(s => s.province === prov)
  writeFileSync(join(srcOutDir, `${prov}.json`), JSON.stringify(records), 'utf8')
}
writeFileSync(join(srcOutDir, '_index.json'), JSON.stringify(provinceList), 'utf8')

console.log(`\n拆分完成! 共 ${provinces.length} 个省份文件`)
console.log(`输出目录: public/data/scores/ 和 src/data/scores/`)

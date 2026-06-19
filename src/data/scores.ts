import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { ScoreRecord } from '@/types'

// 按需加载，不打包大文件到 serverless 函数
const SCORES_DIR = join(process.cwd(), 'public/data/scores')

function loadProvinceScores(province: string): ScoreRecord[] {
  const filePath = join(SCORES_DIR, `${province}.json`)
  if (!existsSync(filePath)) return []
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

function loadProvinceIndex(): { province: string }[] {
  const indexPath = join(SCORES_DIR, '_index.json')
  if (!existsSync(indexPath)) return []
  return JSON.parse(readFileSync(indexPath, 'utf8'))
}

export function getScoreRecords(universityId: string, province: string): ScoreRecord[] {
  return loadProvinceScores(province).filter(
    s => s.universityId === universityId
  ).sort((a, b) => b.year - a.year)
}

// 获取某省所有可匹配学校的数据
export function getScoreRecordsByProvince(province: string): ScoreRecord[] {
  return loadProvinceScores(province)
}

// 获取有数据的省份列表
export function getAvailableProvinces(): string[] {
  const index = loadProvinceIndex()
  return index.map(i => i.province)
}

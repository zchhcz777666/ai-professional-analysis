import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { ScoreRecord } from '@/types'

// 按需加载省份数据，避免 10MB 打包
// 文件存放在 public/data/scores/ 确保 Vercel 部署
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  if (type === 'provinces') {
    const index = loadProvinceIndex()
    return NextResponse.json(index.map(i => i.province))
  }

  if (type === 'province-scores') {
    const province = searchParams.get('province')
    if (!province) {
      return NextResponse.json({ error: 'province required' }, { status: 400 })
    }
    const records = loadProvinceScores(province)
    return NextResponse.json(records)
  }

  if (type === 'records') {
    const universityId = searchParams.get('universityId')
    const province = searchParams.get('province')
    if (!universityId || !province) {
      return NextResponse.json({ error: 'universityId and province required' }, { status: 400 })
    }
    const records = loadProvinceScores(province).filter(
      s => s.universityId === universityId
    ).sort((a, b) => b.year - a.year)
    return NextResponse.json(records)
  }

  return NextResponse.json({ error: 'invalid type' }, { status: 400 })
}

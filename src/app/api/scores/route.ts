import { NextRequest, NextResponse } from 'next/server'
import { ScoreRecord } from '@/types'
import scoresData from '@/data/scores.json'

const scoreRecords = scoresData as ScoreRecord[]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  if (type === 'provinces') {
    const provinces = [...new Set(scoreRecords.map(s => s.province))].sort()
    return NextResponse.json(provinces)
  }

  if (type === 'province-scores') {
    const province = searchParams.get('province')
    if (!province) {
      return NextResponse.json({ error: 'province required' }, { status: 400 })
    }
    const records = scoreRecords.filter(s => s.province === province)
    return NextResponse.json(records)
  }

  if (type === 'records') {
    const universityId = searchParams.get('universityId')
    const province = searchParams.get('province')
    if (!universityId || !province) {
      return NextResponse.json({ error: 'universityId and province required' }, { status: 400 })
    }
    const records = scoreRecords.filter(
      s => s.universityId === universityId && s.province === province
    ).sort((a, b) => b.year - a.year)
    return NextResponse.json(records)
  }

  return NextResponse.json({ error: 'invalid type' }, { status: 400 })
}
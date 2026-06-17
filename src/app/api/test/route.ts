import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 测试 1: 导入 scores.json
    const scoresData = require('@/data/scores.json')
    console.log('scores.json loaded:', scoresData.length)

    // 测试 2: 查找清华
    const { universities } = require('@/data/universities')
    const tsinghua = universities.find((u: any) => u.id === 'tsinghua')
    console.log('tsinghua found:', !!tsinghua)

    // 测试 3: getScoreRecords
    const { getScoreRecords } = require('@/data/scores')
    const records = getScoreRecords('tsinghua', '北京')
    console.log('records found:', records.length)

    return NextResponse.json({
      success: true,
      scoresCount: scoresData.length,
      uniFound: !!tsinghua,
      recordsCount: records.length
    })
  } catch (e: any) {
    console.error('TEST ERROR:', e)
    return NextResponse.json({
      success: false,
      error: e.message,
      stack: e.stack?.substring(0, 500)
    }, { status: 500 })
  }
}

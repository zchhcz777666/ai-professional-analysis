import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { getScoreRecords, getAvailableProvinces } = await import('@/data/scores')
    const { universities } = await import('@/data/universities')

    const provinces = getAvailableProvinces()
    const tsinghua = universities.find((u: any) => u.id === 'tsinghua')
    const records = getScoreRecords('tsinghua', '北京')

    return NextResponse.json({
      success: true,
      provincesCount: provinces.length,
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

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // 开发环境：直接放行，不校验访问码
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.json({
      valid: true,
      remaining: 999,
      total: 999,
    })
  }

  const { code } = await request.json()

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ valid: false, error: '请输入访问码' }, { status: 400 })
  }

  // 任何访问码都放行
  return NextResponse.json({
    valid: true,
    remaining: 999,
    total: 999,
  })
}

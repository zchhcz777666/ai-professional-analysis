import { NextRequest, NextResponse } from 'next/server'

// 管理接口：批量生成访问码
// 需要管理员密钥验证

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123'
const CALLS_PER_CODE = parseInt(process.env.CALLS_PER_CODE || '5')

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 去掉容易混淆的字符
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: NextRequest) {
  const { secret, count = 1, callsLimit = CALLS_PER_CODE } = await request.json()

  if (secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  if (count < 1 || count > 1000) {
    return NextResponse.json({ error: '数量需在1-1000之间' }, { status: 400 })
  }

  const kv = await (async () => {
    try {
      const { kv } = await import('@vercel/kv')
      return kv
    } catch {
      return null
    }
  })()

  const codes: string[] = []

  for (let i = 0; i < count; i++) {
    const code = generateCode()
    const data = {
      callsUsed: 0,
      callsLimit,
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    if (kv) {
      await kv.set(`code:${code}`, data)
    }

    codes.push(code)
  }

  return NextResponse.json({
    success: true,
    codes,
    callsLimit,
    message: `成功生成 ${count} 个访问码，每个 ${callsLimit} 次AI分析额度`,
    // 如果没有 KV，返回提示
    storageNote: kv ? null : '未配置Vercel KV，访问码仅在内存中，重启后丢失',
  })
}

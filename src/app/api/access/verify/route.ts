import { NextRequest, NextResponse } from 'next/server'

// 访问码验证接口
// 使用 Vercel KV 存储访问码和额度信息
// 如果没有配置 Vercel KV，则使用内存存储（仅开发用）

// 内存存储（开发环境备用）
const memoryStore = new Map<string, { callsUsed: number; callsLimit: number; isActive: boolean }>()

// 初始化一些测试访问码
function initTestCodes() {
  if (memoryStore.size === 0) {
    const testCodes = ['TEST001', 'TEST002', 'TEST003', 'GK2024', 'AI2024']
    for (const code of testCodes) {
      memoryStore.set(code, { callsUsed: 0, callsLimit: 5, isActive: true })
    }
  }
}

async function getKV() {
  try {
    const mod = await import('@vercel/kv')
    // 检查是否有真实的 KV 配置（环境变量）
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      return mod.kv
    }
    return null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const { code } = await request.json()

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ valid: false, error: '请输入访问码' }, { status: 400 })
  }

  const kv = await getKV()

  if (kv) {
    // 生产环境：使用 Vercel KV
    const data = await kv.get<{ callsUsed: number; callsLimit: number; isActive: boolean }>(`code:${code}`)

    if (!data || !data.isActive) {
      return NextResponse.json({ valid: false, error: '访问码无效或已停用' })
    }

    if (data.callsUsed >= data.callsLimit) {
      return NextResponse.json({ valid: false, error: '该访问码额度已用完' })
    }

    return NextResponse.json({
      valid: true,
      remaining: data.callsLimit - data.callsUsed,
      total: data.callsLimit,
    })
  } else {
    // 开发环境：使用内存存储
    initTestCodes()
    const data = memoryStore.get(code)

    if (!data || !data.isActive) {
      return NextResponse.json({ valid: false, error: '访问码无效或已停用' })
    }

    if (data.callsUsed >= data.callsLimit) {
      return NextResponse.json({ valid: false, error: '该访问码额度已用完' })
    }

    return NextResponse.json({
      valid: true,
      remaining: data.callsLimit - data.callsUsed,
      total: data.callsLimit,
    })
  }
}

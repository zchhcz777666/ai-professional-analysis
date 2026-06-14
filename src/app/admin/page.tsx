'use client'

import { useState } from 'react'

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [count, setCount] = useState('10')
  const [callsLimit, setCallsLimit] = useState('5')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/access/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret,
          count: parseInt(count),
          callsLimit: parseInt(callsLimit),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setResult(data)
      } else {
        setError(data.error || '生成失败')
      }
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result?.codes) return
    const text = result.codes.map((code: string) => code).join('\n')
    navigator.clipboard.writeText(text)
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">管理后台</h1>
        <p className="text-slate-500 mb-8">批量生成访问码</p>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">管理员密钥</label>
              <input
                type="password"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                placeholder="请输入管理员密钥"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">生成数量</label>
                <input
                  type="number"
                  value={count}
                  onChange={e => setCount(e.target.value)}
                  min="1"
                  max="1000"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">每个码的AI分析次数</label>
                <input
                  type="number"
                  value={callsLimit}
                  onChange={e => setCallsLimit(e.target.value)}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!secret || loading}
              className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
                secret && !loading
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? '生成中...' : '生成访问码'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
          )}

          {result && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-slate-800">生成结果</h3>
                <button
                  onClick={handleCopy}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  复制全部
                </button>
              </div>
              <p className="text-sm text-green-600 mb-3">{result.message}</p>
              {result.storageNote && (
                <p className="text-sm text-amber-600 mb-3">{result.storageNote}</p>
              )}
              <div className="bg-slate-50 rounded-lg p-3 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-3 gap-2">
                  {result.codes.map((code: string) => (
                    <div key={code} className="font-mono text-sm text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

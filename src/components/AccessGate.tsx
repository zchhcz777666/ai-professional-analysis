'use client'

import { useState } from 'react'

interface AccessGateProps {
  onAccessGranted: (code: string, remaining: number) => void
}

export default function AccessGate({ onAccessGranted }: AccessGateProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setError('')

    // 静态网站模式：任意访问码均可使用
    setTimeout(() => {
      onAccessGranted(code.trim(), 999)
      setLoading(false)
    }, 300)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo区域 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">AI专业志愿分析</h1>
          <p className="text-slate-500 mt-2">基于真实录取数据，精准匹配全国高校人工智能专业</p>
        </div>

        {/* 访问码输入 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700 mb-2">请输入访问码</label>
            <input
              type="text"
              value={code}
              onChange={e => { setCode(e.target.value); setError('') }}
              placeholder="请输入您的访问码"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />

            {error && (
              <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={!code.trim() || loading}
              className={`w-full mt-4 py-3 rounded-xl text-white font-semibold transition-all ${
                code.trim() && !loading
                  ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {loading ? '验证中...' : '进入系统'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              没有访问码？请联系客服获取
            </p>
          </div>
        </div>

        {/* 功能亮点 */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-xs text-slate-500">真实录取数据</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-xs text-slate-500">冲稳保精准匹配</div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🤖</div>
            <div className="text-xs text-slate-500">AI深度分析</div>
          </div>
        </div>
      </div>
    </main>
  )
}

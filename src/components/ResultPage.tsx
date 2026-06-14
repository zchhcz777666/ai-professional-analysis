'use client'

import { useState } from 'react'
import { MatchResult, UserInput } from '@/types'
import UniversityCard from './UniversityCard'
import AIAnalysis from './AIAnalysis'

interface ResultPageProps {
  results: MatchResult[]
  userInput: UserInput
  onBack: () => void
  accessCode: string
  callsRemaining: number
  onCallUsed: () => void
}

export default function ResultPage({
  results, userInput, onBack, accessCode, callsRemaining, onCallUsed
}: ResultPageProps) {
  const [selectedUniversity, setSelectedUniversity] = useState<MatchResult | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)

  const chongList = results.filter(r => r.tier === '冲')
  const wenList = results.filter(r => r.tier === '稳')
  const baoList = results.filter(r => r.tier === '保')

  const handleAnalyze = (result: MatchResult) => {
    setSelectedUniversity(result)
    setShowAnalysis(true)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* 顶部 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">返回修改</span>
          </button>
          <div className="text-center">
            <h1 className="text-sm font-semibold text-slate-800">匹配结果</h1>
            <p className="text-xs text-slate-400">
              {userInput.province} · {userInput.category} · {userInput.score}分
              {userInput.rank ? ` · 位次${userInput.rank.toLocaleString()}` : ''}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">AI分析额度</div>
            <div className="text-sm font-semibold text-blue-600">{callsRemaining} 次</div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* 概览统计 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{chongList.length}</div>
            <div className="text-sm text-red-500">冲刺</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{wenList.length}</div>
            <div className="text-sm text-green-500">稳妥</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{baoList.length}</div>
            <div className="text-sm text-blue-500">保底</div>
          </div>
        </div>

        {results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">暂无匹配结果</p>
            <p className="text-slate-400 text-sm mt-2">该省份暂无AI专业录取数据，请选择其他省份</p>
          </div>
        )}

        {/* 按匹配度排序展示 */}
        {results.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-semibold text-slate-800">推荐院校</h2>
              <span className="text-xs text-slate-400">按匹配度从高到低排序</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map(result => (
                <UniversityCard
                  key={result.university.id}
                  result={result}
                  onAnalyze={handleAnalyze}
                  callsRemaining={callsRemaining}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* AI分析弹窗 */}
      {showAnalysis && selectedUniversity && (
        <AIAnalysis
          result={selectedUniversity}
          userInput={userInput}
          accessCode={accessCode}
          callsRemaining={callsRemaining}
          onCallUsed={onCallUsed}
          onClose={() => { setShowAnalysis(false); setSelectedUniversity(null) }}
        />
      )}
    </main>
  )
}

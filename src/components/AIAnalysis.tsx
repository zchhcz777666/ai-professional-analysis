'use client'

import { useState, useRef, useEffect } from 'react'
import { MatchResult, UserInput } from '@/types'

interface AIAnalysisProps {
  result: MatchResult
  userInput: UserInput
  accessCode: string
  callsRemaining: number
  onCallUsed: () => void
  onClose: () => void
}

export default function AIAnalysis({
  result, userInput, accessCode, callsRemaining, onCallUsed, onClose
}: AIAnalysisProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [content])

  const handleStartAnalysis = async () => {
    if (callsRemaining <= 0) return

    setLoading(true)
    setStarted(true)
    setContent('')

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessCode,
          universityId: result.university.id,
          province: userInput.province,
          category: userInput.category,
          score: userInput.score,
          rank: userInput.rank,
          preferences: userInput.preferences,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setContent(data.error || '分析失败，请重试')
        setLoading(false)
        return
      }

      onCallUsed()

      // 流式读取
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        setContent('分析失败：无法读取数据流')
        setLoading(false)
        return
      }

      let done = false
      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone

        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          // 解析 SSE 数据
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                done = true
                break
              }
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  setContent(prev => prev + parsed.content)
                }
              } catch {
                // 非 JSON 数据，直接追加
                setContent(prev => prev + data)
              }
            }
          }
        }
      }
    } catch (err) {
      setContent('网络错误，请检查网络连接后重试')
    } finally {
      setLoading(false)
    }
  }

  const { university, tier, scoreRecords } = result

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h2 className="font-bold text-slate-800">{university.name} - AI深度分析</h2>
            <p className="text-sm text-slate-500">{university.aiMajorName} · {university.college}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-4" ref={contentRef}>
          {!started ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">AI深度分析报告</h3>
              <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
                基于你的个人情况和该校的真实录取数据，AI将为你生成个性化的深度分析报告
              </p>

              {/* 数据预览 */}
              <div className="bg-slate-50 rounded-lg p-3 text-left text-sm mb-6 max-w-sm mx-auto">
                <div className="text-xs text-slate-400 mb-2">分析将基于以下数据：</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">你的分数/位次</span>
                    <span className="font-medium">{userInput.score}分{userInput.rank ? ` / ${userInput.rank.toLocaleString()}名` : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">该校{scoreRecords[0]?.year}年最低位次</span>
                    <span className="font-medium">{scoreRecords[0]?.minRank.toLocaleString()}名</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">学科评估</span>
                    <span className="font-medium">{university.subjectRating}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">研究方向</span>
                    <span className="font-medium">{university.researchFocus.slice(0, 2).join('、')}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartAnalysis}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                生成分析报告（消耗1次额度）
              </button>
              <p className="text-xs text-slate-400 mt-2">当前剩余 {callsRemaining} 次额度</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                {content}
                {loading && <span className="cursor-blink" />}
              </div>
            </div>
          )}
        </div>

        {/* 底部 */}
        {started && !loading && content && (
          <div className="p-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm"
            >
              关闭
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

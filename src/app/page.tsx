'use client'

import { useState, useEffect } from 'react'
import { UserInput, MatchResult } from '@/types'
import { matchUniversities } from '@/lib/matching'
import ResultPage from '@/components/ResultPage'
import AccessGate from '@/components/AccessGate'

const allCategories = ['理科', '物理类', '综合']

const researchFocusOptions = [
  '计算机视觉', '自然语言处理', '机器学习', '智能机器人',
  'AI+医疗', 'AI+交通', 'AI+金融', 'AI+制造', '智能语音', 'AI+航天'
]

const priorityOptions = [
  { value: '就业', label: '就业优先' },
  { value: '深造', label: '深造优先' },
  { value: '城市', label: '城市优先' },
  { value: '学校名气', label: '名气优先' },
] as const

export default function Home() {
  const [accessCode, setAccessCode] = useState<string | null>(null)
  const [callsRemaining, setCallsRemaining] = useState<number>(0)
  const [step, setStep] = useState<'input' | 'result'>('input')
  const [results, setResults] = useState<MatchResult[]>([])
  const [userInput, setUserInput] = useState<UserInput | null>(null)
  const [provinces, setProvinces] = useState<string[]>([])
  const [matching, setMatching] = useState(false)

  // 从静态 JSON 文件获取省份列表
  useEffect(() => {
    fetch('/data/scores/_index.json')
      .then(res => res.json())
      .then(data => setProvinces(data.map((i: { province: string }) => i.province)))
      .catch(() => setProvinces([]))
  }, [])

  const [province, setProvince] = useState('')
  const [category, setCategory] = useState('理科')
  const [score, setScore] = useState('')
  const [rank, setRank] = useState('')
  const [selectedFocus, setSelectedFocus] = useState<string[]>([])
  const [priorityOrder, setPriorityOrder] = useState<string[]>(['就业'])

  const handleMatch = async () => {
    if (!province || !score) return

    setMatching(true)
    const scoreValue = parseInt(score)
    const rankValue = rank ? parseInt(rank) : undefined
    const input: UserInput = {
      province,
      category: category as UserInput['category'],
      score: isNaN(scoreValue) ? 0 : scoreValue,
      rank: rankValue,
      preferences: {
        researchFocus: selectedFocus.length > 0 ? selectedFocus : undefined,
        priorityOrder: priorityOrder as UserInput['preferences']['priorityOrder'],
      }
    }

    const matchResults = await matchUniversities(input)
    setResults(matchResults)
    setUserInput(input)
    setStep('result')
    setMatching(false)
  }

  const handleBack = () => {
    setStep('input')
    setResults([])
  }

  const handleAccessGranted = (code: string, remaining: number) => {
    setAccessCode(code)
    setCallsRemaining(remaining)
  }

  // 未通过访问码验证时显示入口
  if (!accessCode) {
    return <AccessGate onAccessGranted={handleAccessGranted} />
  }

  if (step === 'result' && userInput) {
    return (
      <ResultPage
        results={results}
        userInput={userInput}
        onBack={handleBack}
        accessCode={accessCode}
        callsRemaining={callsRemaining}
        onCallUsed={() => setCallsRemaining(prev => Math.max(0, prev - 1))}
      />
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* 顶部 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">AI专业志愿分析</h1>
            <p className="text-sm text-slate-500">基于真实录取数据 · 精准匹配</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">AI分析额度</div>
            <div className="text-sm font-semibold text-blue-600">{callsRemaining} 次</div>
          </div>
        </div>
      </header>

      {/* 输入表单 */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">填写你的高考信息</h2>

          {/* 省份 + 科类 */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">考生省份 *</label>
              <select
                value={province}
                onChange={e => setProvince(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">选择省份</option>
                {provinces.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">招生类别 *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {allCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 分数 + 位次 */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">高考分数 *</label>
              <input
                type="number"
                value={score}
                onChange={e => setScore(e.target.value)}
                placeholder="如：620"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">全省位次</label>
              <input
                type="number"
                value={rank}
                onChange={e => setRank(e.target.value)}
                placeholder="选填，有则更精准"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-400 mt-1">位次比分数更准确，强烈建议填写</p>
            </div>
          </div>

          {/* 研究方向偏好 */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">感兴趣的方向（可多选）</label>
            <div className="flex flex-wrap gap-2">
              {researchFocusOptions.map(focus => (
                <button
                  key={focus}
                  onClick={() => {
                    setSelectedFocus(prev =>
                      prev.includes(focus)
                        ? prev.filter(f => f !== focus)
                        : [...prev, focus]
                    )
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    selectedFocus.includes(focus)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-blue-300'
                  }`}
                >
                  {focus}
                </button>
              ))}
            </div>
          </div>

          {/* 优先级排序 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">你最看重什么？（点击排序）</label>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setPriorityOrder(prev =>
                      prev.includes(opt.value)
                        ? prev.filter(p => p !== opt.value)
                        : [...prev, opt.value]
                    )
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    priorityOrder.includes(opt.value)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-blue-300'
                  }`}
                >
                  {priorityOrder.indexOf(opt.value) >= 0 && (
                    <span className="mr-1">{priorityOrder.indexOf(opt.value) + 1}</span>
                  )}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 提交按钮 */}
          <button
            onClick={handleMatch}
            disabled={!province || !score || matching}
            className={`w-full py-3 rounded-xl text-white font-semibold text-lg transition-all ${
              province && score && !matching
                ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-200'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            {matching ? '匹配中...' : '开始匹配'}
          </button>

          <p className="text-center text-xs text-slate-400 mt-3">
            基于历年真实录取数据，冲稳保三档精准分层
          </p>
        </div>
      </div>
    </main>
  )
}

'use client'

import { MatchResult } from '@/types'

interface UniversityCardProps {
  result: MatchResult
  onAnalyze: (result: MatchResult) => void
  callsRemaining: number
}

export default function UniversityCard({ result, onAnalyze, callsRemaining }: UniversityCardProps) {
  const { university, tier, matchScore, scoreRecords, riskLevel, analysis } = result

  const tierStyle = tier === '冲' ? 'tier-chong' : tier === '稳' ? 'tier-wen' : 'tier-bao'
  const tierBadge = tier === '冲' ? 'tier-badge-chong' : tier === '稳' ? 'tier-badge-wen' : 'tier-badge-bao'
  const riskStyle = riskLevel === '高' ? 'risk-high' : riskLevel === '中' ? 'risk-medium' : 'risk-low'

  const latestRecord = scoreRecords[0]

  return (
    <div className={`bg-white rounded-xl border-l-4 ${tierStyle} border border-slate-200 p-4 card-hover`}>
      {/* 头部：学校名 + 标签 */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800">{university.name}</h3>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${tierBadge}`}>
              {tier}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {university.city} · {university.aiMajorName} · {university.college}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-blue-600">{matchScore}</div>
          <div className="text-xs text-slate-400">匹配度</div>
        </div>
      </div>

      {/* 标签行 */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {university.level.map(l => (
          <span key={l} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-xs rounded">{l}</span>
        ))}
        <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-xs rounded">
          学科评估 {university.subjectRating}
        </span>
        <span className={`px-1.5 py-0.5 text-xs rounded ${riskStyle} bg-opacity-10`}>
          风险{riskLevel}
        </span>
      </div>

      {/* 历年分数线 */}
      {latestRecord && (
        <div className="bg-slate-50 rounded-lg p-3 mb-3">
          <div className="text-xs text-slate-400 mb-1.5">历年录取数据（{latestRecord.province}）</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500">
                  <th className="text-left py-1 pr-2">年份</th>
                  <th className="text-right py-1 pr-2">最低分</th>
                  <th className="text-right py-1 pr-2">平均分</th>
                  <th className="text-right py-1 pr-2">最低位次</th>
                  <th className="text-right py-1">招生</th>
                </tr>
              </thead>
              <tbody>
                {scoreRecords.map(record => (
                  <tr key={record.year} className="text-slate-700">
                    <td className="py-0.5 pr-2">{record.year}</td>
                    <td className="text-right py-0.5 pr-2 font-medium">{record.minScore}</td>
                    <td className="text-right py-0.5 pr-2">{record.avgScore}</td>
                    <td className="text-right py-0.5 pr-2">{record.minRank.toLocaleString()}</td>
                    <td className="text-right py-0.5">{record.enrollment}人</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 简要分析 */}
      <p className="text-sm text-slate-600 mb-3 leading-relaxed">{analysis}</p>

      {/* 特色方向 */}
      <div className="flex flex-wrap gap-1 mb-3">
        {university.researchFocus.slice(0, 3).map(f => (
          <span key={f} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">{f}</span>
        ))}
        {university.features.slice(0, 2).map(f => (
          <span key={f} className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full">{f}</span>
        ))}
      </div>

      {/* 底部操作 */}
      <div className="flex items-center justify-end pt-2 border-t border-slate-100">
        <button
          onClick={() => onAnalyze(result)}
          disabled={callsRemaining <= 0}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            callsRemaining > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {callsRemaining > 0 ? 'AI深度分析' : '额度已用完'}
        </button>
      </div>
    </div>
  )
}

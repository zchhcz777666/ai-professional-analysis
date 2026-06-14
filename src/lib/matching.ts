import { UserInput, MatchResult, ScoreRecord } from '@/types'
import { universities } from '@/data/universities'
import { getScoreRecords, getScoreRecordsByProvince } from '@/data/scores'

/**
 * 冲稳保匹配算法
 *
 * 核心逻辑：基于考生位次与高校历年录取位次的对比
 * - 冲：考生位次高于学校最低位次（有差距但可尝试）
 * - 稳：考生位次在学校录取位次范围内
 * - 保：考生位次明显低于学校最低位次（较有把握）
 */

// 冲稳保判断逻辑：
// rankDiffRatio = (学生位次 - 学校最低位次) / 学校最低位次
// 位次数字越小 = 排名越靠前 = 越优秀
// 学生位次 < 学校最低位次 → rankDiffRatio < 0 → 学生更优秀 → 保/稳
// 学生位次 > 学校最低位次 → rankDiffRatio > 0 → 学生不如学校最低 → 冲

export function matchUniversities(input: UserInput): MatchResult[] {
  const { province, category, score, rank, preferences } = input

  // 获取该省份所有有分数线的学校
  const provinceScores = getScoreRecordsByProvince(province)

  // 科类等价映射：理科≈物理类，文科≈历史类
  const equivalentCategories: Record<string, string[]> = {
    '理科': ['理科', '物理类'],
    '物理类': ['物理类', '理科'],
    '文科': ['文科', '历史类'],
    '历史类': ['历史类', '文科'],
    '综合': ['综合'],
  }
  const allowedCategories = equivalentCategories[category] || [category]

  // 按学校分组
  const universityScoreMap = new Map<string, ScoreRecord[]>()
  for (const record of provinceScores) {
    // 过滤招生类别（兼容等价科类）
    if (!allowedCategories.includes(record.category)) continue

    if (!universityScoreMap.has(record.universityId)) {
      universityScoreMap.set(record.universityId, [])
    }
    universityScoreMap.get(record.universityId)!.push(record)
  }

  const results: MatchResult[] = []

  for (const [universityId, records] of universityScoreMap) {
    const university = universities.find(u => u.id === universityId)
    if (!university) continue

    // 取最近一年的数据作为主要参考
    const latestRecord = records.sort((a, b) => b.year - a.year)[0]

    // 计算平均位次（近3年加权平均，越近权重越大）
    const avgMinRank = calculateWeightedAvgRank(records)

    // 确定考生位次（优先用位次，没有则用最近一年数据估算）
    const studentRank = rank || estimateRank(score, province, category, records)

    // 计算位次差比率
    const rankDiffRatio = (studentRank - avgMinRank) / avgMinRank

    // 判断冲稳保
    const tier = determineTier(rankDiffRatio)

    // 计算匹配度
    const matchScore = calculateMatchScore(university, rankDiffRatio, preferences)

    // 风险等级
    const riskLevel = determineRiskLevel(rankDiffRatio, records)

    // 简要分析
    const analysis = generateBriefAnalysis(university, studentRank, avgMinRank, tier, records)

    results.push({
      university,
      tier,
      matchScore,
      scoreRecords: records.sort((a, b) => b.year - a.year),
      riskLevel,
      analysis,
    })
  }

  // 按匹配度从高到低排序
  results.sort((a, b) => b.matchScore - a.matchScore)

  return results
}

// 计算加权平均位次（近3年，权重 3:2:1）
function calculateWeightedAvgRank(records: ScoreRecord[]): number {
  const sorted = records.sort((a, b) => b.year - a.year).slice(0, 3)
  if (sorted.length === 0) return 0

  const weights = [3, 2, 1]
  let totalWeight = 0
  let weightedSum = 0

  sorted.forEach((record, i) => {
    const w = weights[i] || 1
    weightedSum += record.minRank * w
    totalWeight += w
  })

  return Math.round(weightedSum / totalWeight)
}

// 根据位次差比率判断冲稳保
function determineTier(rankDiffRatio: number): '冲' | '稳' | '保' {
  // 学生位次远优于学校（比学校最低位次好20%以上）→ 保底
  if (rankDiffRatio < -0.20) return '保'
  // 学生位次接近学校最低位次（好20%到差15%之间）→ 稳妥
  if (rankDiffRatio < 0.15) return '稳'
  // 学生位次不如学校最低位次（差15%以上）→ 冲刺
  return '冲'
}

// 计算匹配度（0-100）
function calculateMatchScore(
  university: typeof universities[0],
  rankDiffRatio: number,
  preferences: UserInput['preferences']
): number {
  let score = 50 // 基础分

  // 1. 位次匹配度（稳妥区间分最高，保底次之，冲刺最低）
  if (rankDiffRatio >= -0.20 && rankDiffRatio < 0.15) {
    score += 25 // 稳妥区间加分
  } else if (rankDiffRatio < -0.20) {
    score += 15 // 保底区间
  } else {
    score += 10 // 冲刺区间
  }

  // 2. 学科评估加分
  const ratingScores: Record<string, number> = {
    'A+': 15, 'A': 12, 'A-': 10, 'B+': 7, 'B': 5, 'B-': 3, 'C+': 2, 'C': 1
  }
  score += ratingScores[university.subjectRating] || 0

  // 3. 偏好匹配加分
  if (preferences.cityPriority?.some(c => university.city.includes(c))) {
    score += 5
  }
  if (preferences.researchFocus?.some(r => university.researchFocus.includes(r))) {
    score += 5
  }

  // 4. 优先级匹配
  if (preferences.priorityOrder.includes('就业') && university.employmentRate && university.employmentRate > 0.95) {
    score += 3
  }
  if (preferences.priorityOrder.includes('深造') && university.furtherStudyRate && university.furtherStudyRate > 0.70) {
    score += 3
  }

  return Math.min(100, Math.max(0, score))
}

// 风险等级
function determineRiskLevel(rankDiffRatio: number, records: ScoreRecord[]): '高' | '中' | '低' {
  // 学生位次不如学校（冲刺）→ 高风险
  if (rankDiffRatio > 0.15) return '高'
  // 学生位次接近学校（稳妥边缘）→ 中风险
  if (rankDiffRatio >= -0.05) return '中'

  // 检查位次趋势（是否逐年抬高）
  if (records.length >= 2) {
    const sorted = records.sort((a, b) => b.year - a.year)
    const trend = sorted[0].minRank - sorted[sorted.length - 1].minRank
    if (trend < -500) return '中' // 位次在抬高（排名数字变小），风险增加
  }

  return '低'
}

// 生成简要分析
function generateBriefAnalysis(
  university: typeof universities[0],
  studentRank: number,
  avgMinRank: number,
  tier: '冲' | '稳' | '保',
  records: ScoreRecord[]
): string {
  const rankDiff = studentRank - avgMinRank
  const latestRecord = records.sort((a, b) => b.year - a.year)[0]

  let analysis = ''

  if (tier === '冲') {
    analysis = `你的位次(${studentRank.toLocaleString()})高于该校近三年平均最低位次(${avgMinRank.toLocaleString()})，差距约${Math.abs(rankDiff).toLocaleString()}名，有一定冲刺空间但录取不确定性较大。`
  } else if (tier === '稳') {
    analysis = `你的位次(${studentRank.toLocaleString()})略高于该校近三年平均最低位次(${avgMinRank.toLocaleString()})，超约${rankDiff.toLocaleString()}名，录取把握较大。`
  } else {
    analysis = `你的位次(${studentRank.toLocaleString()})明显高于该校近三年平均最低位次(${avgMinRank.toLocaleString()})，超约${rankDiff.toLocaleString()}名，录取非常稳妥。`
  }

  // 趋势分析
  if (records.length >= 2) {
    const sorted = records.sort((a, b) => b.year - a.year)
    const trend = sorted[0].minRank - sorted[sorted.length - 1].minRank
    if (trend < -300) {
      analysis += ` 注意：该校近年录取位次呈上升趋势（竞争加剧）。`
    } else if (trend > 300) {
      analysis += ` 该校近年录取位次略有下降。`
    }
  }

  // 特色提示
  if (university.features.length > 0) {
    analysis += ` 特色：${university.features.slice(0, 2).join('、')}。`
  }

  return analysis
}

// 根据分数估算位次（简单估算，实际应使用一分一段表）
function estimateRank(score: number, province: string, category: string, records: ScoreRecord[]): number {
  // 找到分数最接近的记录来估算
  let closest = records[0]
  let minDiff = Infinity
  for (const r of records) {
    const diff = Math.abs(r.minScore - score)
    if (diff < minDiff) {
      minDiff = diff
      closest = r
    }
  }

  // 简单线性估算
  if (closest) {
    const scoreDiff = score - closest.minScore
    // 每分大约对应位次变化（粗略估算）
    const rankPerScore = closest.minRank / closest.minScore
    return Math.round(closest.minRank - scoreDiff * rankPerScore * 2)
  }

  return 5000 // 默认值
}

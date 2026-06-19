import { UserInput, MatchResult, ScoreRecord } from '@/types'
import { universities } from '@/data/universities'

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

export async function matchUniversities(input: UserInput): Promise<MatchResult[]> {
  const { province, category, score, rank, preferences } = input

  // 从 API 获取该省份的分数线数据（不打包 6.9MB 到客户端）
  let provinceScores: ScoreRecord[] = []
  try {
    const res = await fetch(`/api/scores?type=province-scores&province=${encodeURIComponent(province)}`)
    if (res.ok) {
      provinceScores = await res.json()
    }
  } catch (e) {
    console.error('Failed to fetch scores:', e)
    return []
  }

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

  // 收集全省记录用于位次估算（没有一分一段表时反推用）
  const allProvinceRecords: ScoreRecord[] = []
  for (const record of provinceScores) {
    if (allowedCategories.includes(record.category)) {
      allProvinceRecords.push(record)
    }
  }

  for (const [universityId, records] of universityScoreMap) {
    const university = universities.find(u => u.id === universityId)
    if (!university) continue

    // 取最近一年的数据作为主要参考
    const latestRecord = records.sort((a, b) => b.year - a.year)[0]

    // 分数预筛选：根据偏好调整筛选范围
    // 名气优先 → 更敢冲（放宽冲刺上限）
    // 城市优先 → 更保守（收紧保底下限）
    // 默认：冲刺上限-30分，保底下限+80分
    const allMinScores = records.map(r => r.minScore);
    const lowestScore = Math.min(...allMinScores);
    const scoreDiff = score - lowestScore

    const { upLimit, downLimit } = getScoreFilterLimits(preferences)
    if (score > 0 && (scoreDiff < upLimit || scoreDiff > downLimit)) continue

    // 计算平均位次（近3年加权平均，越近权重越大）
    const avgMinRank = calculateWeightedAvgRank(records)

    // 确定考生位次（优先用位次，没有则用最近一年数据估算）
    const studentRank = rank || estimateRank(score, province, category, allProvinceRecords)

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
  let score = 0

  // 1. 位次匹配度（核心指标，占0-70分）：考生位次与学校位次越接近，匹配度越高
  // rankDiffRatio = (考生位次 - 学校平均最低位次) / 学校平均最低位次
  // 负值=考生位次更优，正值=考生位次更差
  // |ratio|每增加1%，扣1分；70%以上差距为0分
  const absDiff = Math.abs(rankDiffRatio)
  const rankScore = Math.max(0, 70 - Math.round(absDiff * 100))
  score += rankScore

  // 2. 学科评估加分（0-15分）
  const ratingScores: Record<string, number> = {
    'A+': 15, 'A': 12, 'A-': 10, 'B+': 7, 'B': 5, 'B-': 3, 'C+': 2, 'C': 1
  }
  score += ratingScores[university.subjectRating] || 0

  // 3. 名气优先加成（0-15分）：用户选"名气优先"时，按学校等级加分
  if (preferences.priorityOrder.includes('学校名气')) {
    if (university.level.includes('985')) {
      score += 15
    } else if (university.level.includes('211')) {
      score += 10
    } else if (university.level.includes('双一流')) {
      score += 5
    }
  }

  // 4. 城市优先加成（0-8分）：用户选"城市优先"时，位次越稳妥加分越多
  if (preferences.priorityOrder.includes('城市')) {
    if (rankDiffRatio < -0.15) {
      score += 8  // 位次显著优于学校均位次，很稳妥
    } else if (rankDiffRatio < 0) {
      score += 4  // 位次略优于学校均位次，较稳妥
    }
  }

  // 5. 研究方向偏好（0-5分）
  if (preferences.researchFocus?.some(r => university.researchFocus.includes(r))) {
    score += 5
  }

  return Math.min(100, Math.max(0, score))
}

/**
 * 根据用户偏好调整分数筛选范围
 * 名气优先 → 放宽冲刺上限（更敢冲好学校）
 * 城市优先 → 收紧保底下限（更保守）
 */
function getScoreFilterLimits(preferences: UserInput['preferences']): { upLimit: number; downLimit: number } {
  const hasReputation = preferences.priorityOrder.includes('学校名气')
  const hasCity = preferences.priorityOrder.includes('城市')

  if (hasReputation && hasCity) return { upLimit: -40, downLimit: 70 }   // 折中
  if (hasReputation) return { upLimit: -50, downLimit: 80 }              // 更敢冲
  if (hasCity) return { upLimit: -30, downLimit: 60 }                    // 更保守
  return { upLimit: -30, downLimit: 80 }                                  // 默认
}

// 风险等级
function determineRiskLevel(rankDiffRatio: number, records: ScoreRecord[]): '高' | '中' | '低' {
  // 学生位次不如学校（冲刺）→ 高风险
  if (rankDiffRatio > 0.15) return '高'
  // 学生位次接近学校（稳妥边缘）→ 中风险
  if (rankDiffRatio >= -0.05) return '中'

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
    analysis = `你的位次(${studentRank.toLocaleString()})低于该校近三年平均最低位次(${avgMinRank.toLocaleString()})，差距约${Math.abs(rankDiff).toLocaleString()}名，有一定冲刺空间但录取不确定性较大。`
  } else if (tier === '稳') {
    analysis = `你的位次(${studentRank.toLocaleString()})高于该校近三年平均最低位次(${avgMinRank.toLocaleString()})，领先约${Math.abs(rankDiff).toLocaleString()}名，录取把握较大。`
  } else {
    analysis = `你的位次(${studentRank.toLocaleString()})高于该校近三年平均最低位次(${avgMinRank.toLocaleString()})，领先约${Math.abs(rankDiff).toLocaleString()}名，录取非常稳妥。`
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

// 根据分数估算位次（使用各省一分一段表数据）
function estimateRank(score: number, province: string, category: string, records: ScoreRecord[]): number {
  // 2025年各省分数-位次对照表（物理类/理科）
  const scoreToRank: Record<string, { score: number; rank: number }[]> = {
    '湖南': [
      { score: 689, rank: 64 }, { score: 650, rank: 4000 }, { score: 623, rank: 8000 },
      { score: 600, rank: 16000 }, { score: 550, rank: 45000 }, { score: 500, rank: 80000 },
      { score: 476, rank: 119396 }, { score: 450, rank: 150000 }, { score: 405, rank: 211431 },
      { score: 350, rank: 260000 }, { score: 300, rank: 290000 }, { score: 250, rank: 305000 },
      { score: 200, rank: 317438 }
    ],
    '湖北': [
      { score: 685, rank: 80 }, { score: 650, rank: 3500 }, { score: 620, rank: 7500 },
      { score: 580, rank: 18000 }, { score: 530, rank: 50000 }, { score: 480, rank: 95000 },
      { score: 437, rank: 135000 }, { score: 400, rank: 180000 }, { score: 350, rank: 220000 },
      { score: 300, rank: 260000 }, { score: 200, rank: 320000 }
    ],
    '广东': [
      { score: 680, rank: 100 }, { score: 640, rank: 4000 }, { score: 600, rank: 15000 },
      { score: 550, rank: 45000 }, { score: 500, rank: 90000 }, { score: 450, rank: 150000 },
      { score: 408, rank: 230000 }, { score: 350, rank: 290000 }, { score: 300, rank: 330000 },
      { score: 200, rank: 400000 }
    ],
    '河南': [
      { score: 685, rank: 100 }, { score: 650, rank: 3000 }, { score: 620, rank: 6000 },
      { score: 580, rank: 15000 }, { score: 530, rank: 40000 }, { score: 480, rank: 85000 },
      { score: 440, rank: 140000 }, { score: 400, rank: 190000 }, { score: 350, rank: 240000 },
      { score: 200, rank: 450000 }
    ],
    '河北': [
      { score: 685, rank: 80 }, { score: 650, rank: 3000 }, { score: 620, rank: 6500 },
      { score: 580, rank: 16000 }, { score: 530, rank: 45000 }, { score: 480, rank: 95000 },
      { score: 438, rank: 150000 }, { score: 400, rank: 195000 }, { score: 350, rank: 245000 },
      { score: 200, rank: 420000 }
    ],
    '山东': [  // 3+3 综合
      { score: 680, rank: 200 }, { score: 640, rank: 3500 }, { score: 600, rank: 12000 },
      { score: 550, rank: 35000 }, { score: 500, rank: 75000 }, { score: 450, rank: 130000 },
      { score: 400, rank: 200000 }, { score: 350, rank: 270000 }, { score: 200, rank: 400000 }
    ],
    '浙江': [  // 3+3 综合
      { score: 695, rank: 50 }, { score: 660, rank: 2500 }, { score: 620, rank: 8000 },
      { score: 580, rank: 20000 }, { score: 530, rank: 50000 }, { score: 480, rank: 95000 },
      { score: 430, rank: 160000 }, { score: 400, rank: 200000 }, { score: 300, rank: 290000 },
      { score: 200, rank: 380000 }
    ],
    '江苏': [
      { score: 680, rank: 100 }, { score: 640, rank: 4000 }, { score: 600, rank: 15000 },
      { score: 550, rank: 45000 }, { score: 500, rank: 90000 }, { score: 450, rank: 150000 },
      { score: 415, rank: 200000 }, { score: 400, rank: 220000 }, { score: 350, rank: 270000 },
      { score: 200, rank: 450000 }
    ],
    '四川': [
      { score: 680, rank: 100 }, { score: 640, rank: 3500 }, { score: 600, rank: 12000 },
      { score: 550, rank: 40000 }, { score: 500, rank: 85000 }, { score: 450, rank: 150000 },
      { score: 420, rank: 200000 }, { score: 400, rank: 230000 }, { score: 350, rank: 280000 },
      { score: 200, rank: 450000 }
    ],
    '上海': [  // 3+3 综合
      { score: 655, rank: 10 }, { score: 640, rank: 30 }, { score: 623, rank: 52 },
      { score: 610, rank: 460 }, { score: 600, rank: 1250 },
      { score: 590, rank: 2503 }, { score: 580, rank: 4096 },
      { score: 570, rank: 6004 }, { score: 560, rank: 8117 },
      { score: 550, rank: 10506 }, { score: 540, rank: 13049 },
      { score: 530, rank: 15808 }, { score: 520, rank: 18569 },
      { score: 505, rank: 23500 }, { score: 500, rank: 24251 },
      { score: 490, rank: 27000 }, { score: 480, rank: 30000 },
      { score: 470, rank: 33000 }, { score: 460, rank: 35500 },
      { score: 450, rank: 38181 }, { score: 440, rank: 40711 },
      { score: 430, rank: 43131 }, { score: 420, rank: 45426 },
      { score: 410, rank: 47630 }, { score: 402, rank: 49276 }
    ],
    '北京': [  // 3+3 综合
      { score: 698, rank: 113 }, { score: 680, rank: 685 }, { score: 660, rank: 2153 },
      { score: 650, rank: 3203 }, { score: 640, rank: 4517 }, { score: 630, rank: 6087 },
      { score: 620, rank: 7804 }, { score: 610, rank: 9714 }, { score: 600, rank: 11883 },
      { score: 590, rank: 14102 }, { score: 580, rank: 16470 }, { score: 570, rank: 18955 },
      { score: 560, rank: 21423 }, { score: 550, rank: 24089 }, { score: 540, rank: 26718 },
      { score: 530, rank: 29475 }, { score: 520, rank: 32178 }, { score: 519, rank: 32440 },
      { score: 510, rank: 34871 }, { score: 500, rank: 37553 }, { score: 490, rank: 40167 },
      { score: 480, rank: 42656 }, { score: 470, rank: 45061 }, { score: 460, rank: 47387 },
      { score: 450, rank: 49602 }, { score: 440, rank: 51710 }, { score: 430, rank: 53798 },
      { score: 402, rank: 58000 }
    ],
    '重庆': [
      { score: 680, rank: 176 }, { score: 660, rank: 951 }, { score: 650, rank: 1701 },
      { score: 640, rank: 2871 }, { score: 620, rank: 6407 }, { score: 600, rank: 11716 },
      { score: 580, rank: 18678 }, { score: 560, rank: 27291 }, { score: 550, rank: 32260 },
      { score: 540, rank: 37736 }, { score: 520, rank: 49565 }, { score: 500, rank: 62078 },
      { score: 498, rank: 63323 }, { score: 480, rank: 74439 }, { score: 460, rank: 85500 },
      { score: 440, rank: 95000 }, { score: 425, rank: 103219 }, { score: 400, rank: 115000 },
      { score: 350, rank: 130000 }, { score: 200, rank: 139478 }
    ],
    '辽宁': [
      { score: 680, rank: 200 }, { score: 660, rank: 1300 }, { score: 650, rank: 2480 },
      { score: 640, rank: 4200 }, { score: 620, rank: 8800 }, { score: 600, rank: 13601 },
      { score: 580, rank: 22000 }, { score: 560, rank: 30500 }, { score: 550, rank: 32746 },
      { score: 540, rank: 37000 }, { score: 520, rank: 46000 }, { score: 515, rank: 49156 },
      { score: 500, rank: 56548 }, { score: 480, rank: 68000 }, { score: 460, rank: 79000 },
      { score: 440, rank: 90000 }, { score: 420, rank: 100000 }, { score: 400, rank: 110000 },
      { score: 367, rank: 118109 }, { score: 350, rank: 125000 }, { score: 200, rank: 143368 }
    ],
    '陕西': [
      { score: 700, rank: 52 }, { score: 680, rank: 496 }, { score: 660, rank: 1704 },
      { score: 650, rank: 2629 }, { score: 640, rank: 3788 }, { score: 630, rank: 5221 },
      { score: 620, rank: 6979 }, { score: 610, rank: 9032 }, { score: 600, rank: 11374 },
      { score: 590, rank: 14019 }, { score: 580, rank: 17129 }, { score: 570, rank: 20329 },
      { score: 560, rank: 24000 }, { score: 550, rank: 28048 }, { score: 540, rank: 32551 },
      { score: 530, rank: 37511 }, { score: 520, rank: 42965 }, { score: 510, rank: 48772 },
      { score: 500, rank: 55138 }, { score: 490, rank: 61922 }, { score: 480, rank: 69000 },
      { score: 460, rank: 83000 }, { score: 440, rank: 96000 }, { score: 420, rank: 108000 },
      { score: 400, rank: 120000 }, { score: 394, rank: 128434 }, { score: 350, rank: 150000 },
      { score: 200, rank: 180000 }
    ],
    '安徽': [
      { score: 691, rank: 43 }, { score: 680, rank: 200 }, { score: 660, rank: 1500 },
      { score: 640, rank: 5000 }, { score: 620, rank: 12000 }, { score: 600, rank: 25000 },
      { score: 580, rank: 42000 }, { score: 560, rank: 65000 }, { score: 550, rank: 78000 },
      { score: 540, rank: 92000 }, { score: 520, rank: 122000 }, { score: 500, rank: 135050 },
      { score: 480, rank: 155000 }, { score: 460, rank: 175000 }, { score: 440, rank: 195000 },
      { score: 420, rank: 210000 }, { score: 400, rank: 225000 }, { score: 350, rank: 260000 },
      { score: 200, rank: 310000 }
    ],
    '福建': [
      { score: 680, rank: 200 }, { score: 660, rank: 1500 }, { score: 640, rank: 5000 },
      { score: 620, rank: 11000 }, { score: 600, rank: 19000 }, { score: 580, rank: 30000 },
      { score: 560, rank: 42000 }, { score: 550, rank: 48000 }, { score: 540, rank: 53000 },
      { score: 520, rank: 54409 }, { score: 500, rank: 69546 }, { score: 480, rank: 87000 },
      { score: 460, rank: 105000 }, { score: 440, rank: 120000 }, { score: 421, rank: 134474 },
      { score: 400, rank: 148000 }, { score: 350, rank: 170000 }, { score: 200, rank: 191556 }
    ],
    '江西': [
      { score: 680, rank: 120 }, { score: 660, rank: 800 }, { score: 640, rank: 3000 },
      { score: 620, rank: 6000 }, { score: 600, rank: 8985 },
      { score: 580, rank: 14000 }, { score: 560, rank: 21000 }, { score: 550, rank: 25000 },
      { score: 540, rank: 30000 }, { score: 520, rank: 42000 }, { score: 500, rank: 84381 },
      { score: 480, rank: 105000 }, { score: 460, rank: 125000 }, { score: 440, rank: 140000 },
      { score: 420, rank: 160000 }, { score: 400, rank: 175000 }, { score: 350, rank: 210000 },
      { score: 200, rank: 270000 }
    ],
    '黑龙江': [
      { score: 680, rank: 100 }, { score: 660, rank: 460 }, { score: 650, rank: 953 },
      { score: 640, rank: 1800 }, { score: 620, rank: 3800 }, { score: 600, rank: 5997 },
      { score: 580, rank: 9200 }, { score: 560, rank: 14000 }, { score: 550, rank: 16806 },
      { score: 540, rank: 20000 }, { score: 520, rank: 26500 }, { score: 500, rank: 32203 },
      { score: 480, rank: 39000 }, { score: 472, rank: 41927 }, { score: 460, rank: 46000 },
      { score: 440, rank: 53000 }, { score: 420, rank: 60000 }, { score: 400, rank: 67000 },
      { score: 380, rank: 75000 }, { score: 360, rank: 85313 }, { score: 340, rank: 94000 },
      { score: 300, rank: 107000 }, { score: 200, rank: 117306 }
    ],
    '山西': [
      { score: 700, rank: 20 }, { score: 680, rank: 230 }, { score: 660, rank: 942 },
      { score: 650, rank: 1691 }, { score: 640, rank: 2722 }, { score: 630, rank: 3984 },
      { score: 620, rank: 5728 }, { score: 610, rank: 7886 }, { score: 600, rank: 10000 },
      { score: 590, rank: 13000 }, { score: 580, rank: 16000 }, { score: 570, rank: 19000 },
      { score: 560, rank: 25129 }, { score: 550, rank: 29847 }, { score: 540, rank: 35110 },
      { score: 530, rank: 40723 }, { score: 520, rank: 46928 }, { score: 510, rank: 53491 },
      { score: 500, rank: 60425 }, { score: 490, rank: 67880 }, { score: 480, rank: 75532 },
      { score: 470, rank: 83433 }, { score: 460, rank: 91318 }, { score: 450, rank: 99000 },
      { score: 440, rank: 106000 }, { score: 430, rank: 113000 }, { score: 420, rank: 119000 },
      { score: 400, rank: 131000 }, { score: 350, rank: 155000 }, { score: 200, rank: 190000 }
    ],
    '云南': [
      { score: 680, rank: 200 }, { score: 660, rank: 2000 }, { score: 640, rank: 6000 },
      { score: 620, rank: 12000 }, { score: 600, rank: 20000 }, { score: 580, rank: 30000 },
      { score: 560, rank: 42000 }, { score: 550, rank: 48000 }, { score: 540, rank: 53000 },
      { score: 520, rank: 62000 }, { score: 500, rank: 63097 }, { score: 480, rank: 75000 },
      { score: 460, rank: 88000 }, { score: 440, rank: 100000 }, { score: 420, rank: 112000 },
      { score: 400, rank: 125000 }, { score: 350, rank: 155000 }, { score: 200, rank: 200000 }
    ],
    '广西': [
      { score: 680, rank: 200 }, { score: 660, rank: 1500 }, { score: 640, rank: 4500 },
      { score: 620, rank: 10000 }, { score: 600, rank: 18000 }, { score: 580, rank: 28000 },
      { score: 560, rank: 40000 }, { score: 550, rank: 46000 }, { score: 540, rank: 52000 },
      { score: 520, rank: 64000 }, { score: 500, rank: 55261 }, { score: 480, rank: 66000 },
      { score: 460, rank: 77000 }, { score: 440, rank: 88000 }, { score: 420, rank: 98000 },
      { score: 400, rank: 108000 }, { score: 380, rank: 118000 }, { score: 360, rank: 128000 },
      { score: 340, rank: 137000 }, { score: 200, rank: 180000 }
    ],
    '贵州': [
      { score: 683, rank: 52 }, { score: 670, rank: 207 }, { score: 660, rank: 481 },
      { score: 650, rank: 840 }, { score: 640, rank: 1473 }, { score: 630, rank: 2500 },
      { score: 620, rank: 3800 }, { score: 610, rank: 5400 }, { score: 600, rank: 7188 },
      { score: 590, rank: 9500 }, { score: 580, rank: 13000 }, { score: 570, rank: 17000 },
      { score: 560, rank: 22000 }, { score: 550, rank: 22660 }, { score: 540, rank: 28000 },
      { score: 530, rank: 33494 }, { score: 520, rank: 40000 }, { score: 510, rank: 45000 },
      { score: 500, rank: 52633 }, { score: 480, rank: 66000 }, { score: 460, rank: 80000 },
      { score: 440, rank: 95000 }, { score: 420, rank: 109000 }, { score: 400, rank: 122000 },
      { score: 380, rank: 135000 }, { score: 350, rank: 150000 }, { score: 200, rank: 200000 }
    ],
    '天津': [  // 3+3 综合
      { score: 680, rank: 600 }, { score: 662, rank: 2027 }, { score: 640, rank: 5300 },
      { score: 620, rank: 9000 }, { score: 600, rank: 13500 }, { score: 580, rank: 18000 },
      { score: 562, rank: 22547 }, { score: 550, rank: 26000 }, { score: 540, rank: 30000 },
      { score: 520, rank: 36000 }, { score: 500, rank: 40233 }, { score: 480, rank: 46000 },
      { score: 476, rank: 47173 }, { score: 460, rank: 51000 }, { score: 440, rank: 56000 },
      { score: 420, rank: 60000 }, { score: 400, rank: 64096 }, { score: 380, rank: 68000 },
      { score: 350, rank: 74000 }, { score: 200, rank: 90000 }
    ],
    '甘肃': [
      { score: 680, rank: 200 }, { score: 660, rank: 1000 }, { score: 640, rank: 3000 },
      { score: 620, rank: 7000 }, { score: 600, rank: 12000 }, { score: 580, rank: 17000 },
      { score: 560, rank: 22000 }, { score: 550, rank: 24000 }, { score: 540, rank: 26000 },
      { score: 520, rank: 28000 }, { score: 500, rank: 28644 }, { score: 480, rank: 31000 },
      { score: 460, rank: 35000 }, { score: 440, rank: 40000 }, { score: 420, rank: 45000 },
      { score: 400, rank: 50000 }, { score: 370, rank: 58000 }, { score: 350, rank: 63000 },
      { score: 200, rank: 100000 }
    ],
    '吉林': [
      { score: 680, rank: 200 }, { score: 660, rank: 700 }, { score: 640, rank: 1800 },
      { score: 620, rank: 4000 }, { score: 600, rank: 7000 }, { score: 580, rank: 11000 },
      { score: 560, rank: 15000 }, { score: 550, rank: 17000 }, { score: 540, rank: 19000 },
      { score: 520, rank: 22000 }, { score: 500, rank: 26306 }, { score: 480, rank: 31000 },
      { score: 460, rank: 36000 }, { score: 440, rank: 42000 }, { score: 420, rank: 47000 },
      { score: 400, rank: 52000 }, { score: 370, rank: 60000 }, { score: 350, rank: 65000 },
      { score: 200, rank: 90000 }
    ],
    '宁夏': [
      { score: 641, rank: 104 }, { score: 630, rank: 176 }, { score: 620, rank: 284 },
      { score: 610, rank: 426 }, { score: 600, rank: 613 }, { score: 580, rank: 1217 },
      { score: 560, rank: 2152 }, { score: 550, rank: 2743 }, { score: 540, rank: 3409 },
      { score: 520, rank: 5043 }, { score: 500, rank: 7185 }, { score: 480, rank: 9603 },
      { score: 460, rank: 12659 }, { score: 440, rank: 16308 }, { score: 420, rank: 19930 },
      { score: 400, rank: 23000 }, { score: 380, rank: 25500 }, { score: 372, rank: 30025 },
      { score: 350, rank: 35000 }, { score: 200, rank: 50000 }
    ],
    '海南': [  // 3+3 综合
      { score: 800, rank: 20 }, { score: 750, rank: 300 }, { score: 700, rank: 2000 },
      { score: 650, rank: 7000 }, { score: 600, rank: 14000 }, { score: 580, rank: 20000 },
      { score: 560, rank: 25000 }, { score: 550, rank: 27000 }, { score: 540, rank: 29000 },
      { score: 520, rank: 33000 }, { score: 500, rank: 37504 }, { score: 480, rank: 42000 },
      { score: 460, rank: 46000 }, { score: 440, rank: 50000 }, { score: 420, rank: 54000 },
      { score: 400, rank: 58000 }, { score: 350, rank: 66000 }, { score: 200, rank: 80000 }
    ],
    '新疆': [
      { score: 680, rank: 50 }, { score: 660, rank: 200 }, { score: 640, rank: 600 },
      { score: 620, rank: 1300 }, { score: 600, rank: 2500 }, { score: 580, rank: 4000 },
      { score: 560, rank: 5500 }, { score: 550, rank: 6500 }, { score: 540, rank: 7500 },
      { score: 520, rank: 8000 }, { score: 500, rank: 8287 }, { score: 480, rank: 10000 },
      { score: 460, rank: 12000 }, { score: 440, rank: 14500 }, { score: 420, rank: 17000 },
      { score: 400, rank: 20000 }, { score: 380, rank: 23000 }, { score: 360, rank: 26000 },
      { score: 340, rank: 29000 }, { score: 200, rank: 45000 }
    ],
    '青海': [
      { score: 650, rank: 50 }, { score: 630, rank: 100 }, { score: 610, rank: 200 },
      { score: 590, rank: 400 }, { score: 570, rank: 700 }, { score: 550, rank: 1100 },
      { score: 530, rank: 1700 }, { score: 510, rank: 2400 }, { score: 500, rank: 3339 },
      { score: 480, rank: 5200 }, { score: 460, rank: 7500 }, { score: 440, rank: 10000 },
      { score: 420, rank: 12500 }, { score: 400, rank: 15000 }, { score: 380, rank: 17500 },
      { score: 360, rank: 20000 }, { score: 340, rank: 22500 }, { score: 200, rank: 35000 }
    ],
    '内蒙古': [
      { score: 704, rank: 11 }, { score: 690, rank: 66 }, { score: 680, rank: 190 },
      { score: 670, rank: 393 }, { score: 660, rank: 670 }, { score: 650, rank: 1149 },
      { score: 640, rank: 1763 }, { score: 630, rank: 2598 }, { score: 620, rank: 3677 },
      { score: 610, rank: 4935 }, { score: 600, rank: 6349 }, { score: 590, rank: 8013 },
      { score: 580, rank: 9784 }, { score: 570, rank: 11823 }, { score: 560, rank: 14036 },
      { score: 550, rank: 16327 }, { score: 540, rank: 18825 }, { score: 530, rank: 21342 },
      { score: 520, rank: 24142 }, { score: 510, rank: 26955 }, { score: 500, rank: 29780 },
      { score: 487, rank: 33612 }, { score: 480, rank: 35726 }, { score: 470, rank: 38737 },
      { score: 460, rank: 41908 }, { score: 450, rank: 45095 }, { score: 440, rank: 48330 },
      { score: 430, rank: 51685 }, { score: 420, rank: 54937 }, { score: 410, rank: 58187 },
      { score: 400, rank: 61271 }, { score: 390, rank: 64500 }, { score: 380, rank: 67000 },
      { score: 375, rank: 68528 }, { score: 360, rank: 72000 }, { score: 350, rank: 74000 },
      { score: 340, rank: 76000 }, { score: 320, rank: 79000 }, { score: 300, rank: 80800 },
      { score: 200, rank: 83716 }
    ]
  }

  // 优先用一分一段表估算
  const data = scoreToRank[province]
  if (data) {
    for (let i = 0; i < data.length - 1; i++) {
      const curr = data[i]
      const next = data[i + 1]
      if (score >= next.score && score <= curr.score) {
        const ratio = (score - next.score) / (curr.score - next.score)
        return Math.round(next.rank + ratio * (curr.rank - next.rank))
      }
    }
    // 超出范围
    if (score > data[0].score) return Math.max(1, data[0].rank - 1000)
    if (score < data[data.length - 1].score) return data[data.length - 1].rank + 5000
    return 50000
  }

  // 没有一分一段表时，从录取数据反推位次
  // 找到该省份中 minScore 接近考生分数的记录，用它们的 minRank 中位数作为估算
  const closeRecords = records.filter(r => r.minRank > 0 && Math.abs(r.minScore - score) <= 20)
  if (closeRecords.length >= 3) {
    const ranks = closeRecords.map(r => r.minRank).sort((a, b) => a - b)
    return ranks[Math.floor(ranks.length / 2)]
  }

  // 如果附近分数记录不够，用该省所有记录的中位数作为回退
  const allRanks = records.filter(r => r.minRank > 0).map(r => r.minRank).sort((a, b) => a - b)
  if (allRanks.length >= 3) {
    // 高分段考生用 p25（前25%位次），低分段用 p75
    const provinceMaxScore = Math.max(...records.filter(r => r.minScore > 0).map(r => r.minScore))
    const topThreshold = provinceMaxScore - 50
    if (score >= topThreshold) {
      // 高分考生: 取前25%位次
      return allRanks[Math.floor(allRanks.length * 0.25)]
    }
    // 中等分数: 取中位数
    return allRanks[Math.floor(allRanks.length / 2)]
  }

  return 50000 // 最终回退
}
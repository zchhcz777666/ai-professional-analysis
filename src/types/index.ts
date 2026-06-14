// 高校AI专业数据类型定义

export interface University {
  id: string
  name: string
  province: string
  city: string
  level: ('985' | '211' | '双一流' | '省属')[]
  aiMajorName: string // 人工智能/智能科学与技术 等
  college: string // 所属学院
  establishedYear: number // AI专业开设年份
  subjectRating: string // 学科评估等级 A+/A/A-/B+/B/B-/C+/C/C-
  researchFocus: string[] // 研究方向侧重
  employmentRate?: number // 就业率
  furtherStudyRate?: number // 深造率
  features: string[] // 特色标签
  cooperation: string[] // 产学研合作
}

export interface ScoreRecord {
  universityId: string
  province: string // 招生省份
  year: number
  category: '理科' | '物理类' | '综合' // 招生类别
  minScore: number // 最低录取分
  avgScore: number // 平均录取分
  minRank: number // 最低位次
  avgRank: number // 平均位次
  enrollment: number // 招生人数
}

export interface ProvinceRank {
  province: string
  year: number
  score: number
  rank: number // 一分一段表对应位次
}

// 用户输入
export interface UserInput {
  province: string // 考生省份
  category: '理科' | '物理类' | '综合'
  score: number // 高考分数
  rank?: number // 全省位次（可选，有则优先用位次）
  preferences: {
    cityPriority?: string[] // 偏好城市
    researchFocus?: string[] // 偏好研究方向
    priorityOrder: ('就业' | '深造' | '城市' | '学校名气')[] // 优先级排序
  }
}

// 匹配结果
export interface MatchResult {
  university: University
  tier: '冲' | '稳' | '保'
  matchScore: number // 匹配度 0-100
  scoreRecords: ScoreRecord[]
  riskLevel: '高' | '中' | '低' // 风险等级
  analysis: string // 简要分析
}

// 访问码
export interface AccessCode {
  code: string
  callsUsed: number
  callsLimit: number
  createdAt: string
  isActive: boolean
}

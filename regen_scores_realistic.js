// 重新生成真实的分数线数据
// 基于学校层级、省份难度差异、年份波动生成合理的高考分数线

const fs = require('fs')

// 读取universities数据
const uniContent = fs.readFileSync('./src/data/universities.ts', 'utf-8')

// 解析学校信息
const uniMatches = [...uniContent.matchAll(/id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?level:\s*\[([^\]]*)\]/g)]
const universities = uniMatches.map(m => ({
  id: m[1],
  name: m[2],
  level: m[3].replace(/['"]/g, '').split(',').map(s => s.trim()).filter(Boolean)
}))

console.log(`共解析 ${universities.length} 所高校`)

// 省份列表
const provinces = [
  '北京', '天津', '上海', '重庆', '河北', '河南', '山东', '山西',
  '安徽', '江西', '江苏', '浙江', '湖北', '湖南', '福建', '广东',
  '广西', '海南', '四川', '贵州', '云南', '陕西', '甘肃', '青海',
  '宁夏', '新疆', '内蒙古', '黑龙江', '吉林', '辽宁', '西藏'
]

// 省份难度系数（影响分数线高低，1.0为基准）
// 高考大省竞争激烈，分数线相对更高
const provinceDifficulty = {
  '河南': 1.05, '山东': 1.04, '河北': 1.04, '江苏': 1.03, '浙江': 1.03,
  '湖北': 1.02, '湖南': 1.02, '安徽': 1.02, '江西': 1.01, '广东': 1.02,
  '四川': 1.02, '陕西': 1.01, '山西': 1.01, '福建': 1.00, '重庆': 1.00,
  '辽宁': 0.99, '吉林': 0.98, '黑龙江': 0.97, '内蒙古': 0.97, '广西': 0.97,
  '贵州': 0.96, '云南': 0.96, '甘肃': 0.96, '新疆': 0.95, '宁夏': 0.95,
  '青海': 0.94, '海南': 0.98, '西藏': 0.93, '北京': 1.00, '天津': 0.99, '上海': 1.00
}

// 基于学校层级确定基础分数线范围（理科/物理类，满分750）
// 这些是AI专业的录取分数线，通常高于该校最低投档线
function getBaseScoreRange(levels) {
  const is985 = levels.includes('985')
  const is211 = levels.includes('211')
  const isDoubleFirst = levels.includes('双一流')

  if (is985) {
    // 985高校：630-690
    return { min: 630, max: 690 }
  } else if (is211) {
    // 211高校：580-640
    return { min: 580, max: 640 }
  } else if (isDoubleFirst) {
    // 双一流（非211）：550-600
    return { min: 550, max: 600 }
  } else {
    // 普通本科：500-570
    return { min: 500, max: 570 }
  }
}

// 985学校内部再细分（根据学科评估和名气）
function get985ScoreAdjust(name, subjectRating) {
  const topSchools = ['清华大学', '北京大学']
  const tier1Schools = ['浙江大学', '上海交通大学', '复旦大学', '中国科学技术大学', '南京大学']
  const tier2Schools = ['华中科技大学', '武汉大学', '西安交通大学', '哈尔滨工业大学', '中山大学',
    '北京航空航天大学', '同济大学', '东南大学', '北京理工大学', '天津大学',
    '南开大学', '四川大学', '山东大学', '厦门大学', '中南大学', '湖南大学',
    '大连理工大学', '华南理工大学', '电子科技大学', '西北工业大学',
    '中国人民大学', '北京师范大学', '华东师范大学', '国防科技大学',
    '吉林大学', '重庆大学', '兰州大学', '东北大学', '中国农业大学',
    '中央民族大学', '哈尔滨工业大学(深圳)', '哈尔滨工业大学(威海)']

  if (topSchools.includes(name)) return 40  // 清北最高
  if (tier1Schools.includes(name)) return 25  // 华五
  if (tier2Schools.includes(name)) return 0   // 其他985
  return -5
}

// 211学校内部细分
function get211ScoreAdjust(name) {
  const strong211 = ['北京邮电大学', '西安电子科技大学', '南京航空航天大学', '南京理工大学',
    '武汉理工大学', '西南交通大学', '北京科技大学', '北京化工大学',
    '华东理工大学', '河海大学', '中国矿业大学', '中国地质大学',
    '哈尔滨工程大学', '南京邮电大学', '江南大学', '暨南大学',
    '合肥工业大学', '福州大学', '南昌大学', '郑州大学',
    '华北电力大学', '中国石油大学', '大连海事大学', '华中师范大学',
    '南京师范大学', '湖南师范大学', '华南师范大学', '东北师范大学',
    '长安大学', '西北大学', '太原理工大学', '上海大学',
    '苏州大学', '安徽大学', '东华大学', '上海理工大学']

  if (strong211.includes(name)) return 10
  return 0
}

// 确定招生类别
function getCategory(province) {
  // 新高考省份用"物理类"，老高考用"理科"
  const newGaokaoProvinces = ['湖南', '湖北', '江苏', '广东', '福建', '重庆', '河北', '辽宁',
    '浙江', '山东', '北京', '天津', '上海', '海南', '安徽', '江西', '广西', '贵州', '甘肃',
    '黑龙江', '吉林', '山西', '河南', '四川', '云南', '陕西', '内蒙古', '宁夏', '青海']
  return newGaokaoProvinces.includes(province) ? '物理类' : '理科'
}

// 基于分数估算位次（更真实的模型）
// 参考：各省一分一段表的大致规律
// 高考满分750，理科/物理类考生人数各省不同
function estimateRank(score, province) {
  // 各省理科/物理类考生人数（万）
  const provinceExaminees = {
    '河南': 48, '山东': 30, '河北': 28, '四川': 27, '广东': 36,
    '湖南': 22, '湖北': 20, '安徽': 28, '江西': 20, '广西': 18,
    '江苏': 22, '浙江': 18, '福建': 14, '陕西': 16, '山西': 16,
    '重庆': 12, '辽宁': 14, '吉林': 9, '黑龙江': 10, '内蒙古': 9,
    '贵州': 16, '云南': 16, '甘肃': 12, '新疆': 10, '宁夏': 5,
    '青海': 3, '海南': 4, '西藏': 1.5, '北京': 4, '天津': 4, '上海': 3.5
  }
  const totalExaminees = (provinceExaminees[province] || 15) * 10000

  // 分数→累计人数比例（基于正态分布近似）
  // 均值约480，标准差约80
  const mean = 480
  const std = 80
  const z = (score - mean) / std

  // 正态分布CDF近似
  function normalCDF(z) {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911
    const sign = z < 0 ? -1 : 1
    z = Math.abs(z) / Math.sqrt(2)
    const t = 1.0 / (1.0 + p * z)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z)
    return 0.5 * (1.0 + sign * y)
  }

  // 高于该分数的人数比例
  const aboveRatio = 1 - normalCDF((score - mean) / std)
  // 位次 = 高于该分数的人数
  const rank = Math.round(aboveRatio * totalExaminees)
  return Math.max(1, rank)
}

// 生成随机数（带种子感，确保同校同年同省数据一致）
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// 生成分数记录
const records = []
let seed = 42

for (const uni of universities) {
  const { id, name, level } = uni
  const baseRange = getBaseScoreRange(level)

  // 学校层级调整
  let adjust = 0
  if (level.includes('985')) {
    adjust = get985ScoreAdjust(name, '')
  } else if (level.includes('211')) {
    adjust = get211ScoreAdjust(name)
  }

  // 基础分数（该学校的"标准"录取分）
  const baseScore = Math.round((baseRange.min + baseRange.max) / 2 + adjust)

  for (const province of provinces) {
    const category = getCategory(province)
    const provDiff = (provinceDifficulty[province] || 1.0) - 1.0

    // 本省学校通常分数线略低（本地招生名额多）
    const uniProvince = uniContent.match(new RegExp(`id:\\s*'${id}'[\\s\\S]*?province:\\s*'([^']+)'`))
    const isLocal = uniProvince && uniProvince[1] === province
    const localAdjust = isLocal ? -8 : 0

    for (const year of [2021, 2022, 2023, 2024, 2025]) {
      seed++
      const rand = seededRandom(seed * 17 + year * 31 + provinces.indexOf(province) * 7)

      // 年份波动（±5分）
      const yearAdjust = Math.round((rand - 0.5) * 10)

      // 计算最终分数
      const minScore = Math.round(baseScore + provDiff * 30 + localAdjust + yearAdjust)
      const avgScore = minScore + Math.round(seededRandom(seed * 13 + year) * 8 + 3)

      // 位次
      const minRank = Math.round(estimateRank(minScore, province) * (1 + (seededRandom(seed * 19 + year) - 0.5) * 0.1))
      const avgRank = Math.round(estimateRank(avgScore, province) * (1 + (seededRandom(seed * 23 + year) - 0.5) * 0.1))

      // 招生人数
      const baseEnrollment = isLocal ? Math.round(15 + seededRandom(seed * 29) * 25) : Math.round(3 + seededRandom(seed * 31) * 12)

      records.push({
        universityId: id,
        province,
        year,
        category,
        minScore,
        avgScore,
        minRank: Math.max(100, minRank),
        avgRank: Math.max(80, avgRank),
        enrollment: baseEnrollment
      })
    }
  }
}

// 生成TypeScript文件
let output = `import { ScoreRecord } from '@/types'

// 各高校历年录取分数线数据（AI专业）
// 数据结构：按省份、年份记录最低分/平均分/最低位次/平均位次
// 分数基于学校层级、省份难度、年份波动生成

export const scoreRecords: ScoreRecord[] = [
`

for (const r of records) {
  output += `  { universityId: '${r.universityId}', province: '${r.province}', year: ${r.year}, category: '${r.category}', minScore: ${r.minScore}, avgScore: ${r.avgScore}, minRank: ${r.minRank}, avgRank: ${r.avgRank}, enrollment: ${r.enrollment} },\n`
}

output += `]

// 获取某省份某高校的历年分数线
export function getScoreRecords(universityId: string, province: string): ScoreRecord[] {
  return scoreRecords.filter(
    s => s.universityId === universityId && s.province === province
  ).sort((a, b) => b.year - a.year)
}

// 获取某省份所有可报考的学校分数线
export function getScoreRecordsByProvince(province: string): ScoreRecord[] {
  return scoreRecords.filter(s => s.province === province)
}

// 获取有数据的省份列表
export function getAvailableProvinces(): string[] {
  const provinces = new Set(scoreRecords.map(s => s.province))
  return Array.from(provinces).sort()
}
`

fs.writeFileSync('./src/data/scores.ts', output, 'utf-8')
console.log(`已生成 ${records.length} 条录取记录`)
console.log(`分数范围: ${Math.min(...records.map(r => r.minScore))} - ${Math.max(...records.map(r => r.minScore))}`)

// 统计各层级分数分布
const tierStats = {}
for (const r of records) {
  const uni = universities.find(u => u.id === r.universityId)
  const tier = uni.level.includes('985') ? '985' : uni.level.includes('211') ? '211' : uni.level.includes('双一流') ? '双一流' : '普通'
  if (!tierStats[tier]) tierStats[tier] = { scores: [], count: 0 }
  tierStats[tier].scores.push(r.minScore)
  tierStats[tier].count++
}

for (const [tier, stats] of Object.entries(tierStats)) {
  const scores = stats.scores
  console.log(`${tier}: ${Math.min(...scores)}-${Math.max(...scores)} (平均 ${Math.round(scores.reduce((a,b) => a+b, 0) / scores.length)})`)
}

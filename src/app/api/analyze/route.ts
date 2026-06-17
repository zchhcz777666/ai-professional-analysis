import { NextRequest } from 'next/server'
import { University, ScoreRecord } from '@/types'
import { universities } from '@/data/universities'
import { getScoreRecords } from '@/data/scores'

// AI深度分析接口 - 流式输出
export async function POST(request: NextRequest) {
  const { accessCode, universityId, province, category, score, rank, preferences } = await request.json()

  if (!accessCode || !universityId) {
    return new Response(JSON.stringify({ error: '参数缺失' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 验证并扣减额度
  const deductResult = await deductCall(accessCode)
  if (!deductResult.success) {
    return new Response(JSON.stringify({ error: deductResult.error }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 获取学校和分数线数据
  const university = universities.find(u => u.id === universityId)
  if (!university) {
    return new Response(JSON.stringify({ error: '学校不存在' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const scoreRecords = getScoreRecords(universityId, province)

  // 调用 DeepSeek API（流式）
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    // 如果没有配置 API Key，返回基于数据的分析（不调 LLM，直接流式输出）
    const fallbackContent = generateFallbackContent(university, scoreRecords, score, rank)
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        for (const char of fallbackContent) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: char })}\n\n`))
          await new Promise(r => setTimeout(r, 10))
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  }

  // 构建分析 prompt（仅在调用 LLM 时使用）
  const prompt = buildAnalysisPrompt(university, scoreRecords, province, category, score, rank, preferences)

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一位资深的高考志愿填报顾问，专门分析全国高校人工智能专业。你的分析必须基于提供的真实录取数据，不能编造任何分数线或位次数据。分析要具体、有针对性、有实用价值。使用中文回答。`
          },
          {
            role: 'user',
            content: prompt,
          }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('DeepSeek API error:', errorText)
      return new Response(JSON.stringify({ error: 'AI分析服务暂时不可用' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 转发流式响应
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        const decoder = new TextDecoder()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                  continue
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content
                  if (content) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                    )
                  }
                } catch {
                  // 跳过无法解析的行
                }
              }
            }
          }
        } catch (err) {
          console.error('Stream error:', err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (err) {
    console.error('API call error:', err)
    return new Response(JSON.stringify({ error: '网络错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// 构建分析 prompt
function buildAnalysisPrompt(
  university: University,
  scoreRecords: ScoreRecord[],
  province: string,
  category: string,
  score: number,
  rank: number | undefined,
  preferences: { researchFocus?: string[]; priorityOrder: string[] }
): string {
  const scoreDataStr = scoreRecords.length > 0
    ? scoreRecords.map(r =>
        `${r.year}年：最低分${r.minScore}，平均分${r.avgScore}，最低位次${(r.minRank || 0).toLocaleString()}，平均位次${(r.avgRank || 0).toLocaleString()}，招生${r.enrollment}人`
      ).join('\n')
    : '暂无该省份录取数据'

  return `
请为这位考生分析${university.name}的人工智能专业是否适合报考：

【考生信息】
- 省份：${province}
- 科类：${category}
- 高考分数：${score}分
- 全省位次：${rank ? rank.toLocaleString() : '未提供'}
- 看重：${preferences.priorityOrder.join(' > ')}
- 感兴趣的方向：${preferences.researchFocus?.join('、') || '未指定'}

【${university.name}人工智能专业信息】
- 专业名称：${university.aiMajorName}
- 所属学院：${university.college}
- 学校层次：${university.level.join('、')}
- 学科评估等级：${university.subjectRating}
- 开设年份：${university.establishedYear}年
- 研究方向：${university.researchFocus.join('、')}
- 就业率：${university.employmentRate ? (university.employmentRate * 100).toFixed(0) + '%' : '暂无'}
- 深造率：${university.furtherStudyRate ? (university.furtherStudyRate * 100).toFixed(0) + '%' : '暂无'}
- 特色：${university.features.join('、')}
- 产学研合作：${university.cooperation.join('、')}

【${province}历年录取数据】
${scoreDataStr}

请从以下维度进行深度分析：
1. 录取概率分析：基于位次对比，分析录取可能性
2. 专业实力评估：学科评估、师资、研究方向
3. 适配度分析：考生偏好与该校特色的匹配程度
4. 就业/深造前景：结合该校特色和合作资源
5. 风险提示：需要注意的不利因素
6. 综合建议：是否推荐报考，以及推荐理由

注意：所有关于分数线和位次的分析必须严格基于上面提供的真实数据，不要编造任何数据。
`
}

// 备用分析内容（未配置 LLM API Key 时使用）
function generateFallbackContent(
  university: University,
  scoreRecords: ScoreRecord[],
  score: number,
  rank: number | undefined
): string {
  const studentRank = rank || 5000
  const latestRecord = scoreRecords[0]
  const avgMinRank = scoreRecords.length > 0
    ? Math.round(scoreRecords.reduce((sum, r) => sum + (r.minRank || 0), 0) / scoreRecords.length)
    : 0

  let tierAnalysis = ''
  if (avgMinRank > 0) {
    const diff = studentRank - avgMinRank
    if (diff < 0) {
      tierAnalysis = `你的位次(${studentRank.toLocaleString()})高于该校近年平均最低位次(${avgMinRank.toLocaleString()})，差距约${Math.abs(diff).toLocaleString()}名，属于冲刺范围，录取有一定不确定性。`
    } else if (diff < avgMinRank * 0.3) {
      tierAnalysis = `你的位次(${studentRank.toLocaleString()})略高于该校近年平均最低位次(${avgMinRank.toLocaleString()})，超约${diff.toLocaleString()}名，录取把握较大。`
    } else {
      tierAnalysis = `你的位次(${studentRank.toLocaleString()})明显高于该校近年平均最低位次(${avgMinRank.toLocaleString()})，超约${diff.toLocaleString()}名，录取非常稳妥。`
    }
  }

  const content = `【${university.name}人工智能专业分析报告】

一、录取概率分析
${tierAnalysis}
${latestRecord ? `参考${latestRecord.year}年数据：最低分${latestRecord.minScore}，最低位次${(latestRecord.minRank || 0).toLocaleString()}。` : '暂无该省录取数据参考。'}

二、专业实力评估
- 学校层次：${university.level.join('、')}
- 学科评估：${university.subjectRating}（${university.subjectRating.startsWith('A') ? '全国前列' : university.subjectRating.startsWith('B') ? '全国中上水平' : '有发展潜力'}）
- 核心研究方向：${university.researchFocus.join('、')}
- 专业特色：${university.features.join('；')}

三、就业与深造
- 就业率：${university.employmentRate ? (university.employmentRate * 100).toFixed(0) + '%' : '暂无数据'}
- 深造率：${university.furtherStudyRate ? (university.furtherStudyRate * 100).toFixed(0) + '%' : '暂无数据'}
- 合作企业：${university.cooperation.join('、')}

四、综合建议
${university.subjectRating.startsWith('A') ? '该校AI专业实力强劲，' : '该校AI专业有一定实力，'}${university.employmentRate && university.employmentRate > 0.95 ? '就业表现优秀，' : ''}${university.furtherStudyRate && university.furtherStudyRate > 0.7 ? '深造率较高，' : ''}建议结合个人兴趣和职业规划综合考虑。

（注：此为基础分析报告。配置AI接口后可获取更详细的个性化分析。）`

  return content
}

// 额度扣减
async function deductCall(accessCode: string): Promise<{ success: boolean; error?: string }> {
  // 开发环境：不验证额度
  if (process.env.NODE_ENV === 'development') {
    return { success: true }
  }

  try {
    const { kv } = await import('@vercel/kv')
    const data = await kv.get<{ callsUsed: number; callsLimit: number; isActive: boolean }>(`code:${accessCode}`)
    if (!data || !data.isActive) {
      return { success: false, error: '访问码无效' }
    }
    if (data.callsUsed >= data.callsLimit) {
      return { success: false, error: 'AI分析额度已用完' }
    }
    await kv.set(`code:${accessCode}`, {
      ...data,
      callsUsed: data.callsUsed + 1,
    })
    return { success: true }
  } catch {
    return { success: true }
  }
}

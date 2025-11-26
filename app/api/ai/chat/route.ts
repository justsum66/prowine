import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Dynamic import for Groq to avoid build issues
let Groq: any
if (typeof window === 'undefined') {
  Groq = require('groq-sdk').default
}

const groq = process.env.GROQ_API_KEY
  ? new (require('groq-sdk').default)({
      apiKey: process.env.GROQ_API_KEY,
    })
  : null

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, history } = body

    const supabase = createAdminClient()

    // 獲取庫存資訊
    const { data: wines } = await supabase
      .from('wines')
      .select('id, name, price, wine_type, varietal, region, tasting_notes')
      .eq('is_available', true)
      .limit(20)

    const systemPrompt = `你是ProWine的專業AI侍酒師，名叫 Sommelier。
你的任務是根據客戶的需求、口味和預算，推薦最適合的葡萄酒。
請以親切、專業但不裝腔作勢的方式交流。

當前可供推薦的酒款：
${JSON.stringify(wines || [], null, 2)}

社交媒體：
LINE@: ${process.env.NEXT_PUBLIC_LINE_ID}
Facebook: ${process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ID}
Instagram: ${process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE}

請用繁體中文回答，語氣親切專業。`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ]

    if (!groq) {
      return NextResponse.json(
        { error: 'AI service not configured', message: 'AI服務未配置' },
        { status: 500 }
      )
    }

    const completion = await groq.chat.completions.create({
      messages: messages as any,
      model: 'mixtral-8x7b-32768',
      temperature: 0.7,
      max_tokens: 1000,
    })

    const aiMessage = completion.choices[0]?.message?.content || ''

    // 簡單提取推薦的酒款名稱（可以改進）
    const recommendations: any[] = []
    if (wines) {
      const wineNames = wines.map((w) => w.name.toLowerCase())
      const messageLower = aiMessage.toLowerCase()
      for (const wine of wines) {
        if (messageLower.includes(wine.name.toLowerCase())) {
          recommendations.push(wine)
          if (recommendations.length >= 3) break
        }
      }
    }

    return NextResponse.json({
      message: aiMessage,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    })
  } catch (error) {
    console.error('Error in AI chat:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: '抱歉，發生錯誤。請稍後再試。' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createAdminClient()

    // 保存詢價記錄
    const { data, error } = await supabase
      .from('inquiries')
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone,
        company: body.company,
        wine_ids: body.wine_ids || [],
        message: body.message,
        inquiry_type: body.inquiry_type || 'product',
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving inquiry:', error)
      return NextResponse.json(
        { error: 'Failed to save inquiry' },
        { status: 500 }
      )
    }

    // TODO: 發送Email通知（需要配置Resend）
    // try {
    //   await resend.emails.send({...})
    // } catch (emailError) {
    //   console.error('Error sending email:', emailError)
    // }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error processing inquiry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


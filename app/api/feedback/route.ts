'use server'

import { NextResponse } from 'next/server'

interface FeedbackBody {
  message: string
  route?: string
  timestamp?: string
  email?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FeedbackBody
    const { message, route, timestamp, email } = body || {}

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid feedback message' }, { status: 400 })
    }

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
    const FEEDBACK_TO_EMAIL = process.env.FEEDBACK_TO_EMAIL || process.env.NEXT_PUBLIC_FEEDBACK_TO_EMAIL
    const FEEDBACK_FROM_EMAIL = process.env.FEEDBACK_FROM_EMAIL || 'no-reply@planetary-agents.local'

    const payload = {
      subject: 'Planetary Agents - New User Feedback',
      text: `Feedback: ${message}\nFrom: ${email || 'anonymous'}\nRoute: ${route || 'unknown'}\nAt: ${timestamp || new Date().toISOString()}`,
      html: `<p><strong>Feedback:</strong> ${escapeHtml(message)}</p>
             <p><strong>From:</strong> ${escapeHtml(email || 'anonymous')}</p>
             <p><strong>Route:</strong> ${escapeHtml(route || 'unknown')}</p>
             <p><strong>At:</strong> ${escapeHtml(timestamp || new Date().toISOString())}</p>`,
    }

    if (SENDGRID_API_KEY && FEEDBACK_TO_EMAIL) {
      const sgPayload = {
        personalizations: [{ to: [{ email: FEEDBACK_TO_EMAIL }] }],
        from: { email: FEEDBACK_FROM_EMAIL },
        subject: payload.subject,
        content: [
          { type: 'text/plain', value: payload.text },
          { type: 'text/html', value: payload.html },
        ],
      }

      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sgPayload),
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        console.error('SendGrid error:', res.status, errText)
        // Fall-through to log-only success for non-blocking UX
      }
    } else {
      console.warn('Feedback email not configured, logging only:', payload)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feedback error:', error)
    return NextResponse.json({ error: 'Failed to send feedback' }, { status: 500 })
  }
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}



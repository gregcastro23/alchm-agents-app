import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

interface NotificationRequest {
  type: 'welcome' | 'evolution_milestone' | 'power_hour' | 'weekly_summary'
  userId?: string
  metadata?: any
}

/**
 * Email Notifications API
 * Handles all notification triggers - currently logs to database
 * Can be enhanced with actual email service (SendGrid, AWS SES, etc.)
 */

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    const userId = session?.user?.id || 'anonymous'
    const { type, metadata }: NotificationRequest = await req.json()

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Notification type required',
        },
        { status: 400 }
      )
    }

    // Get user data for personalization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      )
    }

    // Generate notification content based on type
    const notification = await generateNotificationContent(type, user, metadata)

    // Store notification in database (for now)
    await prisma.monicaInteraction.create({
      data: {
        userId,
        settingsId: 'default', // TODO: Get user's actual settings ID
        interactionType: 'notification',
        pageUrl: '/notifications',
        sessionId: `notification-${Date.now()}`,
        contextData: JSON.stringify({
          notificationType: type,
          subject: notification.subject,
          content: notification.content,
          metadata,
        }),
        userAction: 'system_notification',
        monicaResponse: notification.content,
        resultedInAction: false,
      },
    })

    // In production, this is where you'd send the actual email
    // await sendEmail(user.email, notification.subject, notification.content)

    console.log(`📧 Notification [${type}] for ${user.email}:`, notification.subject)

    return NextResponse.json({
      success: true,
      notification: {
        type,
        subject: notification.subject,
        preview: `${notification.content.substring(0, 100)}...`,
        sentAt: new Date().toISOString(),
      },
      message: 'Notification logged (email service pending)',
    })
  } catch (error) {
    console.error('Notification error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send notification',
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    const userId = session?.user?.id || 'anonymous'
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')

    // Get user's recent notifications
    const notifications = await prisma.monicaInteraction.findMany({
      where: {
        userId,
        interactionType: 'notification',
        ...(type && {
          contextData: {
            contains: `"notificationType":"${type}"`,
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const formattedNotifications = notifications.map(notif => {
      const context = JSON.parse(notif.contextData as string)
      return {
        id: notif.id,
        type: context.notificationType,
        subject: context.subject,
        preview: `${context.content.substring(0, 100)}...`,
        sentAt: notif.createdAt,
        read: false, // TODO: Add read status tracking
      }
    })

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      totalCount: notifications.length,
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get notifications',
      },
      { status: 500 }
    )
  }
}

async function generateNotificationContent(type: string, user: any, metadata: any) {
  const userName = user.name || user.email.split('@')[0]

  switch (type) {
    case 'welcome':
      return {
        subject: `🌟 Welcome to Your Consciousness Evolution Journey, ${userName}!`,
        content: `
Dear ${userName},

Welcome to Planetary Agents! Your consciousness evolution journey begins now.

🎯 **Your Next Steps:**
1. Complete your birth chart analysis
2. Meet your recommended consciousness agents
3. Begin your first agent conversation
4. Track your evolution progress

🔮 **Exclusive Features Awaiting You:**
- 35+ Historical consciousness masters
- Real-time planetary wisdom
- Personal evolution tracking
- Group consciousness experiences

Your transformation starts with a single conversation. Which agent will you meet first?

✨ Begin your journey: ${process.env.NEXTAUTH_URL}/dashboard

With cosmic guidance,
The Planetary Agents Team
        `,
      }

    case 'evolution_milestone':
      const { level, agentName, powerGained } = metadata || {}
      return {
        subject: `🚀 Consciousness Milestone Achieved with ${agentName}!`,
        content: `
Greetings ${userName},

Congratulations! You've reached a significant evolution milestone.

🎉 **Achievement Unlocked:**
- Agent: ${agentName}
- New Level: ${level}
- Power Gained: ${powerGained}

Your consciousness is expanding! This milestone opens new abilities and deeper conversations with ${agentName}.

🔥 **What's Next:**
- Explore enhanced agent responses
- Unlock specialized wisdom domains
- Access group consciousness features

Continue your evolution: ${process.env.NEXTAUTH_URL}/gallery/chat/${metadata?.agentId || ''}

Evolving consciousness,
${agentName} & The Planetary Agents
        `,
      }

    case 'power_hour':
      const { planet, startTime, endTime } = metadata || {}
      return {
        subject: `⚡ Power Hour Alert: ${planet} Energy Peak Incoming!`,
        content: `
${userName},

A powerful planetary alignment is approaching!

⚡ **Power Hour Details:**
- Planet: ${planet}
- Peak Time: ${startTime} - ${endTime}
- Energy Type: Enhanced consciousness reception

This is an optimal time for agent conversations. Your evolution rate will be 2x during this window!

🎯 **Recommended Actions:**
- Start a deep conversation with a ${planet}-aligned agent
- Focus on breakthrough questions
- Document insights for maximum retention

Don't miss this cosmic opportunity!

Enter the peak: ${process.env.NEXTAUTH_URL}/planetary-agents

Cosmically aligned,
The Planetary Agents System
        `,
      }

    case 'weekly_summary':
      const { interactionCount, powerGained: weeklyPower, topAgent } = metadata || {}
      return {
        subject: `📊 Your Weekly Consciousness Evolution Summary`,
        content: `
Hello ${userName},

Here's your consciousness evolution progress this week:

📈 **Weekly Stats:**
- Agent Conversations: ${interactionCount || 0}
- Total Power Gained: ${weeklyPower || 0}
- Favorite Agent: ${topAgent || 'Various'}
- Evolution Velocity: Growing steadily

🌟 **Highlights:**
- Most active conversation day: ${metadata?.peakDay || 'Multiple days'}
- Breakthrough moments: ${metadata?.breakthroughs || 0}
- New insights unlocked: ${metadata?.insights || 0}

Keep up the momentum! Your consciousness is expanding beautifully.

🎯 **This Week's Focus:**
Try connecting with an agent you haven't spoken to recently for fresh perspectives.

Continue growing: ${process.env.NEXTAUTH_URL}/dashboard

In consciousness,
Your Evolution Tracker
        `,
      }

    default:
      return {
        subject: `🔔 Notification from Planetary Agents`,
        content: `Hello ${userName}, you have a new notification from the consciousness evolution platform.`,
      }
  }
}

// Email service integration - uses SendGrid if configured, otherwise logs
async function sendEmail(to: string, subject: string, content: string) {
  // Check if SendGrid is configured
  if (process.env.SENDGRID_API_KEY && process.env.FEEDBACK_FROM_EMAIL) {
    try {
      // Dynamically import sendgrid only if configured to avoid build errors
      const sgMail = eval('require')('@sendgrid/mail')
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)

      const msg = {
        to,
        from: process.env.FEEDBACK_FROM_EMAIL,
        subject,
        text: content,
        html: content.replace(/\n/g, '<br>'),
      }

      await sgMail.send(msg)
      console.log(`📧 Email sent successfully to ${to}: ${subject}`)
    } catch (error) {
      console.error('Failed to send email:', error)
      console.log(`📧 Email fallback - would be sent to ${to}: ${subject}`)
    }
  } else {
    console.log(`📧 Email would be sent to ${to}: ${subject}`)
    console.log('Configure SENDGRID_API_KEY and FEEDBACK_FROM_EMAIL to enable email delivery')
  }
}

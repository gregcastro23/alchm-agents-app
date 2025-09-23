/**
 * Feedback API Endpoint
 * Collects user feedback for beta testing and improvement
 */

import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/error-handling'
import { logger } from '@/lib/structured-logger'

interface FeedbackData {
  rating: number
  category: string
  message: string
  userId?: string
  userAgent?: string
  url?: string
  timestamp?: string
}

export async function POST(request: NextRequest) {
  return withErrorHandling(
    async () => {
      const feedback: FeedbackData = await request.json()

      // Validate required fields
      if (!feedback.category || !feedback.message?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required fields: category and message are required'
          },
          { status: 400 }
        )
      }

      // Validate category
      const validCategories = ['bug', 'feature', 'ui', 'performance', 'general']
      if (!validCategories.includes(feedback.category)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid category. Must be one of: ' + validCategories.join(', ')
          },
          { status: 400 }
        )
      }

      // Validate rating (optional)
      if (feedback.rating !== undefined && (feedback.rating < 1 || feedback.rating > 5)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Rating must be between 1 and 5'
          },
          { status: 400 }
        )
      }

      // Add timestamp and additional metadata
      const feedbackEntry = {
        ...feedback,
        timestamp: feedback.timestamp || new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown',
        userAgent: feedback.userAgent || request.headers.get('user-agent') || 'unknown',
      }

      // In a real implementation, you would save to database
      // For now, we'll just log it and return success

      logger.info('User feedback received', {
        system: 'feedback',
        operation: 'collect',
        metadata: {
          category: feedback.category,
          rating: feedback.rating,
          messageLength: feedback.message.length,
          hasUserId: !!feedback.userId,
          url: feedback.url
        }
      })

      // TODO: Save to database
      console.log('Feedback received:', feedbackEntry)

      return NextResponse.json({
        success: true,
        message: 'Thank you for your feedback!',
        feedbackId: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })
    },
    {
      system: 'api',
      operation: 'feedback_submit',
      severity: 'low',
    }
  ).then(result => {
    if (result.success === false) {
      return NextResponse.json(
        {
          success: false,
          error: result.userMessage,
          context: result.context
        },
        { status: 500 }
      );
    }
    return result;
  });
}

// Optional: GET endpoint to retrieve feedback statistics (admin only)
export async function GET(request: NextRequest) {
  return withErrorHandling(
    async () => {
      // In a real implementation, check for admin authentication
      // For now, return mock statistics

      const mockStats = {
        totalFeedback: 42,
        averageRating: 4.2,
        categories: {
          bug: 8,
          feature: 15,
          ui: 12,
          performance: 5,
          general: 2
        },
        recentFeedback: [
          {
            id: 'feedback_001',
            category: 'feature',
            rating: 5,
            message: 'Love the new planetary positions feature!',
            timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
          },
          {
            id: 'feedback_002',
            category: 'bug',
            rating: 2,
            message: 'Having trouble with the chart loading on mobile',
            timestamp: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
          }
        ]
      }

      logger.info('Feedback statistics requested', {
        system: 'feedback',
        operation: 'stats',
        metadata: { totalFeedback: mockStats.totalFeedback }
      })

      return NextResponse.json({
        success: true,
        data: mockStats
      })
    },
    {
      system: 'api',
      operation: 'feedback_stats',
      severity: 'low',
    }
  ).then(result => {
    if (result.success === false) {
      return NextResponse.json(
        {
          success: false,
          error: result.userMessage,
          context: result.context
        },
        { status: 500 }
      );
    }
    return result;
  });
}
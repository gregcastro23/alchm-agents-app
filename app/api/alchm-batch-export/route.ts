import { NextRequest, NextResponse } from 'next/server'
import { sampleDateRange } from '@/lib/alchemical-kinetics-sampler'
import { agentOptimizer } from '@/lib/agent-performance-optimizer'

/**
 * Advanced Batch Export API for Alchemical Kinetics
 * Enterprise-grade data export with queue management and progress tracking
 */

interface BatchExportRequest {
  type: 'kinetics_range' | 'agent_performance' | 'consciousness_metrics' | 'custom'
  parameters: {
    startDate?: string
    endDate?: string
    agentIds?: string[]
    location?: { lat: number; lon: number }
    format?: 'csv' | 'json' | 'xlsx'
    includeMetadata?: boolean
    samplingInterval?: 'hourly' | 'daily' | 'weekly'
    customFields?: string[]
  }
  exportOptions?: {
    includeHeaders?: boolean
    timezone?: string
    compression?: 'none' | 'gzip' | 'zip'
    chunkSize?: number
  }
}

interface BatchJob {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  startTime: Date
  estimatedCompletion?: Date
  resultUrl?: string
  error?: string
  metadata: {
    totalRecords: number
    processedRecords: number
    exportSize: number
  }
}

// In-memory job tracking (in production, use Redis or database)
const jobQueue = new Map<string, BatchJob>()
const activeJobs = new Map<string, AbortController>()

export async function POST(request: NextRequest) {
  try {
    const exportRequest: BatchExportRequest = await request.json()

    // Validate request
    const validation = validateExportRequest(exportRequest)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      )
    }

    // Create job ID and initialize job
    const jobId = generateJobId()
    const job: BatchJob = {
      id: jobId,
      status: 'queued',
      progress: 0,
      startTime: new Date(),
      metadata: {
        totalRecords: 0,
        processedRecords: 0,
        exportSize: 0,
      },
    }

    jobQueue.set(jobId, job)

    // Start processing job asynchronously
    processExportJob(jobId, exportRequest)

    return NextResponse.json({
      success: true,
      jobId,
      status: 'queued',
      message: 'Export job created successfully',
      estimatedDuration: estimateJobDuration(exportRequest),
    })
  } catch (error) {
    console.error('Error creating batch export job:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create export job',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const action = searchParams.get('action')

    if (action === 'list') {
      // List all jobs
      const jobs = Array.from(jobQueue.values()).map(job => ({
        id: job.id,
        status: job.status,
        progress: job.progress,
        startTime: job.startTime,
        estimatedCompletion: job.estimatedCompletion,
        metadata: job.metadata,
      }))

      return NextResponse.json({
        success: true,
        jobs,
        activeJobsCount: activeJobs.size,
        totalJobsCount: jobQueue.size,
      })
    }

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job ID is required',
        },
        { status: 400 }
      )
    }

    const job = jobQueue.get(jobId)
    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job not found',
        },
        { status: 404 }
      )
    }

    if (action === 'download' && job.status === 'completed' && job.resultUrl) {
      // In production, this would serve the actual file
      return NextResponse.json({
        success: true,
        downloadUrl: job.resultUrl,
        metadata: job.metadata,
      })
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        startTime: job.startTime,
        estimatedCompletion: job.estimatedCompletion,
        metadata: job.metadata,
        error: job.error,
      },
    })
  } catch (error) {
    console.error('Error retrieving job status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve job status',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job ID is required',
        },
        { status: 400 }
      )
    }

    const job = jobQueue.get(jobId)
    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job not found',
        },
        { status: 404 }
      )
    }

    // Cancel active job if running
    const controller = activeJobs.get(jobId)
    if (controller) {
      controller.abort()
      activeJobs.delete(jobId)
    }

    // Remove job from queue
    jobQueue.delete(jobId)

    return NextResponse.json({
      success: true,
      message: 'Job cancelled and removed successfully',
    })
  } catch (error) {
    console.error('Error cancelling job:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel job',
      },
      { status: 500 }
    )
  }
}

/**
 * Core Processing Logic
 */

async function processExportJob(jobId: string, exportRequest: BatchExportRequest) {
  const job = jobQueue.get(jobId)
  if (!job) return

  const controller = new AbortController()
  activeJobs.set(jobId, controller)

  try {
    job.status = 'processing'
    job.progress = 0

    let data: any[] = []

    switch (exportRequest.type) {
      case 'kinetics_range':
        data = await processKineticsRange(exportRequest, job, controller.signal)
        break

      case 'agent_performance':
        data = await processAgentPerformance(exportRequest, job, controller.signal)
        break

      case 'consciousness_metrics':
        data = await processConsciousnessMetrics(exportRequest, job, controller.signal)
        break

      case 'custom':
        data = await processCustomExport(exportRequest, job, controller.signal)
        break
    }

    // Format and save data
    const formatted = await formatExportData(data, exportRequest)
    const resultUrl = await saveExportResult(jobId, formatted, exportRequest)

    // Update job completion
    job.status = 'completed'
    job.progress = 100
    job.resultUrl = resultUrl
    job.metadata.exportSize = JSON.stringify(formatted).length
  } catch (error) {
    if (controller.signal.aborted) {
      job.status = 'failed'
      job.error = 'Job was cancelled'
    } else {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : 'Unknown error'
    }
  } finally {
    activeJobs.delete(jobId)
  }
}

async function processKineticsRange(
  request: BatchExportRequest,
  job: BatchJob,
  signal: AbortSignal
): Promise<any[]> {
  const { startDate, endDate, location, samplingInterval } = request.parameters

  if (!startDate || !endDate || !location) {
    throw new Error('startDate, endDate, and location are required for kinetics range export')
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  job.metadata.totalRecords = days * (samplingInterval === 'hourly' ? 24 : 1)

  const results: any[] = []
  let processedDays = 0

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    if (signal.aborted) throw new Error('Job cancelled')

    const dayData = await sampleDateRange(
      { latitude: location.lat, longitude: location.lon },
      date,
      date,
      {}
    )

    if (samplingInterval === 'hourly') {
      results.push(...dayData.samples)
    } else {
      if (dayData.samples.length > 0) {
        results.push(dayData.samples[0])
      }
    }

    processedDays++
    job.progress = Math.round((processedDays / days) * 100)
    job.metadata.processedRecords = results.length
  }

  return results
}

async function processAgentPerformance(
  request: BatchExportRequest,
  job: BatchJob,
  signal: AbortSignal
): Promise<any[]> {
  const { agentIds } = request.parameters
  const metrics = await agentOptimizer.getPerformanceMetrics()

  const results = []
  const agents = agentIds || Object.keys((metrics as any).agentMetrics || {})

  job.metadata.totalRecords = agents.length

  for (let i = 0; i < agents.length; i++) {
    if (signal.aborted) throw new Error('Job cancelled')

    const agentId = agents[i]
    const agentMetrics = (metrics as any).agentMetrics?.[agentId] || {}

    results.push({
      agentId,
      timestamp: new Date().toISOString(),
      ...agentMetrics,
      kalchmConstant: (agentOptimizer as any).getKalchmValue
        ? await (agentOptimizer as any).getKalchmValue(agentId)
        : null,
    })

    job.progress = Math.round(((i + 1) / agents.length) * 100)
    job.metadata.processedRecords = i + 1
  }

  return results
}

async function processConsciousnessMetrics(
  request: BatchExportRequest,
  job: BatchJob,
  signal: AbortSignal
): Promise<any[]> {
  // Mock consciousness data - in production, integrate with actual consciousness system
  const agents = [
    'leonardo-da-vinci',
    'william-shakespeare',
    'albert-einstein',
    'nikola-tesla',
    'carl-jung',
    'marie-curie',
  ]

  job.metadata.totalRecords = agents.length
  const results = []

  for (let i = 0; i < agents.length; i++) {
    if (signal.aborted) throw new Error('Job cancelled')

    results.push({
      agentId: agents[i],
      timestamp: new Date().toISOString(),
      consciousnessLevel: 3 + Math.random() * 3,
      evolutionVelocity: Math.random() * 0.5,
      kalchmConstant: 4 + Math.random() * 2,
      interactionCount: Math.floor(Math.random() * 1000),
      lastActiveDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    })

    job.progress = Math.round(((i + 1) / agents.length) * 100)
    job.metadata.processedRecords = i + 1
  }

  return results
}

async function processCustomExport(
  request: BatchExportRequest,
  job: BatchJob,
  signal: AbortSignal
): Promise<any[]> {
  // Custom export logic based on customFields
  const { customFields } = request.parameters

  if (!customFields || customFields.length === 0) {
    throw new Error('Custom fields are required for custom export')
  }

  // Mock custom data processing
  const results = []
  const recordCount = 100 // Mock count

  job.metadata.totalRecords = recordCount

  for (let i = 0; i < recordCount; i++) {
    if (signal.aborted) throw new Error('Job cancelled')

    const record: any = { id: i, timestamp: new Date().toISOString() }

    customFields.forEach(field => {
      record[field] = `custom_${field}_${i}`
    })

    results.push(record)

    job.progress = Math.round(((i + 1) / recordCount) * 100)
    job.metadata.processedRecords = i + 1
  }

  return results
}

/**
 * Helper Functions
 */

function validateExportRequest(request: BatchExportRequest): { valid: boolean; error?: string } {
  if (!request.type) {
    return { valid: false, error: 'Export type is required' }
  }

  if (
    !['kinetics_range', 'agent_performance', 'consciousness_metrics', 'custom'].includes(
      request.type
    )
  ) {
    return { valid: false, error: 'Invalid export type' }
  }

  if (request.type === 'kinetics_range') {
    const { startDate, endDate, location } = request.parameters
    if (!startDate || !endDate || !location) {
      return {
        valid: false,
        error: 'startDate, endDate, and location are required for kinetics range export',
      }
    }
  }

  if (request.type === 'custom') {
    const { customFields } = request.parameters
    if (!customFields || customFields.length === 0) {
      return { valid: false, error: 'customFields are required for custom export' }
    }
  }

  return { valid: true }
}

function generateJobId(): string {
  return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function estimateJobDuration(request: BatchExportRequest): string {
  switch (request.type) {
    case 'kinetics_range':
      const { startDate, endDate } = request.parameters
      if (startDate && endDate) {
        const days = Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
        )
        return `${Math.max(1, Math.ceil(days / 10))} minutes`
      }
      return '2-5 minutes'

    case 'agent_performance':
      const agentCount = request.parameters.agentIds?.length || 35
      return `${Math.max(1, Math.ceil(agentCount / 20))} minutes`

    case 'consciousness_metrics':
      return '1-2 minutes'

    case 'custom':
      const fieldCount = request.parameters.customFields?.length || 1
      return `${Math.max(1, Math.ceil(fieldCount / 5))} minutes`

    default:
      return '2-5 minutes'
  }
}

async function formatExportData(data: any[], request: BatchExportRequest): Promise<string | any> {
  const format = request.parameters.format || 'json'
  const includeHeaders = request.exportOptions?.includeHeaders ?? true

  switch (format) {
    case 'csv':
      return formatAsCSV(data, includeHeaders)

    case 'json':
      return {
        metadata: {
          exportType: request.type,
          exportDate: new Date().toISOString(),
          recordCount: data.length,
          parameters: request.parameters,
        },
        data,
      }

    case 'xlsx':
      // In production, use a library like xlsx to generate Excel files
      return {
        type: 'xlsx',
        metadata: { recordCount: data.length },
        data,
      }

    default:
      return data
  }
}

function formatAsCSV(data: any[], includeHeaders: boolean): string {
  if (!data.length) return ''

  const headers = Object.keys(data[0])
  const lines = []

  if (includeHeaders) {
    lines.push(headers.join(','))
  }

  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header]
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })
    lines.push(values.join(','))
  })

  return lines.join('\n')
}

async function saveExportResult(
  jobId: string,
  data: any,
  request: BatchExportRequest
): Promise<string> {
  // Store the export data in memory cache for download
  const format = request.parameters.format || 'json'
  const downloadId = jobId.replace(/-/g, '')

  // Initialize cache if needed
  if (!global.alchemicalBatchCache) {
    global.alchemicalBatchCache = new Map()
  }

  // Store the results for download
  global.alchemicalBatchCache.set(downloadId, {
    data,
    format,
    timestamp: Date.now(),
    filename: `alchemical-export-${jobId}.${format}`,
  })

  // Clean up old entries (older than 10 minutes)
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000
  for (const [key, value] of global.alchemicalBatchCache.entries()) {
    if (value.timestamp < tenMinutesAgo) {
      global.alchemicalBatchCache.delete(key)
    }
  }

  return `/api/alchm-batch-export/download?id=${downloadId}&format=${format}`
}

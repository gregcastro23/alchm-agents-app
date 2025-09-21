import { NextRequest, NextResponse } from 'next/server'

declare global {
  var alchemicalBatchCache: Map<string, {
    data: any
    format: string
    filename: string
    timestamp: number
  }> | undefined
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const format = searchParams.get('format') || 'json'

    if (!id) {
      return NextResponse.json(
        { error: 'Download ID is required' },
        { status: 400 }
      )
    }

    // Check if cache exists and has the data
    if (!global.alchemicalBatchCache || !global.alchemicalBatchCache.has(id)) {
      return NextResponse.json(
        { error: 'Export not found or expired. Please generate a new export.' },
        { status: 404 }
      )
    }

    const cacheEntry = global.alchemicalBatchCache.get(id)!

    // Check if the entry has expired (older than 10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000
    if (cacheEntry.timestamp < tenMinutesAgo) {
      global.alchemicalBatchCache.delete(id)
      return NextResponse.json(
        { error: 'Export expired. Please generate a new export.' },
        { status: 404 }
      )
    }

    // Convert data to appropriate format
    let responseData: string | Buffer
    let contentType = 'application/octet-stream'

    switch (format.toLowerCase()) {
      case 'csv':
        contentType = 'text/csv'
        responseData = convertToCSV(cacheEntry.data)
        break
      case 'json':
        contentType = 'application/json'
        responseData = JSON.stringify(cacheEntry.data, null, 2)
        break
      default:
        responseData = JSON.stringify(cacheEntry.data)
    }

    // Return the file
    return new NextResponse(responseData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${cacheEntry.filename}"`,
        'Content-Length': Buffer.byteLength(responseData).toString(),
      },
    })

  } catch (error) {
    console.error('Error serving alchemical export download:', error)
    return NextResponse.json(
      { error: 'Failed to serve download' },
      { status: 500 }
    )
  }
}

function convertToCSV(data: any): string {
  if (Array.isArray(data) && data.length > 0) {
    const headers = Object.keys(data[0])
    const csvRows = [headers.join(',')]

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header]
        return typeof value === 'object' ? JSON.stringify(value) : String(value || '')
      })
      csvRows.push(values.join(','))
    }

    return csvRows.join('\n')
  }

  // If not an array, convert to key-value CSV
  const entries = Object.entries(data)
  const csv = ['Key,Value', ...entries.map(([k, v]) => `${k},${JSON.stringify(v)}`)].join('\n')
  return csv
}
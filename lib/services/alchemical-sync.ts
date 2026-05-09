import { getAlchemicalQuantitiesLegacy } from '@/lib/backend'
import { planetaryPositionSyncService } from './planetary-position-sync'

interface SyncBirthInfo {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  latitude?: number
  longitude?: number
}

export interface SynchronizedAlchemicalResult {
  spirit: number
  essence: number
  matter: number
  substance: number
  kinetic_val: number
  thermo_val: number
  sync_metadata: {
    synchronized: boolean
    sync_date: string
    authoritative_source: string
    discrepancies_found: number
    corrections_applied: number
    whattoeatnext_available: boolean
  }
}

function toDate(birthInfo: SyncBirthInfo): Date {
  return new Date(
    Date.UTC(
      birthInfo.year,
      birthInfo.month - 1,
      birthInfo.day,
      birthInfo.hour,
      birthInfo.minute,
      0
    )
  )
}

export async function generateSynchronizedAlchmForBirthInfo(
  birthInfo: SyncBirthInfo
): Promise<SynchronizedAlchemicalResult> {
  const date = toDate(birthInfo)
  const [syncResult, legacy] = await Promise.all([
    planetaryPositionSyncService.synchronizePositions(date),
    getAlchemicalQuantitiesLegacy(date, birthInfo.latitude, birthInfo.longitude),
  ])

  return {
    spirit: Number(legacy?.['Alchemy Effects']?.['Total Spirit'] ?? legacy?.spirit_score ?? 0),
    essence: Number(legacy?.['Alchemy Effects']?.['Total Essence'] ?? legacy?.essence_score ?? 0),
    matter: Number(legacy?.['Alchemy Effects']?.['Total Matter'] ?? legacy?.matter_score ?? 0),
    substance: Number(
      legacy?.['Alchemy Effects']?.['Total Substance'] ?? legacy?.substance_score ?? 0
    ),
    kinetic_val: Number(legacy?.kinetic_val ?? 0),
    thermo_val: Number(legacy?.thermo_val ?? 0),
    sync_metadata: {
      synchronized: syncResult.success,
      sync_date: date.toISOString(),
      authoritative_source: syncResult.sync_report.authoritative_source,
      discrepancies_found: syncResult.sync_report.discrepancies_found,
      corrections_applied: syncResult.sync_report.corrections_applied,
      whattoeatnext_available: Object.keys(syncResult.synchronized_positions).length > 0,
    },
  }
}

export async function generateBatchSynchronizedAlchm(
  birthInfos: SyncBirthInfo[]
): Promise<SynchronizedAlchemicalResult[]> {
  return Promise.all(birthInfos.map(generateSynchronizedAlchmForBirthInfo))
}

export async function getAlchemicalSyncHealth(): Promise<{
  sync_available: boolean
  accuracy_level: 'high' | 'medium' | 'low'
  recommendations: string[]
}> {
  const health = await planetaryPositionSyncService.getHealthStatus()
  const syncStatus = await planetaryPositionSyncService.getSyncStatus()

  const accuracy_level =
    health.overall_health === 'healthy'
      ? 'high'
      : health.whattoeatnext_available || health.vsop87_available
        ? 'medium'
        : 'low'

  const recommendations: string[] = []
  if (!health.vsop87_available) recommendations.push('Restore local planetary calculation service')
  if (!health.whattoeatnext_available)
    recommendations.push('Reconnect WhatToEatNext rectification backend')
  if (syncStatus.metrics.average_sync_time_ms > 2000)
    recommendations.push('Investigate cross-backend latency')
  if (recommendations.length === 0)
    recommendations.push('Cross-backend synchronization is operating normally')

  return {
    sync_available: health.sync_service_active,
    accuracy_level,
    recommendations,
  }
}

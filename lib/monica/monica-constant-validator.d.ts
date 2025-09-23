export interface MonicaConstantClassification {
  level: number
  name: string
  description: string
  threshold: number
}
export interface MonicaConstantInput {
  spirit: number
  essence: number
  matter: number
  substance: number
  fire?: number
  water?: number
  air?: number
  earth?: number
}
/**
 * Calculate Monica Constant using the sacred formula
 * MC = (Spirit × φ + Essence) / (Matter + Substance + 1)
 */
export declare function calculateMC(
  spirit: number,
  essence: number,
  matter: number,
  substance: number,
  fire?: number,
  water?: number,
  air?: number,
  earth?: number
): number
/**
 * Classify Monica Constant value into consciousness level
 */
export declare function classifyMC(mc: number): MonicaConstantClassification
/**
 * Batch calculate Monica Constants for multiple inputs
 */
export declare function batchCalculateMC(inputs: MonicaConstantInput[]): Array<{
  input: MonicaConstantInput
  mc: number
  classification: MonicaConstantClassification
}>
/**
 * Calculate statistical summary of Monica Constants
 */
export declare function calculateMCStatistics(values: number[]): {
  average: number
  min: number
  max: number
  stdDev: number
  median: number
  count: number
}
/**
 * Get consciousness progression recommendations based on MC level
 */
export declare function getProgressionRecommendations(mc: number): string[]

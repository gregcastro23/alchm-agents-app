export declare const signs: Record<number, string>
export declare const signIndices: Record<string, number>
export declare const planetInfo: Record<string, any>
export declare const signInfo: Record<string, any>
export declare function capitalize(string: string): string
export declare function createElementObject(): Record<string, number>
export declare function combineElementObjects(
  element_object_1: Record<string, number>,
  element_object_2: Record<string, number>
): Record<string, number>
export declare function getElementRanking(
  element_object: Record<string, number>,
  rank?: number
): Record<number, string>
export declare function getAbsoluteElementValue(element_object: Record<string, number>): number
export declare function getElementalCompatibility(element1: string, element2: string): number
export declare function getComplementaryElement(element: string): string
export declare function alchemize(
  birth_info: Record<string, any>,
  horoscope_dict: Record<string, any>
): Record<string, any>
export declare function generateAlchmForCurrentMoment(): Promise<Record<string, any>>
declare const alchemizerExport: {
  alchemize: typeof alchemize
  generateAlchmForCurrentMoment: typeof generateAlchmForCurrentMoment
}
export default alchemizerExport
export declare function generateAlchmForBirthInfo(input: {
  birthDate: string
  birthTime?: string
  birthLocation?: string
}): Promise<Record<string, any>>

import SunCalc from 'suncalc'

export type Planet = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn'

const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] as const

const planetaryHours: Record<(typeof dayNames)[number], Planet[]> = {
  Sunday: ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'],
  Monday: ['Moon', 'Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury'],
  Tuesday: ['Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter'],
  Wednesday: ['Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus'],
  Thursday: ['Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Saturn'],
  Friday: ['Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars', 'Sun'],
  Saturday: ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'],
}

const dayRulers: Planet[] = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn']

export class PlanetaryHourCalculator {
  private latitude: number
  private longitude: number

  constructor(latitude = 40.7128, longitude = -74.006) {
    this.latitude = latitude
    this.longitude = longitude
  }

  setCoordinates(latitude: number, longitude: number) {
    this.latitude = latitude
    this.longitude = longitude
  }

  getPlanetaryDay(date = new Date()): Planet {
    const dayOfWeek = date.getDay()
    return dayRulers[dayOfWeek]
  }

  getPlanetaryHour(date = new Date()): { planet: Planet; hourNumber: number; isDaytime: boolean } {
    const times = SunCalc.getTimes(new Date(date.getFullYear(), date.getMonth(), date.getDate()), this.latitude, this.longitude)
    const sunrise = times.sunrise
    const sunset = times.sunset

    if (!sunrise || !sunset) return this.getFallbackPlanetaryHour(date)

    const isDaytime = date >= sunrise && date <= sunset
    const dayLength = sunset.getTime() - sunrise.getTime()
    const nightLength = sunrise.getTime() + 24 * 60 * 60 * 1000 - sunset.getTime()
    const hourLength = (isDaytime ? dayLength : nightLength) / 12
    const startTime = isDaytime ? sunrise.getTime() : sunset.getTime()
    const timeSinceStart = date.getTime() - startTime
    let hourIndex = Math.floor(timeSinceStart / hourLength)
    if (hourIndex < 0) hourIndex = 0
    if (hourIndex > 11) hourIndex = 11

    const dayOfWeek = date.getDay()
    const dayName = dayNames[dayOfWeek]
    const sequence = planetaryHours[dayName]

    // First hour of daytime is day ruler; nighttime continues sequence
    const baseIndex = 0 // sequence already starts at day ruler
    const hourRulerIndex = (baseIndex + hourIndex) % 7

    return { planet: sequence[hourRulerIndex], hourNumber: hourIndex, isDaytime }
  }

  private getFallbackPlanetaryHour(date: Date): { planet: Planet; hourNumber: number; isDaytime: boolean } {
    const dayOfWeek = date.getDay()
    const dayName = dayNames[dayOfWeek]
    const sequence = planetaryHours[dayName]
    const hour = date.getHours()
    const isDaytime = hour >= 6 && hour < 18
    const hourIndex = isDaytime ? Math.floor(((hour - 6) / 12) * 12) : Math.floor((((hour < 6 ? hour + 24 : hour) - 18) / 12) * 12)
    const hourRulerIndex = ((hourIndex % 12) % 7 + 7) % 7
    return { planet: sequence[hourRulerIndex], hourNumber: hourIndex, isDaytime }
  }
}

// Sephirotic priority ordering (descending) for response precedence inspiration
// Kether → Chokmah → Binah → Chesed → Gevurah → Tiphereth → Netzach → Hod → Yesod → Malkuth
// Mapped to classical planets: Saturn, Zodiac/Fixed Stars (not used), Saturn (understanding), Jupiter, Mars, Sun, Venus, Mercury, Moon, Earth (Ascendant)
// Practical response order emphasizing traditional spheres: Sun, Saturn, Jupiter, Mars, Venus, Mercury, Moon
export const SEPHIROTIC_PRIORITY: Planet[] = ['Sun','Saturn','Jupiter','Mars','Venus','Mercury','Moon']



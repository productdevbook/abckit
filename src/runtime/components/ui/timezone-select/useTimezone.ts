interface TimezoneOption {
  value: string // 'Europe/Istanbul'
  label: string // 'Istanbul'
  offset: string // 'UTC+03:00'
  region: string // 'Europe'
  country: string | undefined // 'Turkey'
  popular: boolean
  searchText: string // For filtering
}

interface TimezoneGroup {
  region: string
  label: string
  timezones: TimezoneOption[]
}

interface TimezoneLabels {
  popularTimezones?: string
}

export function useTimezone(labels: TimezoneLabels = {}) {
  // Popular timezones that should appear at the top
  const popularTimezones = [
    'UTC',
    'Europe/Istanbul', 
    'Europe/London',
    'Europe/Berlin',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'Asia/Dubai',
    'Asia/Kolkata'
  ]

  // Country mapping for better display names
  const countryMapping: Record<string, string> = {
    'Europe/Istanbul': 'Turkey',
    'Europe/London': 'United Kingdom',
    'Europe/Berlin': 'Germany', 
    'Europe/Paris': 'France',
    'Europe/Rome': 'Italy',
    'Europe/Madrid': 'Spain',
    'Europe/Amsterdam': 'Netherlands',
    'Europe/Vienna': 'Austria',
    'Europe/Warsaw': 'Poland',
    'Europe/Prague': 'Czech Republic',
    'Europe/Budapest': 'Hungary',
    'Europe/Stockholm': 'Sweden',
    'Europe/Oslo': 'Norway',
    'Europe/Copenhagen': 'Denmark',
    'Europe/Helsinki': 'Finland',
    'Europe/Athens': 'Greece',
    'Europe/Zurich': 'Switzerland',
    'America/New_York': 'United States (Eastern)',
    'America/Los_Angeles': 'United States (Pacific)', 
    'America/Chicago': 'United States (Central)',
    'America/Denver': 'United States (Mountain)',
    'America/Toronto': 'Canada',
    'America/Sao_Paulo': 'Brazil',
    'America/Argentina/Buenos_Aires': 'Argentina',
    'America/Mexico_City': 'Mexico',
    'Asia/Tokyo': 'Japan',
    'Asia/Shanghai': 'China',
    'Asia/Hong_Kong': 'Hong Kong',
    'Asia/Singapore': 'Singapore',
    'Asia/Dubai': 'United Arab Emirates',
    'Asia/Kolkata': 'India',
    'Asia/Seoul': 'South Korea',
    'Asia/Bangkok': 'Thailand',
    'Asia/Jakarta': 'Indonesia',
    'Australia/Sydney': 'Australia',
    'Africa/Cairo': 'Egypt',
    'Africa/Lagos': 'Nigeria',
    'Africa/Johannesburg': 'South Africa'
  }

  // Region labels in English
  const regionLabels: Record<string, string> = {
    'UTC': 'UTC',
    'Europe': 'Europe',
    'America': 'America',
    'Asia': 'Asia', 
    'Africa': 'Africa',
    'Australia': 'Australia/Oceania',
    'Pacific': 'Pacific',
    'Atlantic': 'Atlantic',
    'Indian': 'Indian Ocean',
    'Antarctica': 'Antarctica'
  }

  /**
   * Get UTC offset for a timezone
   */
  const getTimezoneOffset = (timezone: string): string => {
    try {
      const now = new Date()
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
      const targetTime = new Date(utc + (getTimezoneOffsetMinutes(timezone) * 60000))
      
      const formatter = new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        timeZoneName: 'longOffset'
      })
      
      const parts = formatter.formatToParts(now)
      const offsetPart = parts.find(part => part.type === 'timeZoneName')
      
      if (offsetPart?.value && offsetPart.value !== timezone) {
        return offsetPart.value.replace('GMT', 'UTC')
      }
      
      // Fallback calculation
      const offset = getTimezoneOffsetMinutes(timezone)
      const hours = Math.floor(Math.abs(offset) / 60)
      const minutes = Math.abs(offset) % 60
      const sign = offset >= 0 ? '+' : '-'
      
      return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    } catch {
      return 'UTC+00:00'
    }
  }

  /**
   * Get timezone offset in minutes
   */
  const getTimezoneOffsetMinutes = (timezone: string): number => {
    try {
      const now = new Date()
      const utcTime = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
      const targetTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
      return (targetTime.getTime() - utcTime.getTime()) / (1000 * 60)
    } catch {
      return 0
    }
  }

  /**
   * Format timezone display name
   */
  const formatTimezoneLabel = (timezone: string): string => {
    if (timezone === 'UTC') return 'UTC'

    const parts = timezone.split('/')
    if (parts.length < 2) return timezone

    const city = parts[parts.length - 1]!.replace(/_/g, ' ')
    return city
  }

  /**
   * Get current browser timezone
   */
  const getCurrentTimezone = (): string => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      return 'UTC'
    }
  }

  /**
   * Get all available timezones with metadata
   */
  const getAllTimezones = (): TimezoneOption[] => {
    try {
      const timezones = Intl.supportedValuesOf('timeZone')
      
      return timezones.map(timezone => {
        const region = timezone === 'UTC' ? 'UTC' : timezone.split('/')[0]
        const label = formatTimezoneLabel(timezone)
        const offset = getTimezoneOffset(timezone)
        const country = countryMapping[timezone]
        const popular = popularTimezones.includes(timezone)
        
        // Create searchable text
        const searchText = [
          timezone,
          label,
          offset,
          country,
          regionLabels[region as keyof typeof regionLabels]
        ].filter(Boolean).join(' ').toLowerCase()

        return {
          value: timezone,
          label,
          offset,
          region,
          country,
          popular,
          searchText
        }
      }).sort((a, b) => {
        // Sort by popularity first, then alphabetically
        if (a.popular && !b.popular) return -1
        if (!a.popular && b.popular) return 1
        if (a.region !== b.region) return (a.region || '').localeCompare(b.region || '')
        return a.label.localeCompare(b.label)
      }) as TimezoneOption[]
    } catch {
      // Fallback to common timezones if Intl.supportedValuesOf is not available
      return [
        { value: 'UTC', label: 'UTC', offset: 'UTC+00:00', region: 'UTC', country: undefined, popular: true, searchText: 'utc' },
        { value: 'Europe/Istanbul', label: 'Istanbul', offset: 'UTC+03:00', region: 'Europe', country: 'Turkey', popular: true, searchText: 'europe/istanbul istanbul turkey utc+03:00 europe' }
      ]
    }
  }

  /**
   * Group timezones by region
   */
  const getTimezoneGroups = (): TimezoneGroup[] => {
    const timezones = getAllTimezones()
    const groups = new Map<string, TimezoneOption[]>()

    timezones.forEach(tz => {
      if (!groups.has(tz.region)) {
        groups.set(tz.region, [])
      }
      groups.get(tz.region)!.push(tz)
    })

    const result: TimezoneGroup[] = []

    // Add popular timezones first
    const popularTzs = timezones.filter(tz => tz.popular)
    if (popularTzs.length > 0) {
      result.push({
        region: 'popular',
        label: labels.popularTimezones || 'Popular Timezones',
        timezones: popularTzs
      })
    }

    // Add other regions
    const regionOrder = ['UTC', 'Europe', 'Asia', 'America', 'Africa', 'Australia', 'Pacific', 'Atlantic', 'Indian', 'Antarctica']
    
    regionOrder.forEach(region => {
      const regionTzs = groups.get(region)?.filter(tz => !tz.popular)
      if (regionTzs && regionTzs.length > 0) {
        result.push({
          region,
          label: regionLabels[region] || region,
          timezones: regionTzs
        })
      }
    })

    // Add any remaining regions not in the order
    groups.forEach((timezones, region) => {
      if (!regionOrder.includes(region)) {
        const regionTzs = timezones.filter(tz => !tz.popular)
        if (regionTzs.length > 0) {
          result.push({
            region,
            label: regionLabels[region] || region,
            timezones: regionTzs
          })
        }
      }
    })

    return result
  }

  /**
   * Search/filter timezones
   */
  const searchTimezones = (query: string, limit = 50): TimezoneOption[] => {
    if (!query.trim()) {
      return getAllTimezones().slice(0, limit)
    }

    const searchTerm = query.toLowerCase()
    const allTimezones = getAllTimezones()
    const filtered = allTimezones.filter(tz => tz.searchText.includes(searchTerm))

    return filtered.slice(0, limit)
  }

  /**
   * Get timezone display text for select component
   */
  const getTimezoneDisplayText = (timezone: string): string => {
    const tz = getAllTimezones().find(t => t.value === timezone)
    if (!tz) return timezone

    if (timezone === 'UTC') return 'UTC (GMT+00:00)'
    
    const parts = [tz.label, `(${tz.offset})`]
    if (tz.country) parts.splice(1, 0, `-`, tz.country)
    
    return parts.join(' ')
  }

  return {
    getAllTimezones,
    getTimezoneGroups,
    searchTimezones,
    getCurrentTimezone,
    getTimezoneOffset,
    getTimezoneDisplayText,
    formatTimezoneLabel,
    popularTimezones,
    regionLabels
  }
}
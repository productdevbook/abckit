interface CountryOption {
  value: string // 'TR'
  label: string // '🇹🇷 Türkiye'
  name: string // 'Türkiye'
  flag: string // '🇹🇷'
  code: string // 'TR'
}

export function useCountries(locale: string = 'tr') {
  /**
   * Get country flag emoji from country code
   */
  const getCountryFlag = (countryCode: string): string => {
    try {
      const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0))
      return String.fromCodePoint(...codePoints)
    } catch {
      return '🏳️' // Fallback flag
    }
  }

  /**
   * Get all countries with their names in specified locale
   */
  const getAllCountries = (): CountryOption[] => {
    try {
      const countryNames = new Intl.DisplayNames([locale], { type: 'region' })
      const countries: CountryOption[] = []
      
      // Generate all possible 2-letter combinations (AA to ZZ)
      const A = 65 // 'A' char code
      const Z = 90 // 'Z' char code
      
      for (let i = A; i <= Z; i++) {
        for (let j = A; j <= Z; j++) {
          const code = String.fromCharCode(i) + String.fromCharCode(j)
          const name = countryNames.of(code)
          
          // If it's a valid country code, the name will be different from the code
          if (name && code !== name) {
            const flag = getCountryFlag(code)
            countries.push({
              value: code,
              code: code,
              name: name,
              flag: flag,
              label: `${flag} ${name}`
            })
          }
        }
      }
      
      // Sort alphabetically by name in the specified locale
      return countries.sort((a, b) => 
        a.name.localeCompare(b.name, locale)
      )
    } catch (error) {
      console.error('Failed to generate countries list:', error)
      
      // Fallback to a few common countries
      return [
        { value: 'TR', code: 'TR', name: 'Türkiye', flag: '🇹🇷', label: '🇹🇷 Türkiye' },
        { value: 'US', code: 'US', name: 'United States', flag: '🇺🇸', label: '🇺🇸 United States' },
        { value: 'GB', code: 'GB', name: 'United Kingdom', flag: '🇬🇧', label: '🇬🇧 United Kingdom' },
        { value: 'DE', code: 'DE', name: 'Germany', flag: '🇩🇪', label: '🇩🇪 Germany' },
        { value: 'FR', code: 'FR', name: 'France', flag: '🇫🇷', label: '🇫🇷 France' }
      ]
    }
  }

  /**
   * Get country name by code
   */
  const getCountryName = (countryCode: string): string => {
    try {
      const countryNames = new Intl.DisplayNames([locale], { type: 'region' })
      return countryNames.of(countryCode.toUpperCase()) || countryCode
    } catch {
      return countryCode
    }
  }

  /**
   * Get formatted display text for a country
   */
  const getCountryDisplayText = (countryCode: string): string => {
    if (!countryCode) return ''
    
    const flag = getCountryFlag(countryCode)
    const name = getCountryName(countryCode)
    
    return `${flag} ${name}`
  }

  /**
   * Popular countries that might be shown first (optional)
   */
  const popularCountries = ['TR', 'US', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'CA', 'AU']

  return {
    getAllCountries,
    getCountryName,
    getCountryDisplayText,
    getCountryFlag,
    popularCountries
  }
}
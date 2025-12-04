interface LanguageOption {
  value: string // 'tr'
  label: string // 'Türkçe (Türkçe)'
  name: string // 'Türkçe' (localized name)
  code: string // 'tr'
  nativeName: string // 'Türkçe' (in its own language)
  popular?: boolean // Is it a popular language?
}

export function useLanguages(displayLocale: string = 'tr', showAllLanguages: boolean = false) {
  // Popular/Common languages - more comprehensive list
  const popularLanguages = [
    'tr', 'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi',
    'nl', 'pl', 'sv', 'da', 'no', 'fi', 'el', 'he', 'th', 'vi', 'uk', 'cs', 'hu',
    'ro', 'bg', 'hr', 'sk', 'sl', 'et', 'lv', 'lt', 'mt', 'ga', 'ca', 'eu'
  ]

  /**
   * Brute force discover all supported language codes using Intl.DisplayNames
   */
  const discoverAllLanguageCodes = (): string[] => {
    const supportedCodes: string[] = []
    
    try {
      // Test all 2-letter combinations (aa to zz)
      for (let i = 97; i <= 122; i++) { // a-z
        for (let j = 97; j <= 122; j++) {
          const code = String.fromCharCode(i) + String.fromCharCode(j)
          
          try {
            const displayNames = new Intl.DisplayNames(['en'], { type: 'language' })
            const name = displayNames.of(code)
            
            // If it's a valid language code, name will be different from code
            if (name && code !== name && name !== code.toUpperCase()) {
              supportedCodes.push(code)
            }
          } catch {
            // Invalid language code, skip
          }
        }
      }
      
      // Also test some common 3-letter codes
      const common3LetterCodes = [
        'cmn', 'yue', 'nan', 'hsn', 'hak', 'gan', 'wuu', // Chinese variants
        'arb', 'arz', 'acw', 'apc', 'ary', // Arabic variants
        'nob', 'nno', // Norwegian variants
        'ckb', 'kmr', // Kurdish variants
        'hbs', 'srp', 'hrv', 'bos', // South Slavic
      ]
      
      for (const code of common3LetterCodes) {
        try {
          const displayNames = new Intl.DisplayNames(['en'], { type: 'language' })
          const name = displayNames.of(code)
          
          if (name && code !== name && name !== code.toUpperCase()) {
            supportedCodes.push(code)
          }
        } catch {
          // Invalid code, skip
        }
      }
      
    } catch (error) {
      console.warn('Language discovery failed, using fallback list:', error)
      return popularLanguages // Fallback to popular languages
    }
    
    return supportedCodes.sort()
  }

  /**
   * Get native name for a language using its own locale
   */
  const getNativeName = (languageCode: string): string => {
    try {
      const nativeNames = new Intl.DisplayNames([languageCode], { type: 'language' })
      return nativeNames.of(languageCode) || languageCode
    } catch {
      // Fallback to display locale if native fails
      try {
        const fallbackNames = new Intl.DisplayNames([displayLocale], { type: 'language' })
        return fallbackNames.of(languageCode) || languageCode
      } catch {
        return languageCode
      }
    }
  }

  /**
   * Get supported languages with localized names
   */
  const getAllLanguages = (): LanguageOption[] => {
    try {
      const languageNames = new Intl.DisplayNames([displayLocale], { type: 'language' })
      
      // If showAllLanguages is false, only use popular languages
      // If true, discover all supported languages using brute force
      const languageCodes = showAllLanguages 
        ? discoverAllLanguageCodes()
        : popularLanguages
      
      const languages = languageCodes.map(code => {
        const localizedName = languageNames.of(code) || code
        const nativeName = getNativeName(code)
        
        return {
          value: code,
          code: code,
          name: localizedName,
          nativeName: nativeName,
          label: `${nativeName} (${localizedName})`,
          popular: popularLanguages.includes(code)
        }
      })
      
      // Sort alphabetically by localized name
      return languages.sort((a, b) => 
        a.name.localeCompare(b.name, displayLocale)
      )
    } catch (error) {
      console.error('Failed to generate languages list:', error)
      
      // Fallback to popular languages only
      const fallbackNames = new Intl.DisplayNames([displayLocale], { type: 'language' })
      return popularLanguages.slice(0, 20).map(code => ({
        value: code,
        code: code,
        name: fallbackNames.of(code) || code,
        nativeName: getNativeName(code),
        label: `${getNativeName(code)} (${fallbackNames.of(code) || code})`,
        popular: true
      }))
    }
  }

  /**
   * Get language name by code (in display locale)
   */
  const getLanguageName = (languageCode: string): string => {
    try {
      const languageNames = new Intl.DisplayNames([displayLocale], { type: 'language' })
      return languageNames.of(languageCode.toLowerCase()) || languageCode
    } catch {
      return languageCode
    }
  }

  /**
   * Get formatted display text for a language
   */
  const getLanguageDisplayText = (languageCode: string): string => {
    if (!languageCode) return ''
    
    const nativeName = getNativeName(languageCode)
    const localizedName = getLanguageName(languageCode)
    
    return `${nativeName} (${localizedName})`
  }

  return {
    getAllLanguages,
    getLanguageName,
    getLanguageDisplayText,
    getNativeName,
    popularLanguages
  }
}
interface CurrencyOption {
  value: string // 'TRY'
  label: string // '₺ Türk Lirası (TRY)'
  name: string // 'Türk Lirası' (localized name)
  code: string // 'TRY'
  symbol: string // '₺'
  popular?: boolean // Is it a popular currency?
}

export function useCurrencies(displayLocale: string = 'tr') {
  // Popular currencies that should appear first  
  const popularCurrencies = ['TRY', 'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'INR']

  /**
   * Get currency symbol using Intl.NumberFormat
   */
  const getCurrencySymbol = (currencyCode: string): string => {
    try {
      const formatter = new Intl.NumberFormat('en', {
        style: 'currency',
        currency: currencyCode.toUpperCase(),
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })
      
      // Format 0 and extract the symbol
      const formatted = formatter.format(0)
      const symbol = formatted.replace(/[0-9,.\s]/g, '') // Remove numbers, commas, dots, spaces
      
      if (symbol && symbol.length > 0) {
        return symbol
      }
    } catch {
      // Fallback to currency code if formatting fails
    }
    
    // Fallback to currency code
    return currencyCode.toUpperCase()
  }

  /**
   * Get all supported currencies with localized names
   */
  const getAllCurrencies = (): CurrencyOption[] => {
    try {
      // Get ALL supported currencies automatically
      // @ts-ignore - supportedValuesOf exists but TypeScript types may not be updated  
      const allCurrencyCodes = (Intl as any).supportedValuesOf?.('currency')
      
      // If no currencies found via supportedValuesOf, use popular list
      if (!allCurrencyCodes || allCurrencyCodes.length === 0) {
        console.warn('Intl.supportedValuesOf not available for currencies, using popular list')
        throw new Error('supportedValuesOf not available')
      }
      
      const currencyNames = new Intl.DisplayNames([displayLocale], { type: 'currency' })
      
      const allCurrencies = allCurrencyCodes.map(code => {
        const name = currencyNames.of(code) || code
        const symbol = getCurrencySymbol(code)
        
        return {
          value: code,
          code: code,
          name: name,
          symbol: symbol,
          label: `${symbol} ${name} (${code})`,
          popular: popularCurrencies.includes(code)
        }
      })
      
      // Sort: Popular first, then alphabetically by name
      return allCurrencies.sort((a, b) => {
        // Popular currencies first
        if (a.popular && !b.popular) return -1
        if (!a.popular && b.popular) return 1
        
        // Then alphabetically by localized name
        return a.name.localeCompare(b.name, displayLocale)
      })
    } catch (error) {
      console.error('Failed to generate currencies list:', error)
      
      // Fallback to popular currencies only
      const fallbackNames = new Intl.DisplayNames([displayLocale], { type: 'currency' })
      return popularCurrencies.map(code => ({
        value: code,
        code: code,
        name: fallbackNames.of(code) || code,
        symbol: getCurrencySymbol(code),
        label: `${getCurrencySymbol(code)} ${fallbackNames.of(code) || code} (${code})`,
        popular: true
      }))
    }
  }

  /**
   * Get currency name by code
   */
  const getCurrencyName = (currencyCode: string): string => {
    try {
      const currencyNames = new Intl.DisplayNames([displayLocale], { type: 'currency' })
      return currencyNames.of(currencyCode.toUpperCase()) || currencyCode
    } catch {
      return currencyCode
    }
  }

  /**
   * Get formatted display text for a currency
   */
  const getCurrencyDisplayText = (currencyCode: string): string => {
    if (!currencyCode) return ''
    
    const symbol = getCurrencySymbol(currencyCode)
    const name = getCurrencyName(currencyCode)
    
    return `${symbol} ${name} (${currencyCode.toUpperCase()})`
  }

  return {
    getAllCurrencies,
    getCurrencyName,
    getCurrencyDisplayText,
    getCurrencySymbol,
    popularCurrencies
  }
}
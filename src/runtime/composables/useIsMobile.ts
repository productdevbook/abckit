import { useRuntimeConfig } from '#app'

/**
 * Check if running on mobile (Capacitor)
 * Uses abckit.auth.capacitor config
 */
export function useIsMobile(): boolean {
  const config = useRuntimeConfig()
  return config.public.abckit?.auth?.capacitor ?? false
}

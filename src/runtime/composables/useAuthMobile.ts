import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { registerCapacitorHandlers, useAuth } from './useAuth'

const AUTH_TOKEN_KEY = 'auth_token'

/**
 * Initialize auth for Capacitor/mobile apps
 * Call this once in your app's setup (e.g., app.vue or a plugin)
 *
 * @example
 * ```ts
 * // app.vue or plugins/auth.client.ts
 * import { useAuthMobile } from 'abckit/composables/useAuthMobile'
 *
 * if (Capacitor.isNativePlatform()) {
 *   useAuthMobile()
 * }
 * ```
 */
export function useAuthMobile() {
  // Only register handlers on native platforms
  if (!Capacitor.isNativePlatform()) {
    return useAuth()
  }

  // Register Capacitor token handlers
  registerCapacitorHandlers({
    onSuccess: async (authToken: string) => {
      await Preferences.set({ key: AUTH_TOKEN_KEY, value: authToken })
    },
    getToken: async () => {
      const result = await Preferences.get({ key: AUTH_TOKEN_KEY })
      return result?.value || ''
    },
    clearToken: async () => {
      await Preferences.remove({ key: AUTH_TOKEN_KEY })
    },
  })

  return useAuth()
}

export { Capacitor, Preferences }

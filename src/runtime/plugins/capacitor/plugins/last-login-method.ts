import type { Awaitable, BetterAuthClientPlugin } from 'better-auth'
import { Preferences } from '@capacitor/preferences'

export interface LastLoginMethodClientConfig {
  /**
   * Prefix for local storage keys (e.g., "my-app_last_login_method")
   * @default "better-auth"
   */
  storagePrefix?: string | undefined
  /**
   * Custom resolve method for retrieving the last login method
   */
  customResolveMethod?:
    | ((url: string | URL) => Awaitable<string | undefined | null>)
    | undefined
}

const paths = [
  '/callback/',
  '/oauth2/callback/',
  '/sign-in/email',
  '/sign-up/email',
]

function defaultResolveMethod(url: string | URL): string | undefined {
  const { pathname } = new URL(url.toString(), 'http://localhost')

  if (paths.some(p => pathname.includes(p))) {
    return pathname.split('/').pop()
  }
  if (pathname.includes('siwe'))
    return 'siwe'
  if (pathname.includes('/passkey/verify-authentication')) {
    return 'passkey'
  }

  return undefined
}

export function lastLoginMethodClient(config?: LastLoginMethodClientConfig): BetterAuthClientPlugin {
  const resolveMethod = config?.customResolveMethod || defaultResolveMethod
  const storagePrefix = config?.storagePrefix || 'better-auth'
  const lastLoginMethodName = `${storagePrefix}_last_login_method`

  return {
    id: 'last-login-method-capacitor',
    fetchPlugins: [
      {
        id: 'last-login-method-capacitor',
        name: 'Last Login Method',
        hooks: {
          onResponse: async (ctx) => {
            const lastMethod = await resolveMethod(ctx.request.url)
            if (!lastMethod) {
              return
            }

            await Preferences.set({ key: lastLoginMethodName, value: lastMethod })
          },
        },
      },
    ],
    getActions() {
      return {
        /**
         * Get the last used login method from storage
         *
         * @returns The last used login method or null if not found
         */
        getLastUsedLoginMethod: async (): Promise<string | null> => {
          const result = await Preferences.get({ key: lastLoginMethodName })
          return result?.value ?? null
        },
        /**
         * Clear the last used login method from storage
         */
        clearLastUsedLoginMethod: async () => {
          await Preferences.remove({ key: lastLoginMethodName })
        },
        /**
         * Check if a specific login method was the last used
         * @param method The method to check
         * @returns True if the method was the last used, false otherwise
         */
        isLastUsedLoginMethod: async (method: string): Promise<boolean> => {
          const result = await Preferences.get({ key: lastLoginMethodName })
          return result?.value === method
        },
      }
    },
  }
}

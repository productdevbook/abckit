import type { BetterAuthClientPlugin, ClientStore } from 'better-auth'
import { safeJSONParse } from '@better-auth/core/utils/json'
import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import {
  parseSetCookieHeader,
  SECURE_COOKIE_PREFIX,
  stripSecureCookiePrefix,
} from 'better-auth/cookies'
import { setupCapacitorFocusManager } from './focus-manager'
import { setupCapacitorOnlineManager } from './online-manager'

const isNative = Capacitor.isNativePlatform()

// Initialize managers only on native platforms
if (isNative) {
  setupCapacitorFocusManager()
  setupCapacitorOnlineManager()
}

interface StoredCookie {
  value: string
  expires: string | null
}

export interface CapacitorClientOptions {
  /**
   * Prefix for storage keys
   * @default 'better-auth'
   */
  storagePrefix?: string
  /**
   * Prefix(es) for server cookie names to filter
   * Prevents infinite refetching when third-party cookies are set
   * @default 'better-auth'
   */
  cookiePrefix?: string | string[]
  /**
   * App scheme for deep links (e.g., 'myapp')
   * Used for OAuth callback URLs
   */
  scheme?: string
  /**
   * Disable session caching
   * @default false
   */
  disableCache?: boolean
}

/**
 * Normalize cookie name for storage compatibility
 * Replaces colons with underscores (fixes secure store issues)
 * @see https://github.com/better-auth/better-auth/issues/5426
 */
export function normalizeCookieName(name: string): string {
  return name.replace(/:/g, '_')
}

/**
 * Merge new cookies with existing ones
 */
export function getSetCookie(header: string, prevCookie?: string): string {
  const parsed = parseSetCookieHeader(header)
  let toSetCookie: Record<string, StoredCookie> = {}

  parsed.forEach((cookie, key) => {
    const expiresAt = cookie.expires
    const maxAge = cookie['max-age']
    const expires = maxAge
      ? new Date(Date.now() + Number(maxAge) * 1000)
      : expiresAt
        ? new Date(String(expiresAt))
        : null

    toSetCookie[key] = {
      value: cookie.value,
      expires: expires ? expires.toISOString() : null,
    }
  })

  if (prevCookie) {
    try {
      const prevCookieParsed = JSON.parse(prevCookie)
      toSetCookie = {
        ...prevCookieParsed,
        ...toSetCookie,
      }
    }
    catch {
      // Invalid JSON, ignore
    }
  }

  return JSON.stringify(toSetCookie)
}

/**
 * Convert stored cookies to cookie header string
 */
export function getCookie(cookie: string): string {
  let parsed: Record<string, StoredCookie> = {}

  try {
    parsed = JSON.parse(cookie) as Record<string, StoredCookie>
  }
  catch {
    return ''
  }

  const toSend = Object.entries(parsed).reduce((acc, [key, value]) => {
    if (value.expires && new Date(value.expires) < new Date()) {
      return acc
    }
    return `${acc}; ${key}=${value.value}`
  }, '')

  return toSend
}

/**
 * Check if Set-Cookie header contains better-auth cookies
 * Prevents infinite refetching when third-party cookies (like Cloudflare __cf_bm) are present
 */
export function hasBetterAuthCookies(setCookieHeader: string, cookiePrefix: string | string[]): boolean {
  const cookies = parseSetCookieHeader(setCookieHeader)
  const cookieSuffixes = ['session_token', 'session_data']
  const prefixes = Array.isArray(cookiePrefix) ? cookiePrefix : [cookiePrefix]

  for (const name of cookies.keys()) {
    // Remove __Secure- prefix if present using official utility
    const nameWithoutSecure = stripSecureCookiePrefix(name)

    for (const prefix of prefixes) {
      if (prefix) {
        // Check if cookie starts with the prefix
        if (nameWithoutSecure.startsWith(prefix))
          return true
      }
      else {
        // When prefix is empty, check for common better-auth cookie patterns
        for (const suffix of cookieSuffixes) {
          if (nameWithoutSecure.endsWith(suffix))
            return true
        }
      }
    }
  }
  return false
}

/**
 * Check if session cookies have changed (ignore expiry)
 */
function hasSessionCookieChanged(prevCookie: string | null, newCookie: string): boolean {
  if (!prevCookie)
    return true

  try {
    const prev = JSON.parse(prevCookie) as Record<string, StoredCookie>
    const next = JSON.parse(newCookie) as Record<string, StoredCookie>

    const sessionKeys = new Set<string>()
    Object.keys(prev).forEach((key) => {
      if (key.includes('session_token') || key.includes('session_data'))
        sessionKeys.add(key)
    })
    Object.keys(next).forEach((key) => {
      if (key.includes('session_token') || key.includes('session_data'))
        sessionKeys.add(key)
    })

    for (const key of sessionKeys) {
      const prevValue = prev[key]?.value
      const nextValue = next[key]?.value
      if (prevValue !== nextValue) {
        return true
      }
    }

    return false
  }
  catch {
    return true
  }
}

/**
 * Get OAuth state value from stored cookies
 * Supports both secure-prefixed and unprefixed cookie naming conventions
 */
function getOAuthStateValue(
  cookieJson: string | null,
  cookiePrefix: string | string[],
): string | null {
  if (!cookieJson)
    return null

  const parsed = safeJSONParse<Record<string, StoredCookie>>(cookieJson)
  if (!parsed)
    return null

  const prefixes = Array.isArray(cookiePrefix) ? cookiePrefix : [cookiePrefix]

  for (const prefix of prefixes) {
    // cookie strategy uses: <prefix>.oauth_state
    const candidates = [
      `${SECURE_COOKIE_PREFIX}${prefix}.oauth_state`,
      `${prefix}.oauth_state`,
    ]

    for (const name of candidates) {
      const value = parsed?.[name]?.value
      if (value)
        return value
    }
  }

  return null
}

/**
 * Get the origin URL for the app scheme
 */
function getOrigin(scheme: string): string {
  return `${scheme}://`
}

/**
 * Capacitor client plugin for Better Auth
 * Provides offline-first authentication with persistent storage
 */
export function capacitorClient(opts?: CapacitorClientOptions): BetterAuthClientPlugin {
  let store: ClientStore | null = null
  const storagePrefix = opts?.storagePrefix || 'better-auth'
  const cookiePrefix = opts?.cookiePrefix || 'better-auth'
  const cookieName = `${storagePrefix}_cookie`
  const localCacheName = `${storagePrefix}_session_data`
  const scheme = opts?.scheme

  return {
    id: 'capacitor',

    getActions: (_$fetch, $store) => {
      store = $store
      return {
        /**
         * Get stored cookie string for manual fetch requests
         */
        getCookie: async () => {
          const result = await Preferences.get({ key: normalizeCookieName(cookieName) })
          return getCookie(result?.value || '{}')
        },

        /**
         * Get cached session data for offline use
         */
        getCachedSession: async () => {
          const result = await Preferences.get({ key: normalizeCookieName(localCacheName) })
          if (!result?.value)
            return null
          try {
            return JSON.parse(result.value)
          }
          catch {
            return null
          }
        },

        /**
         * Clear all stored auth data
         */
        clearStorage: async () => {
          await Preferences.remove({ key: normalizeCookieName(cookieName) })
          await Preferences.remove({ key: normalizeCookieName(localCacheName) })
        },
      }
    },

    fetchPlugins: [
      {
        id: 'capacitor',
        name: 'Capacitor Auth',
        hooks: {
          async onSuccess(context) {
            if (!isNative)
              return

            const normalizedCookieName = normalizeCookieName(cookieName)

            // Handle set-auth-token header (Better Auth's token response)
            const authToken = context.response.headers.get('set-auth-token')
            if (authToken) {
              const prefixStr = Array.isArray(cookiePrefix) ? cookiePrefix[0] : cookiePrefix
              const prevCookie = (await Preferences.get({ key: normalizedCookieName }))?.value
              // Store with proper cookie prefix (e.g., 'better-auth.session_token')
              const tokenCookie = `${prefixStr}.session_token=${authToken}`
              const newCookie = getSetCookie(tokenCookie, prevCookie ?? undefined)

              if (hasSessionCookieChanged(prevCookie ?? null, newCookie)) {
                await Preferences.set({ key: normalizedCookieName, value: newCookie })
                store?.notify('$sessionSignal')
              }
              else {
                // Still update to refresh expiry
                await Preferences.set({ key: normalizedCookieName, value: newCookie })
              }
            }

            // Handle standard Set-Cookie header
            const setCookie = context.response.headers.get('set-cookie')
            if (setCookie) {
              // Only process if it contains better-auth cookies
              // This prevents infinite refetching when third-party cookies are present
              if (hasBetterAuthCookies(setCookie, cookiePrefix)) {
                const prevCookie = (await Preferences.get({ key: normalizedCookieName }))?.value
                const toSetCookie = getSetCookie(setCookie, prevCookie ?? undefined)

                if (hasSessionCookieChanged(prevCookie ?? null, toSetCookie)) {
                  await Preferences.set({ key: normalizedCookieName, value: toSetCookie })
                  store?.notify('$sessionSignal')
                }
                else {
                  // Still update the storage to refresh expiry times, but don't trigger refetch
                  await Preferences.set({ key: normalizedCookieName, value: toSetCookie })
                }
              }
            }

            // Cache session data for offline use
            if (
              context.request.url.toString().includes('/get-session')
              && !opts?.disableCache
            ) {
              const data = context.data
              await Preferences.set({
                key: normalizeCookieName(localCacheName),
                value: JSON.stringify(data),
              })
            }

            // Handle OAuth redirect for social sign-in
            if (
              context.data?.redirect
              && (context.request.url.toString().includes('/sign-in')
                || context.request.url.toString().includes('/link-social'))
              && !context.request?.body?.includes?.('idToken') // idToken is for silent sign-in
              && scheme
            ) {
              const callbackURL = JSON.parse(context.request.body)?.callbackURL
              const signInURL = context.data?.url

              const storedCookieJson = (await Preferences.get({ key: normalizedCookieName }))?.value
              const oauthStateValue = getOAuthStateValue(storedCookieJson ?? null, cookiePrefix)

              const params = new URLSearchParams({ authorizationURL: signInURL })
              if (oauthStateValue) {
                params.append('oauthState', oauthStateValue)
              }

              // Get base URL from request
              const requestUrl = new URL(context.request.url)
              const baseURL = `${requestUrl.protocol}//${requestUrl.host}`
              const proxyURL = `${baseURL}/expo-authorization-proxy?${params.toString()}`

              // Open browser for OAuth
              await Browser.open({ url: proxyURL })

              // Listen for deep link callback
              const handle = await App.addListener('appUrlOpen', async ({ url }) => {
                try {
                  const urlObj = new URL(url)
                  const cookie = urlObj.searchParams.get('cookie')
                  if (cookie) {
                    const prevCookie = (await Preferences.get({ key: normalizedCookieName }))?.value
                    const toSetCookie = getSetCookie(cookie, prevCookie ?? undefined)
                    await Preferences.set({ key: normalizedCookieName, value: toSetCookie })
                    store?.notify('$sessionSignal')
                  }

                  // Check if callback matches expected URL
                  if (callbackURL && urlObj.pathname === callbackURL) {
                    // Close browser
                    try {
                      await Browser.close()
                    }
                    catch {
                      // Browser may already be closed
                    }
                    handle.remove()
                  }
                }
                catch {
                  // Invalid URL, ignore
                }
              })
            }
          },
        },

        async init(url, options) {
          if (!isNative) {
            return { url, options }
          }

          const normalizedCookieName = normalizeCookieName(cookieName)

          // Add stored cookie to request headers
          const storedCookie = (await Preferences.get({ key: normalizedCookieName }))?.value
          const cookie = getCookie(storedCookie || '{}')

          options = options || {}
          options.credentials = 'omit'
          options.headers = {
            ...options.headers,
            cookie,
          }

          // Add Capacitor-specific headers when scheme is configured
          if (scheme) {
            options.headers = {
              ...options.headers,
              'capacitor-origin': getOrigin(scheme),
              'x-skip-oauth-proxy': 'true',
            }

            // Rewrite relative callback URLs to deep link URLs
            if (options.body?.callbackURL) {
              if (options.body.callbackURL.startsWith('/')) {
                options.body.callbackURL = `${scheme}:/${options.body.callbackURL}`
              }
            }
            if (options.body?.newUserCallbackURL) {
              if (options.body.newUserCallbackURL.startsWith('/')) {
                options.body.newUserCallbackURL = `${scheme}:/${options.body.newUserCallbackURL}`
              }
            }
            if (options.body?.errorCallbackURL) {
              if (options.body.errorCallbackURL.startsWith('/')) {
                options.body.errorCallbackURL = `${scheme}:/${options.body.errorCallbackURL}`
              }
            }
          }

          // Handle sign-out: clear storage and update state immediately
          if (url.includes('/sign-out')) {
            await Preferences.set({ key: normalizedCookieName, value: '{}' })
            store?.atoms?.session?.set({
              ...store.atoms.session.get(),
              data: null,
              error: null,
              isPending: false,
            })
            await Preferences.set({ key: normalizeCookieName(localCacheName), value: '{}' })
          }

          return { url, options }
        },
      },
    ],
  }
}

// Re-export managers
export * from './focus-manager'

export * from './online-manager'
// Re-export from better-auth/cookies
export { parseSetCookieHeader } from 'better-auth/cookies'

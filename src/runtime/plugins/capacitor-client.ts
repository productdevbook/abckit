import type { BetterAuthClientPlugin, ClientStore } from 'better-auth'
import type { FocusManager, OnlineManager } from 'better-auth/client'
import { Preferences } from '@capacitor/preferences'
import { kFocusManager, kOnlineManager } from 'better-auth/client'

interface StoredCookie {
  value: string
  expires: string | null
}

interface CapacitorClientOptions {
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
}

// ============================================
// Focus Manager - refresh session when app comes to foreground
// ============================================
type FocusListener = (focused: boolean) => void

class CapacitorFocusManager implements FocusManager {
  listeners = new Set<FocusListener>()
  unsubscribe?: () => void

  subscribe(listener: FocusListener) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  setFocused(focused: boolean) {
    this.listeners.forEach(listener => listener(focused))
  }

  setup() {
    import('@capacitor/app')
      .then(async ({ App }) => {
        const handle = await App.addListener('appStateChange', (state) => {
          this.setFocused(state.isActive)
        })
        this.unsubscribe = () => handle.remove()
      })
      .catch(() => {
        // App plugin not available
      })

    return () => {
      this.unsubscribe?.()
    }
  }
}

export function setupCapacitorFocusManager(): FocusManager {
  const global = globalThis as unknown as Record<symbol, FocusManager>
  if (!global[kFocusManager]) {
    global[kFocusManager] = new CapacitorFocusManager()
  }
  return global[kFocusManager]
}

// ============================================
// Online Manager - handle offline state
// ============================================
type OnlineListener = (online: boolean) => void

class CapacitorOnlineManager implements OnlineManager {
  listeners = new Set<OnlineListener>()
  isOnline = true
  unsubscribe?: () => void

  subscribe(listener: OnlineListener) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  setOnline(online: boolean) {
    this.isOnline = online
    this.listeners.forEach(listener => listener(online))
  }

  setup() {
    import('@capacitor/network')
      .then(async ({ Network }) => {
        const handle = await Network.addListener('networkStatusChange', (status) => {
          this.setOnline(status.connected)
        })
        this.unsubscribe = () => handle.remove()
      })
      .catch(() => {
        // Network plugin not available, fallback to always online
        this.setOnline(true)
      })

    return () => {
      this.unsubscribe?.()
    }
  }
}

export function setupCapacitorOnlineManager(): OnlineManager {
  const global = globalThis as unknown as Record<symbol, OnlineManager>
  if (!global[kOnlineManager]) {
    global[kOnlineManager] = new CapacitorOnlineManager()
  }
  return global[kOnlineManager]
}

// Initialize managers
setupCapacitorFocusManager()
setupCapacitorOnlineManager()

/**
 * Parse Set-Cookie header into a map of cookie attributes
 */
function parseSetCookieHeader(header: string): Map<string, { 'value': string, 'expires'?: string, 'max-age'?: string }> {
  const cookieMap = new Map()
  const cookies = splitSetCookieHeader(header)

  cookies.forEach((cookie) => {
    const parts = cookie.split(';').map(p => p.trim())
    const [nameValue, ...attributes] = parts
    if (!nameValue)
      return

    const [name, ...valueParts] = nameValue.split('=')
    const value = valueParts.join('=')
    const cookieObj: Record<string, string> = { value }

    attributes.forEach((attr) => {
      const [attrName, ...attrValueParts] = attr.split('=')
      const attrValue = attrValueParts.join('=')
      if (attrName)
        cookieObj[attrName.toLowerCase()] = attrValue
    })

    if (name)
      cookieMap.set(name, cookieObj)
  })

  return cookieMap
}

/**
 * Split Set-Cookie header handling expires with commas
 */
function splitSetCookieHeader(setCookie: string): string[] {
  const parts: string[] = []
  let buffer = ''
  let i = 0

  while (i < setCookie.length) {
    const char = setCookie[i]
    if (char === ',') {
      const recent = buffer.toLowerCase()
      const hasExpires = recent.includes('expires=')
      const hasGmt = /gmt/i.test(recent)

      if (hasExpires && !hasGmt) {
        buffer += char
        i += 1
        continue
      }

      if (buffer.trim().length > 0) {
        parts.push(buffer.trim())
        buffer = ''
      }
      i += 1
      if (setCookie[i] === ' ')
        i += 1
      continue
    }
    buffer += char
    i += 1
  }

  if (buffer.trim().length > 0)
    parts.push(buffer.trim())

  return parts
}

/**
 * Merge new cookies with existing ones
 */
function mergeCookies(setCookieHeader: string, prevCookie?: string): string {
  const parsed = parseSetCookieHeader(setCookieHeader)
  let cookies: Record<string, StoredCookie> = {}

  // Load previous cookies
  if (prevCookie) {
    try {
      cookies = JSON.parse(prevCookie)
    }
    catch {
      // Invalid JSON, start fresh
    }
  }

  // Merge new cookies
  parsed.forEach((cookie, key) => {
    const maxAge = cookie['max-age']
    const expiresAt = cookie.expires
    const expires = maxAge
      ? new Date(Date.now() + Number(maxAge) * 1000)
      : expiresAt
        ? new Date(String(expiresAt))
        : null

    cookies[key] = {
      value: cookie.value,
      expires: expires ? expires.toISOString() : null,
    }
  })

  return JSON.stringify(cookies)
}

/**
 * Convert stored cookies to cookie header string
 */
function getCookieString(storedCookies: string): string {
  let parsed: Record<string, StoredCookie> = {}

  try {
    parsed = JSON.parse(storedCookies)
  }
  catch {
    return ''
  }

  const parts: string[] = []

  for (const [key, cookie] of Object.entries(parsed)) {
    // Skip expired cookies
    if (cookie.expires && new Date(cookie.expires) < new Date())
      continue

    parts.push(`${key}=${cookie.value}`)
  }

  return parts.join('; ')
}

/**
 * Check if Set-Cookie header contains better-auth cookies
 * Prevents infinite refetching when third-party cookies (like Cloudflare __cf_bm) are present
 */
function hasBetterAuthCookies(setCookieHeader: string, cookiePrefix: string | string[]): boolean {
  const cookies = parseSetCookieHeader(setCookieHeader)
  const cookieSuffixes = ['session_token', 'session_data']
  const prefixes = Array.isArray(cookiePrefix) ? cookiePrefix : [cookiePrefix]

  for (const name of cookies.keys()) {
    // Remove __Secure- prefix if present
    const nameWithoutSecure = name.startsWith('__Secure-') ? name.slice(9) : name

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
    for (const key of Object.keys(prev)) {
      if (key.includes('session_token') || key.includes('session_data'))
        sessionKeys.add(key)
    }
    for (const key of Object.keys(next)) {
      if (key.includes('session_token') || key.includes('session_data'))
        sessionKeys.add(key)
    }

    for (const key of sessionKeys) {
      if (prev[key]?.value !== next[key]?.value)
        return true
    }

    return false
  }
  catch {
    return true
  }
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
  const sessionCacheName = `${storagePrefix}_session`

  return {
    id: 'capacitor',

    getActions: (_$fetch, $store) => {
      store = $store
      return {
        /**
         * Get stored cookie string for manual fetch requests
         */
        getCookie: async () => {
          const result = await Preferences.get({ key: cookieName })
          return getCookieString(result?.value || '{}')
        },

        /**
         * Get cached session data for offline use
         */
        getCachedSession: async () => {
          const result = await Preferences.get({ key: sessionCacheName })
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
          await Preferences.remove({ key: cookieName })
          await Preferences.remove({ key: sessionCacheName })
        },
      }
    },

    fetchPlugins: [
      {
        id: 'capacitor',
        name: 'Capacitor Auth',
        hooks: {
          async onSuccess(context) {
            // Handle set-auth-token header (Better Auth's token response)
            const authToken = context.response.headers.get('set-auth-token')
            if (authToken) {
              const prevCookie = (await Preferences.get({ key: cookieName }))?.value
              // Store as session_token cookie format
              const tokenCookie = `session_token=${authToken}`
              const newCookie = mergeCookies(tokenCookie, prevCookie ?? undefined)

              if (hasSessionCookieChanged(prevCookie ?? null, newCookie)) {
                await Preferences.set({ key: cookieName, value: newCookie })
                store?.notify('$sessionSignal')
              }
              else {
                // Still update to refresh expiry
                await Preferences.set({ key: cookieName, value: newCookie })
              }
            }

            // Handle standard Set-Cookie header
            const setCookie = context.response.headers.get('set-cookie')
            if (setCookie) {
              // Only process if it contains better-auth cookies
              // This prevents infinite refetching when third-party cookies are present
              if (hasBetterAuthCookies(setCookie, cookiePrefix)) {
                const prevCookie = (await Preferences.get({ key: cookieName }))?.value
                const newCookie = mergeCookies(setCookie, prevCookie ?? undefined)

                if (hasSessionCookieChanged(prevCookie ?? null, newCookie)) {
                  await Preferences.set({ key: cookieName, value: newCookie })
                  store?.notify('$sessionSignal')
                }
                else {
                  await Preferences.set({ key: cookieName, value: newCookie })
                }
              }
            }

            // Cache session data for offline use
            if (context.request.url.toString().includes('/get-session')) {
              if (context.data?.session || context.data?.user) {
                await Preferences.set({
                  key: sessionCacheName,
                  value: JSON.stringify(context.data),
                })
              }
            }
          },
        },

        async init(url, options) {
          // Add stored cookie to request headers
          const storedCookie = (await Preferences.get({ key: cookieName }))?.value
          const cookie = getCookieString(storedCookie || '{}')

          if (cookie) {
            options = options || {}
            options.headers = {
              ...options.headers,
              cookie,
            }
          }

          // Handle sign-out: clear storage and update state immediately
          if (url.includes('/sign-out')) {
            await Preferences.remove({ key: cookieName })
            await Preferences.remove({ key: sessionCacheName })

            // Immediately update session state
            if (store?.atoms?.session) {
              const currentSession = store.atoms.session.get()
              store.atoms.session.set({
                ...currentSession,
                data: null,
                error: null,
                isPending: false,
              })
            }
          }

          return { url, options }
        },
      },
    ],
  }
}

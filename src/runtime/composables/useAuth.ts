import { navigateTo, useRuntimeConfig } from '#app'
import { adminClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/vue'
import { computed, watch } from 'vue'

// Auth client singleton - initialized lazily with runtime config
let authClient: ReturnType<typeof createAuthClient> | null = null

// Capacitor token handlers - set by useAuthMobile
let capacitorTokenHandlers: {
  onSuccess: (authToken: string) => Promise<void>
  getToken: () => Promise<string>
  clearToken: () => Promise<void>
} | null = null

/**
 * Register Capacitor token handlers for mobile apps
 * Call this from useAuthMobile before using useAuth
 */
export function registerCapacitorHandlers(handlers: typeof capacitorTokenHandlers) {
  capacitorTokenHandlers = handlers
}

function getAuthClient() {
  if (authClient)
    return authClient

  // Get runtime config for auth settings
  const config = useRuntimeConfig()
  const authConfig = config.public.abckit?.auth
  const baseURL = authConfig?.baseURL
  const basePath = authConfig?.basePath

  // Build client options
  const clientOptions: Parameters<typeof createAuthClient>[0] = {
    baseURL,
    basePath,
    plugins: [adminClient()],
  }

  // Add Capacitor fetch options if handlers are registered
  if (capacitorTokenHandlers) {
    clientOptions.fetchOptions = {
      credentials: 'include',
      onSuccess: async (ctx) => {
        const authToken = ctx.response.headers.get('set-auth-token')
        if (authToken && capacitorTokenHandlers) {
          await capacitorTokenHandlers.onSuccess(authToken)
        }
      },
      auth: {
        type: 'Bearer',
        token: async () => {
          if (!capacitorTokenHandlers)
            return ''
          return capacitorTokenHandlers.getToken()
        },
      },
    }
  }

  authClient = createAuthClient(clientOptions)

  return authClient
}

/**
 * Main authentication composable for Better Auth
 */
export function useAuth() {
  const client = getAuthClient()
  const session = client.useSession()
  const config = useRuntimeConfig()

  const isLoading = computed(() => session.value.isPending)
  const isAuthenticated = computed(() => !!session.value.data?.user)
  const user = computed(() => session.value.data?.user || null)

  // Sentry kullanıcı bilgilerini senkronize et (optional)
  if (config.public.abckit?.sentry) {
    watch(user, async (currentUser) => {
      const Sentry = await import('@sentry/nuxt')
      if (currentUser) {
        Sentry.setUser({ id: currentUser.id })
      }
      else {
        Sentry.setUser(null)
      }
    }, { immediate: true })
  }

  function login(returnTo?: string) {
    const query = returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : ''
    navigateTo(`/auth/login${query}`)
  }

  function register(returnTo?: string) {
    const query = returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : ''
    navigateTo(`/auth/register${query}`)
  }

  async function logout() {
    await client.signOut()

    // Clear Capacitor token if handlers are registered
    if (capacitorTokenHandlers) {
      await capacitorTokenHandlers.clearToken()
    }

    navigateTo('/')
  }

  async function refreshSession() {
    const result = await client.getSession({ fetchOptions: { cache: 'no-store' } })
    return result
  }

  return {
    session,
    isLoading,
    isAuthenticated,
    user,
    login,
    register,
    logout,
    refreshSession,
    authClient: client,
  }
}

// Lazy exports - these will use the singleton once initialized
export function getAuthClientExports() {
  const client = getAuthClient()
  return {
    signIn: client.signIn,
    signUp: client.signUp,
    signOut: client.signOut,
    useSession: client.useSession,
    getSession: client.getSession,
    authClient: client,
  }
}

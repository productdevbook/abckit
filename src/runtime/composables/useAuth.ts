import { navigateTo, useNuxtApp, useRuntimeConfig } from '#app'
import { adminClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/vue'
import { computed, watch } from 'vue'

// Auth client singleton - initialized lazily with runtime config
let authClient: ReturnType<typeof createAuthClient> | null = null

function getAuthClient() {
  if (authClient)
    return authClient

  // Get runtime config for baseURL (needed for Capacitor/mobile apps)
  const config = useRuntimeConfig()
  const baseURL = config.public.abckit?.auth?.baseURL

  authClient = createAuthClient({
    baseURL,
    plugins: [adminClient()],
  })

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

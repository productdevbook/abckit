import { navigateTo, useRuntimeConfig } from '#app'
import { adminClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/vue'
import { computed, watch } from 'vue'

// Create Better Auth client with admin plugin
const authClient = createAuthClient({
  plugins: [adminClient()],
})

// Sentry'yi lazy load et (sadece aktifse)
function setSentryUser(user: { id: string } | null) {
  const config = useRuntimeConfig()
  if (!config.public.abckit?.sentry) {
    return
  }

  import('@sentry/nuxt')
    .then((Sentry) => {
      Sentry.setUser(user)
    })
    .catch(() => {
      // Sentry not installed, skip
    })
}

/**
 * Main authentication composable for Better Auth
 */
export function useAuth() {
  const session = authClient.useSession()

  const isLoading = computed(() => session.value.isPending)
  const isAuthenticated = computed(() => !!session.value.data?.user)
  const user = computed(() => session.value.data?.user || null)

  // Sentry kullanıcı bilgilerini senkronize et (optional)
  watch(user, (currentUser) => {
    if (currentUser) {
      setSentryUser({ id: currentUser.id })
    }
    else {
      setSentryUser(null)
    }
  }, { immediate: true })

  function login(returnTo?: string) {
    const query = returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : ''
    navigateTo(`/auth/login${query}`)
  }

  function register(returnTo?: string) {
    const query = returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : ''
    navigateTo(`/auth/register${query}`)
  }

  async function logout() {
    await authClient.signOut()
    navigateTo('/')
  }

  async function refreshSession() {
    const result = await authClient.getSession({ fetchOptions: { cache: 'no-store' } })
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
    authClient,
  }
}

export const { signIn, signUp, signOut, useSession, getSession } = authClient
export { authClient }

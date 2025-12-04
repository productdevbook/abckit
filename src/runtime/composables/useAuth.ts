import { navigateTo } from '#app'
import { adminClient } from 'better-auth/client/plugins'
import { createAuthpClient } from 'better-auth/vue'
import { computed } from 'vue'

// Create Better Auth client with admin plugin
const authClient = createAuthClient({
  plugins: [adminClient()],
})

/**
 * Main authentication composable for Better Auth
 */
export function useAuth() {
  const session = authClient.useSession()

  const isLoading = computed(() => session.value.isPending)
  const isAuthenticated = computed(() => !!session.value.data?.user)
  const user = computed(() => session.value.data?.user || null)

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

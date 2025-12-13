import { navigateTo, useRuntimeConfig } from '#app'
import { adminClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/vue'
import { computed, ref, watch } from 'vue'
import { capacitorClient } from '../plugins/capacitor-client'

let authClient: ReturnType<typeof createAuthClient> | null = null

// Offline session cache for initial load (before plugin initializes)
const offlineSession = ref<any>(null)
const offlineChecked = ref(false)

// Initialize offline session on module load (Capacitor only)
async function initOfflineSession(isCapacitor: boolean) {
  if (!isCapacitor || offlineChecked.value)
    return

  try {
    const { Preferences } = await import('@capacitor/preferences')
    const result = await Preferences.get({ key: 'better-auth_session' })
    if (result?.value) {
      offlineSession.value = JSON.parse(result.value)
    }
  }
  catch {
    // Ignore errors
  }
  finally {
    offlineChecked.value = true
  }
}

function getAuthClient() {
  if (authClient)
    return authClient

  const config = useRuntimeConfig()
  const authConfig = config.public.abckit?.auth
  const isCapacitor = authConfig?.capacitor ?? false

  // Initialize offline session
  initOfflineSession(isCapacitor)

  const plugins: any[] = [adminClient()]

  // Add Capacitor plugin for mobile
  if (isCapacitor) {
    plugins.push(capacitorClient({
      storagePrefix: 'better-auth',
    }))
  }

  authClient = createAuthClient({
    baseURL: authConfig?.baseURL,
    basePath: authConfig?.basePath,
    plugins,
  })

  return authClient
}

/**
 * Main authentication composable for Better Auth
 * Supports offline-first authentication for Capacitor apps
 */
export function useAuth() {
  const client = getAuthClient()
  const session = client.useSession()
  const config = useRuntimeConfig()
  const isCapacitor = config.public.abckit?.auth?.capacitor ?? false

  const isLoading = computed(() => {
    if (session.value.isPending)
      return true
    // Wait for offline check on Capacitor
    if (isCapacitor && !offlineChecked.value)
      return true
    return false
  })

  // Effective session: server or cached offline
  const effectiveSession = computed(() => {
    if (session.value.data?.user)
      return session.value.data
    if (isCapacitor && offlineSession.value?.user)
      return offlineSession.value
    return null
  })

  const isAuthenticated = computed(() => !!effectiveSession.value?.user)
  const user = computed(() => effectiveSession.value?.user || null)

  // Update offline cache when session changes
  if (isCapacitor) {
    watch(() => session.value.data, (data) => {
      if (data?.user) {
        offlineSession.value = data
      }
    }, { immediate: true })
  }

  // Sentry integration
  if (config.public.abckit?.sentry) {
    watch(user, async (currentUser) => {
      const Sentry = await import('@sentry/nuxt')
      Sentry.setUser(currentUser ? { id: currentUser.id } : null)
    }, { immediate: true })
  }

  async function logout(options: { skipNavigation?: boolean } = {}) {
    await client.signOut()
    // Clear offline session
    offlineSession.value = null
    if (options.skipNavigation)
      return
    navigateTo('/')
  }

  async function refreshSession() {
    return await client.getSession({ fetchOptions: { cache: 'no-store' } })
  }

  return {
    session,
    isLoading,
    isAuthenticated,
    user,
    logout,
    refreshSession,
    authClient: client,
  }
}

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

import type { Ref } from 'vue'
import { defineNuxtPlugin, useRuntimeConfig } from '#app'
// useUserSession is provided by @onmax/nuxt-better-auth
// @ts-expect-error - types are provided by consumer's nuxt-better-auth installation
import { useUserSession } from '#imports'

import { watch } from 'vue'

interface UserSessionResult {
  user: Ref<{ id: string } | null>
}

/**
 * Sentry user tracking plugin
 * Sets user context in Sentry when authenticated
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Only run if Sentry is enabled
  if (!config.public.abckit?.sentry)
    return

  const { user } = useUserSession() as UserSessionResult

  watch(user, async (currentUser) => {
    const Sentry = await import('@sentry/nuxt')
    Sentry.setUser(currentUser ? { id: currentUser.id } : null)
  }, { immediate: true })
})

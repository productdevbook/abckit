import { defineNuxtRouteMiddleware } from '#app'
import { useAppRouter } from '../composables/useAppRouter'
import { useAuth } from '../composables/useAuth'

/**
 * Auth middleware - protects routes from unauthenticated access
 * Usage: definePageMeta({ middleware: 'auth' })
 */
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server)
    return

  const { isAuthenticated, isLoading } = useAuth()

  // Wait for auth to initialize
  if (isLoading.value)
    return

  // Redirect to login if not authenticated
  if (!isAuthenticated.value) {
    const { replace } = useAppRouter()
    replace(`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`)
    return false
  }
})

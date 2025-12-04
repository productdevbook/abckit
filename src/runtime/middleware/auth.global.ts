import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuth } from '../composables/useAuth'

/**
 * Global auth middleware for Better Auth
 * - Redirects pending approval users to /auth/pending
 * - Redirects banned users to /auth/banned
 * Note: Route protection is handled by layouts, not this middleware
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Skip on server
  if (import.meta.server) {
    return
  }

  const { isAuthenticated, isLoading, user } = useAuth()

  // Skip auth pages (except pending/banned which need user status check)
  if (to.path.startsWith('/auth/') && to.path !== '/auth/pending' && to.path !== '/auth/banned') {
    return
  }

  // Wait for session to load
  if (isLoading.value) {
    return
  }

  // If authenticated, check user status (pending/banned)
  if (isAuthenticated.value && user.value) {
    const userData = user.value as any
    const isBanned = userData.banned === true
    const isPendingApproval = isBanned && userData.banReason === 'pending approval'

    // Pending approval - redirect to pending page
    if (isPendingApproval && to.path !== '/auth/pending') {
      return navigateTo('/auth/pending')
    }

    // Actually banned - redirect to banned page
    if (isBanned && !isPendingApproval && to.path !== '/auth/banned') {
      return navigateTo('/auth/banned')
    }

    // If approved and on pending/banned page, redirect to home
    if (!isBanned && (to.path === '/auth/pending' || to.path === '/auth/banned')) {
      return navigateTo('/')
    }
  }
})

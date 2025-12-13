import type { UseIonRouterResult } from '@ionic/vue'
import type { RouteLocationRaw } from 'vue-router'
import { navigateTo, useRouter, useRuntimeConfig } from '#app'

// Global registry for Ionic router (set by app)
let _ionRouter: UseIonRouterResult | null = null

/**
 * Register Ionic router for mobile navigation
 * Call this in app.vue or a plugin: setIonRouter(useIonRouter())
 */
export function setIonRouter(router: UseIonRouterResult) {
  _ionRouter = router
}

/**
 * Platform-aware router composable
 * Uses Ionic router on mobile (if registered), Nuxt router on web
 */
export function useAppRouter() {
  const config = useRuntimeConfig()
  const isMobile = config.public.abckit?.auth?.capacitor ?? false
  const vueRouter = useRouter()

  function push(to: RouteLocationRaw) {
    const path = typeof to === 'string' ? to : (to as { path?: string }).path || '/'
    if (isMobile && _ionRouter) {
      _ionRouter.push(path)
    }
    else {
      navigateTo(to)
    }
  }

  function replace(to: RouteLocationRaw) {
    const path = typeof to === 'string' ? to : (to as { path?: string }).path || '/'
    if (isMobile && _ionRouter) {
      _ionRouter.navigate(path, 'forward', 'replace')
    }
    else {
      navigateTo(to, { replace: true })
    }
  }

  function back() {
    if (isMobile && _ionRouter) {
      _ionRouter.back()
    }
    else {
      vueRouter.back()
    }
  }

  function canGoBack(): boolean {
    if (isMobile && _ionRouter) {
      return _ionRouter.canGoBack()
    }
    return true
  }

  return {
    push,
    replace,
    back,
    canGoBack,
    isMobile,
  }
}

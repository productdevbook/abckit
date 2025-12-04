import type { NuxtLinkProps } from 'nuxt/app'
import type { MaybeRefOrGetter, Ref } from 'vue'
import type { RouteMeta } from 'vue-router'
import { defu } from 'defu'
import { useNuxtApp, useRoute, useRouter, useState } from 'nuxt/app'
import { hasTrailingSlash, parseURL, stringifyParsedURL, withoutTrailingSlash, withTrailingSlash } from 'ufo'
import {
  computed,
  getCurrentInstance,
  inject,
  onScopeDispose,
  onUnmounted,
  provide,
  ref,
  toRaw,
  toValue,
  watch,
} from 'vue'

// ============================================================================
// TYPES
// ============================================================================

interface NuxtUIBreadcrumbItem extends NuxtLinkProps {
  label: string
  labelClass?: string
  icon?: string
  iconClass?: string
  as?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  active?: boolean
  exact?: boolean
  exactQuery?: boolean
  exactMatch?: boolean
  inactiveClass?: string
  [key: string]: any
}

export interface BreadcrumbItemProps extends NuxtUIBreadcrumbItem {
  current?: boolean
  ariaCurrent?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean | 'true' | 'false'
  to?: string
  ariaLabel?: string
  separator?: boolean | string
  class?: (string | string[] | undefined)[] | string
  _props?: {
    first: boolean
    last: boolean
  }
}

export interface BreadcrumbProps {
  path?: MaybeRefOrGetter<string>
  id?: string
  append?: MaybeRefOrGetter<BreadcrumbItemProps[]>
  prepend?: MaybeRefOrGetter<BreadcrumbItemProps[]>
  overrides?: MaybeRefOrGetter<(BreadcrumbItemProps | false | undefined)[]>
  ariaLabel?: string
  hideCurrent?: MaybeRefOrGetter<boolean>
  hideRoot?: MaybeRefOrGetter<boolean>
  hideNonExisting?: MaybeRefOrGetter<boolean>
  rootSegment?: string
  trailingSlash?: boolean
}

export type ResolvedBreadcrumbProps = {
  [key in keyof BreadcrumbProps]: BreadcrumbProps[key] extends MaybeRefOrGetter<infer T> ? T : BreadcrumbProps[key]
}

// ============================================================================
// UTILITIES
// ============================================================================

const fileExtensions = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'bmp',
  'webp',
  'svg',
  'ico',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'md',
  'zip',
  'rar',
  '7z',
  'tar',
  'gz',
  'mp3',
  'wav',
  'flac',
  'ogg',
  'mp4',
  'avi',
  'mkv',
  'mov',
  'html',
  'css',
  'js',
  'json',
  'xml',
  'tsx',
  'jsx',
  'ts',
  'vue',
]

export function isPathFile(path: string): boolean {
  const lastSegment = path.split('/').pop()
  const ext = ((lastSegment || path).match(/\.[0-9a-z]+$/i)?.[0])
  return ext ? fileExtensions.includes(ext.replace('.', '')) : false
}

export function fixSlashes(trailingSlash: boolean | undefined, pathOrUrl: string): string {
  const $url = parseURL(pathOrUrl)
  if (isPathFile($url.pathname))
    return pathOrUrl

  const fixedPath = trailingSlash ? withTrailingSlash($url.pathname) : withoutTrailingSlash($url.pathname)
  return `${$url.protocol ? `${$url.protocol}//` : ''}${$url.host || ''}${fixedPath}${$url.search || ''}${$url.hash || ''}`
}

export function pathBreadcrumbSegments(path: string, rootNode: string = '/'): string[] {
  const startNode = parseURL(path)
  const appendsTrailingSlash = hasTrailingSlash(startNode.pathname)

  const stepNode = (node: ReturnType<typeof parseURL>, nodes: string[] = []): string[] => {
    const fullPath = stringifyParsedURL(node)
    const currentPathName = node.pathname || '/'
    nodes.push(fullPath || '/')

    if (currentPathName !== rootNode && currentPathName !== '/') {
      node.pathname = currentPathName.substring(0, currentPathName.lastIndexOf('/'))
      if (appendsTrailingSlash)
        node.pathname = withTrailingSlash(node.pathname.substring(0, node.pathname.lastIndexOf('/')))
      stepNode(node, nodes)
    }
    return nodes
  }

  return stepNode(startNode).reverse()
}

function withoutQuery(path: string): string {
  return path.split('?')[0] ?? ''
}

function titleCase(s: string): string {
  return s
    .replaceAll('-', ' ')
    .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase())
}

// ============================================================================
// COMPOSABLE
// ============================================================================

const BreadcrumbCtx = Symbol('BreadcrumbCtx')

/**
 * Generate an automatic breadcrumb list that helps users to navigate between pages.
 * Supports hierarchical overrides and integrates with Nuxt I18n (optional).
 */
export function useBreadcrumbItems(_options: BreadcrumbProps = {}) {
  const nuxtApp = useNuxtApp()
  const vm = getCurrentInstance()
  const id = `${_options.id || 'breadcrumb'}`
  const uid = `${vm?.uid || 0}`

  // Build parent chain for hierarchical context
  const parentChain: number[] = []
  let parent = vm?.parent
  while (parent) {
    parentChain.push(parent.uid || 0)
    parent = parent.parent
  }

  // Pause updates during hydration/navigation
  const pauseUpdates = ref(import.meta.client && nuxtApp.isHydrating)
  let stateRef: Ref<Record<string, BreadcrumbProps>> | null = null

  // Setup context and lifecycle
  if (vm) {
    stateRef = inject(BreadcrumbCtx, null)
    if (!stateRef) {
      stateRef = ref({})
      provide(BreadcrumbCtx, stateRef)
    }

    const state = stateRef.value
    state[uid] = _options
    stateRef.value = state

    onUnmounted(() => {
      const state = toRaw(stateRef!.value)
      delete state[uid]
      stateRef!.value = state
    })

    if (import.meta.client) {
      const hooks: any[] = []
      hooks.push(nuxtApp.hooks.hook('page:start', () => {
        pauseUpdates.value = true
      }))
      hooks.push(nuxtApp.hooks.hook('page:finish', () => {
        if (!nuxtApp.isHydrating)
          pauseUpdates.value = false
      }))
      hooks.push(nuxtApp.hooks.hook('app:error', () => {
        pauseUpdates.value = false
      }))
      hooks.push(nuxtApp.hooks.hook('app:suspense:resolve', () => {
        pauseUpdates.value = false
      }))

      onScopeDispose(() => {
        hooks.forEach(hook => hook?.())
        hooks.length = 0
      })
    }
  }

  const route = useRoute()
  const router = useRouter()

  // I18n is OPTIONAL - check if available
  const hasI18n = !!nuxtApp.$i18n
  const i18n = hasI18n ? (nuxtApp.$i18n as any) : null

  const lastBreadcrumbs = useState<BreadcrumbItemProps[]>(`breadcrumb:${id}`, () => [])

  const items = computed(() => {
    if (import.meta.client && pauseUpdates.value) {
      return lastBreadcrumbs.value
    }

    // Merge options from parent chain
    const state = toValue(stateRef) || {}
    const optionStack = [...parentChain, uid]
      .map(parentId => state[parentId])
      .filter(Boolean) as BreadcrumbProps[]

    const flatOptions = optionStack.reduce((acc, _cur) => {
      const cur: typeof _cur = {}
      Object.entries(_cur).forEach(([key, value]) => {
        cur[key as keyof typeof cur] = toValue(value)
      })

      acc.hideRoot = cur.hideRoot ?? acc.hideRoot
      acc.hideCurrent = cur.hideCurrent ?? acc.hideCurrent
      acc.hideNonExisting = cur.hideNonExisting ?? acc.hideNonExisting
      acc.trailingSlash = cur.trailingSlash ?? acc.trailingSlash
      acc.rootSegment = acc.rootSegment || cur.rootSegment
      acc.path = acc.path || cur.path
      acc.overrides = acc.overrides || []

      const overrides = toRaw(toValue(cur.overrides))
      if (overrides) {
        overrides.forEach((item, index) => {
          if (item !== undefined) {
            acc.overrides![index] = toRaw(toValue(item)) as any
          }
        })
      }

      const prepend = toRaw(toValue(cur.prepend))
      const append = toRaw(toValue(cur.append))
      if (prepend?.length) {
        acc.prepend = [...(acc.prepend || []), ...prepend.map(m => toRaw(toValue(m)))].filter(Boolean)
      }
      if (append?.length) {
        acc.append = [...(acc.append || []), ...append.map(m => toRaw(toValue(m)))].filter(Boolean)
      }

      return acc
    }, {} as any) as Required<ResolvedBreadcrumbProps>

    // Determine root node (with i18n support)
    let rootNode = flatOptions.rootSegment || '/'
    if (i18n?.strategy) {
      const strategy = toValue(i18n.strategy)
      const locale = toValue(i18n.locale)
      const defaultLocale = toValue(i18n.defaultLocale)
      if (strategy === 'prefix' || (strategy !== 'no_prefix' && defaultLocale !== locale)) {
        rootNode = `${rootNode}${locale}`
      }
    }

    const current = withoutQuery(withoutTrailingSlash(flatOptions.path || toRaw(route)?.path || rootNode)) || ''

    // Generate segments with overrides
    const segments = pathBreadcrumbSegments(current, rootNode)
      .map((path, index) => {
        const override = flatOptions.overrides?.[index]
        if (override === false)
          return false

        return {
          to: path,
          _index: index,
          _override: override,
        } as BreadcrumbItemProps & { _index: number, _override: any }
      })

    segments.unshift(...((flatOptions.prepend || []) as any[]))
    segments.push(...((flatOptions.append || []) as any[]))

    // Apply metadata and labels with CORRECT PRIORITY ORDER
    return (segments.filter(Boolean) as BreadcrumbItemProps[])
      .map((item) => {
        const resolvedRoute = item.to ? router.resolve(item.to as string)?.matched?.at(-1) : null

        // Priority 1 (Lowest): Generate auto label
        let autoLabel = titleCase(String((item.to || '').split('/').pop()))
        let autoAriaLabel = ''

        if (resolvedRoute) {
          const routeMeta = (resolvedRoute?.meta || {}) as RouteMeta & {
            title?: string
            breadcrumbLabel?: string
            breadcrumbTitle?: string
            breadcrumb?: BreadcrumbItemProps
          }

          const routeName = String(resolvedRoute.name).split('___')?.[0]
          if (routeName === 'index')
            autoLabel = 'Home'

          autoLabel = routeMeta.breadcrumbLabel || routeMeta.breadcrumbTitle || routeMeta.title || autoLabel

          // Apply i18n if available
          if (i18n?.t) {
            try {
              autoLabel = i18n.t(`breadcrumb.items.${routeName}.label`, autoLabel, { missingWarn: false })
              autoAriaLabel = i18n.t(`breadcrumb.items.${routeName}.ariaLabel`, autoAriaLabel, { missingWarn: false })
            }
            catch {
              // Ignore i18n errors
            }
          }

          // Priority 2 (Medium): Apply route meta breadcrumb from definePageMeta
          // This merges { to } with routeMeta.breadcrumb, routeMeta takes priority for its fields
          if (routeMeta.breadcrumb) {
            item = defu(routeMeta.breadcrumb, { to: item.to }) as BreadcrumbItemProps
          }
        }
        else if (flatOptions.hideNonExisting) {
          return false
        }

        // Priority 3 (Highest): Apply manual overrides from useBreadcrumbItems
        // Override takes highest priority for its fields
        const override = (item as any)._override
        if (override) {
          item = defu(override, item)
        }

        // Clean up internal properties
        delete (item as any)._index
        delete (item as any)._override

        // Fill missing labels with auto-generated values (lowest priority)
        item.label = item.label || autoLabel
        item.ariaLabel = item.ariaLabel || autoAriaLabel || item.label
        item.current = item.current || item.to === current

        if (flatOptions.hideCurrent && item.current)
          return false

        return item
      })
      .map((m) => {
        if (m && m.to) {
          m.to = fixSlashes(flatOptions.trailingSlash, m.to)
          if (m.to === rootNode && flatOptions.hideRoot)
            return false
        }
        return m
      })
      .filter(Boolean) as BreadcrumbItemProps[]
  })

  watch(items, (newItems) => {
    if (!pauseUpdates.value) {
      lastBreadcrumbs.value = newItems
    }
  }, { immediate: true, flush: 'sync' })

  return items
}

export function defineBreadcrumb() {
  // Placeholder for schema.org integration if needed
}

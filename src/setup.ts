import type { Nuxt } from '@nuxt/schema'
import type { ModuleOptions } from './types'
import { join } from 'node:path'
import { addRouteMiddleware, addServerScanDir, addTypeTemplate, updateRuntimeConfig } from '@nuxt/kit'
import { defu } from 'defu'
import {
  ALIAS_PATHS,
  APP_HEAD_LINKS,
  CAPACITOR_EXTERNAL_PACKAGES,
  H3_TYPE_TEMPLATE,
  IMGPROXY_DEFAULTS,
  NPM_TS_PATHS,
  VITE_EXCLUDE_PACKAGES,
} from './constants'
import { isMobileBuild, mobileBaseURL } from './utils/mobile'

type Resolver = (path: string) => string

export async function setupRuntimeConfig(nuxt: Nuxt, options: ModuleOptions, isSentryEnabled: boolean): Promise<void> {
  // Public abckit config
  nuxt.options.runtimeConfig.public.abckit = {
    sentry: isSentryEnabled,
    auth: {
      baseURL: isMobileBuild ? mobileBaseURL : (nuxt.options.runtimeConfig.public.abckit?.auth?.baseURL ?? options.auth?.baseURL),
      basePath: nuxt.options.runtimeConfig.public.abckit?.auth?.basePath ?? options.auth?.basePath,
      capacitor: isMobileBuild,
      oauthProvider: options.auth?.oauthProvider ?? false,
    },
  }

  // Server runtime configs
  nuxt.options.runtimeConfig.imgproxy = defu(nuxt.options.runtimeConfig.imgproxy, IMGPROXY_DEFAULTS)
  nuxt.options.runtimeConfig.modules = defu(nuxt.options.runtimeConfig.modules, {
    s3: options.modules?.s3 ?? false,
    redis: options.modules?.redis ?? false,
    disk: options.modules?.disk ?? false,
  })

  await updateRuntimeConfig({
    modules: {
      s3: options.modules?.s3 ?? false,
      redis: options.modules?.redis ?? false,
      disk: options.modules?.disk ?? false,
    },
  })

  // Public runtime config
  nuxt.options.runtimeConfig.public = defu(nuxt.options.runtimeConfig.public, {
    siteUrl: isMobileBuild ? mobileBaseURL : 'http://localhost:3000',
    isMobile: isMobileBuild,
    debug: nuxt.options.dev,
    imgproxy: IMGPROXY_DEFAULTS,
  })
}

export function setupAppHead(nuxt: Nuxt): void {
  const siteUrl = nuxt.options.runtimeConfig.public.siteUrl as string
  const appName = nuxt.options.app.head?.title as string || 'abckit'

  nuxt.options.app.head = defu(nuxt.options.app.head, {
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no' },
      { name: 'author', content: appName },
      { name: 'robots', content: 'index, follow' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: appName },
      { property: 'og:image', content: `${siteUrl}/og-image.png` },
      { property: 'og:url', content: siteUrl },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', content: `${siteUrl}/og-image.png` },
      { name: 'apple-mobile-web-app-title', content: appName },
    ],
    link: [
      ...APP_HEAD_LINKS,
      ...(isMobileBuild ? [] : [{ rel: 'manifest', href: '/site.webmanifest' }]),
    ],
  })
}

export async function setupCSS(nuxt: Nuxt, resolve: Resolver): Promise<void> {
  nuxt.options.css = nuxt.options.css || []

  const { existsSync } = await import('node:fs')
  const appTailwindPath = join(nuxt.options.rootDir, 'app/assets/css/tailwind.css')

  if (existsSync(appTailwindPath)) {
    nuxt.options.css.push(appTailwindPath)
  }
  else {
    nuxt.options.css.push(resolve('./runtime/assets/css/tailwind.css'))
  }

  nuxt.options.css.push('notivue/notification.css', 'notivue/animations.css')
}

export function setupNitro(nuxt: Nuxt, resolve: Resolver, isGraphqlEnabled: boolean): void {
  nuxt.options.nitro.experimental = defu(nuxt.options.nitro.experimental, {
    tasks: true,
    asyncContext: true,
  })

  nuxt.options.nitro.builder = 'rolldown'

  if (isGraphqlEnabled) {
    // nuxt.options.nitro.modules = nuxt.options.nitro.modules || []
    // nuxt.options.nitro.modules.push('nitro-graphql')

    // TODO: dont support nitro graphql yet
    // nuxt.options.nitro.graphql = defu(nuxt.options.nitro.graphql, {
    //   framework: 'graphql-yoga',
    //   codegen: {
    //     server: { scalars: GRAPHQL_SCALARS },
    //     client: { scalars: GRAPHQL_SCALARS },
    //   },
    //   scaffold: false,
    // } satisfies typeof nuxt.options.nitro.graphql as NitroGraphQLOptions)
  }

  // Ionic config
  nuxt.options.ionic = defu(nuxt.options.ionic, {
    integrations: { icons: false },
    css: { basic: false, core: true, utilities: false },
  })

  // Public assets
  nuxt.options.nitro.publicAssets = nuxt.options.nitro.publicAssets || []
  nuxt.options.nitro.publicAssets.push({
    dir: resolve('./runtime/public'),
    baseURL: '/',
    maxAge: 0,
  })
}

export function setupVite(nuxt: Nuxt): void {
  nuxt.options.vite.define = defu(nuxt.options.vite.define, {
    'import.meta.env.VITE_MOBILE_BUILD': JSON.stringify(isMobileBuild ? 'true' : 'false'),
  })

  nuxt.options.vite.optimizeDeps = nuxt.options.vite.optimizeDeps || {}
  nuxt.options.vite.optimizeDeps.exclude = nuxt.options.vite.optimizeDeps.exclude || []

  const excludeSet = new Set(nuxt.options.vite.optimizeDeps.exclude)
  VITE_EXCLUDE_PACKAGES.forEach(pkg => excludeSet.add(pkg))
  nuxt.options.vite.optimizeDeps.exclude = Array.from(excludeSet)

  // Mark Capacitor packages as external (optional dependencies)
  // This prevents build errors when consuming projects don't have Capacitor installed
  nuxt.options.vite.build = nuxt.options.vite.build || {}
  nuxt.options.vite.build.rollupOptions = nuxt.options.vite.build.rollupOptions || {}
  const existingExternal = nuxt.options.vite.build.rollupOptions.external
  const externalSet = new Set<string>(
    Array.isArray(existingExternal) ? existingExternal.filter((e): e is string => typeof e === 'string') : [],
  )
  CAPACITOR_EXTERNAL_PACKAGES.forEach(pkg => externalSet.add(pkg))
  nuxt.options.vite.build.rollupOptions.external = Array.from(externalSet)

  // Development mode
  if (nuxt.options.dev) {
    nuxt.options.vite.server = nuxt.options.vite.server || {}
    nuxt.options.vite.server.allowedHosts = true
  }
}

export function setupAliases(nuxt: Nuxt, resolve: Resolver): void {
  for (const [alias, path] of Object.entries(ALIAS_PATHS)) {
    nuxt.options.alias[alias] = resolve(path)
  }
}

export function setupTypeScript(nuxt: Nuxt): void {
  nuxt.options.typescript = defu(nuxt.options.typescript, {
    tsConfig: {
      compilerOptions: {
        allowArbitraryExtensions: true,
        types: ['@pinia/colada-plugin-auto-refetch'],
      },
    },
  })

  // NPM mode paths
  if (nuxt.options.abckit?.npm) {
    nuxt.options.typescript.tsConfig.compilerOptions ??= {}
    nuxt.options.typescript.tsConfig.compilerOptions.paths ??= {}
    Object.assign(nuxt.options.typescript.tsConfig.compilerOptions.paths, NPM_TS_PATHS)
  }
}

export function setupColorMode(nuxt: Nuxt): void {
  nuxt.options.colorMode = defu(nuxt.options.colorMode, {
    classSuffix: '',
    fallback: 'light',
    storageKey: 'color-mode',
    preference: 'light',
  } as Partial<typeof nuxt.options.colorMode>)
}

export function setupRouting(nuxt: Nuxt, resolve: Resolver): void {
  // Server scan
  addServerScanDir(resolve('./runtime/server'))

  // Auth middleware
  addRouteMiddleware({
    name: 'auth',
    path: resolve('./runtime/middleware/auth'),
  })

  // Route rules
  nuxt.options.routeRules = nuxt.options.routeRules || {}
  nuxt.options.routeRules['/**'] = defu(nuxt.options.routeRules['/**'] || {}, { ssr: false })
  nuxt.options.routeRules['/'] = defu(nuxt.options.routeRules['/'] || {}, { ssr: true })
}

export function setupTypes(): void {
  addTypeTemplate({
    filename: 'types/nuxt-shared-h3.d.ts',
    getContents: () => H3_TYPE_TEMPLATE,
  }, { nitro: true })
}

export function setupHooks(nuxt: Nuxt, resolve: Resolver): void {
  // Error page
  nuxt.hook('app:resolve', (app) => {
    app.errorComponent = resolve('./runtime/error.vue')
  })

  // Tailwind sources
  nuxt.hook('tailwindcss:sources:extend' as any, (sources: any[]) => {
    sources.push({
      source: `${resolve('./runtime/components')}`,
      type: 'path',
    })
  })
}

export function setupDevtools(nuxt: Nuxt): void {
  nuxt.options.devtools = defu(nuxt.options.devtools, {
    enabled: false,
  } satisfies typeof nuxt.options.devtools)
}

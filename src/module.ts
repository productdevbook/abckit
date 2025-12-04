import type { NitroGraphQLOptions } from 'nitro-graphql'
import type { BreadcrumbItemProps } from './runtime/composables/useBreadcrumbItems'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { addComponentExports, addComponentsDir, addImportsDir, addRouteMiddleware, addServerScanDir, addTypeTemplate, createResolver, defineNuxtModule, resolvePath } from '@nuxt/kit'
import { defu } from 'defu'

export interface BreadcrumbsConfig {
  breadcrumbs?: {
    homeLabel?: string
    homeIcon?: string
    overrides?: (false | BreadcrumbItemProps | undefined)[]
    getBaseUrl?: (organizationId: string | null, projectId: string | null) => string
  }
}

export interface SetupConfig {
  setup?: {
    title?: string
    description?: string
    requiredModule?: string
    branding?: {
      logo?: string // URL or icon name
      appName?: string
      moduleName?: string
      moduleDescription?: string
      features?: {
        icon: string
        title: string
        description: string
      }[]
    }
  }
}

declare module 'nuxt/schema' {
  interface AppConfig extends BreadcrumbsConfig, SetupConfig { }
}
declare module '@nuxt/schema' {
  interface AppConfig extends BreadcrumbsConfig, SetupConfig { }
}

export default defineNuxtModule({
  meta: {
    name: 'nuxtShared',
    configKey: 'nuxtShared',
    version: '0.0.1',
  },
  moduleDependencies: {
    '@nuxtjs/tailwindcss': {},
    'notivue/nuxt': {},
    '@nuxt/icon': {},
    '@pinia/colada-nuxt': {},
    '@nuxtjs/color-mode': {},
    '@vueuse/nuxt': {},
    '@pinia/nuxt': {},
    '@vee-validate/nuxt': {},
    'nitro-graphql/nuxt': {},
  },
  async setup(_options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    nuxt.options.runtimeConfig.dragonfly = defu(nuxt.options.runtimeConfig.dragonfly, {
      host: 'dragonfly',
      port: Number.parseInt('6379', 10),
      password: '',
    })

    nuxt.options.runtimeConfig.s3 = defu(nuxt.options.runtimeConfig.s3, {
      accessKeyId: '',
      secretAccessKey: '',
      endpoint: '',
      bucket: '',
      region: 'auto',
      publicUrl: '',
    })

    nuxt.options.runtimeConfig.polar = defu(nuxt.options.runtimeConfig.polar, {
      accessToken: '',
      checkoutSuccessUrl: '/checkout/success',
      server: 'sandbox',
      webhookSecret: '',
    })

    nuxt.options.runtimeConfig.imgproxy = defu(nuxt.options.runtimeConfig.imgproxy, {
      storageUrl: '',
      cdnDomains: [] as string[],
    })

    nuxt.options.runtimeConfig.storage = defu(nuxt.options.runtimeConfig.storage, {
      redis: false,
      s3: false,
      disk: false,
    })

    // Merge runtime config - Public (client + server)
    nuxt.options.runtimeConfig.public = defu(nuxt.options.runtimeConfig.public, {
      siteUrl: 'http://localhost:3000',
      debug: nuxt.options.dev,
      imgproxy: {
        storageUrl: '',
        cdnDomains: [] as string[],
      },
    })

    // Add type declarations for H3 event context (server-side)
    addTypeTemplate({
      filename: 'types/nuxt-shared-h3.d.ts',
      getContents: () => `
declare module 'h3' {
  interface H3EventContext {
    /**
     * Better Auth session
     * Check auth?.user in protected routes
     */
    auth: {
      user: {
        id: string
        name: string
        email: string
        emailVerified: boolean
        image?: string
        createdAt: Date
        updatedAt: Date
        role: string
      }
      session: {
        id: string
        userId: string
        expiresAt: Date
        token: string
        createdAt: Date
        updatedAt: Date
        ipAddress?: string
        userAgent?: string
      }
    }

    /**
     * Authorization error (set by auth middleware, thrown by API routes)
     */
    authError?: {
      statusCode: number
      statusMessage: string
    }

    /**
     * Premium subscription status
     *
     * @example
     * if (!event.context.isPremium) {
     *   throw createError({ statusCode: 403, message: 'Premium subscription required' })
     * }
     */
    isPremium: boolean

    /**
     * Full subscription data (if available)
     */
    subscription: any | null
  }
}

export {}
`,
    }, { nitro: true })

    // Register error page
    nuxt.hook('app:resolve', (app) => {
      app.errorComponent = resolve('./runtime/error.vue')
    })

    // Register CSS files
    nuxt.options.css = nuxt.options.css || []

    // Check if app/assets/css/tailwind.css exists in the consuming project
    const { existsSync } = await import('node:fs')
    const appTailwindPath = join(nuxt.options.rootDir, 'app/assets/css/tailwind.css')

    if (existsSync(appTailwindPath)) {
      // Use the project's tailwind.css if it exists
      nuxt.options.css.push(appTailwindPath)
    }
    else {
      // Fallback to module's tailwind.css
      nuxt.options.css.push(resolve('./runtime/assets/css/tailwind.css'))
    }

    // Add notivue CSS
    nuxt.options.css.push(
      'notivue/notification.css',
      'notivue/animations.css',
    )

    nuxt.options.nitro.modules = nuxt.options.nitro.modules || []
    nuxt.options.nitro.modules.push('nitro-graphql')

    nuxt.options.nitro.experimental = defu(nuxt.options.nitro.experimental, {
      tasks: true,
      asyncContext: true,
    })

    nuxt.options.nitro.esbuild = defu(nuxt.options.nitro.esbuild, {
      options: {
        target: 'esnext',
      },
    })

    nuxt.options.nitro.graphql = defu(nuxt.options.nitro.graphql, {
      framework: 'graphql-yoga',
      codegen: {
        server: {
          scalars: {
            Timestamp: 'string',
            File: 'File',
            Decimal: 'string',
          },
        },
        client: {
          scalars: {
            Timestamp: 'string',
            File: 'File',
            Decimal: 'string',
          },
        },
      },
      scaffold: false,
    } as typeof nuxt.options.nitro.graphql as NitroGraphQLOptions)

    // Register public directory for static files (silent-check-sso.html, etc.)
    nuxt.options.nitro.publicAssets = nuxt.options.nitro.publicAssets || []
    nuxt.options.nitro.publicAssets.push({
      dir: resolve('./runtime/public'),
      baseURL: '/',
      maxAge: 0,
    })

    const componentDir = resolve('./runtime/components/ui')

    nuxt.hook('tailwindcss:sources:extend', (sources) => {
      sources.push({
        source: `${resolve('./runtime/components')}`,
        type: 'path',
      })
    })

    // development mode
    if (nuxt.options.dev) {
      nuxt.options.vite.server = nuxt.options.vite.server || {}
      nuxt.options.vite.server.allowedHosts = true
    }

    nuxt.options.alias['abckit/runtime'] = resolve('./runtime')
    nuxt.options.alias['abckit/server/utils'] = resolve('./runtime/server/utils')
    nuxt.options.alias['abckit/components'] = resolve('./runtime/components')
    nuxt.options.alias['abckit/shadcn'] = resolve('./runtime/components/ui')
    nuxt.options.alias['abckit/composables'] = resolve('./runtime/composables')
    nuxt.options.alias['abckit/graphql'] = resolve('./runtime/graphql')
    nuxt.options.alias['abckit/stores'] = resolve('./runtime/stores')
    nuxt.options.alias['abckit/utils'] = resolve('./runtime/utils')
    nuxt.options.alias['abckit/types/client'] = resolve('./runtime/types/nitro-graphql-client')
    nuxt.options.alias['abckit/shared'] = resolve('./runtime/shared')

    nuxt.options.vite.optimizeDeps = nuxt.options.vite.optimizeDeps || {}
    nuxt.options.vite.optimizeDeps.exclude = nuxt.options.vite.optimizeDeps.exclude || []

    const excludeSet = new Set(nuxt.options.vite.optimizeDeps.exclude)
    excludeSet.add('abckit')
    excludeSet.add('shadcn-nuxt')
    excludeSet.add('@vue/devtools-core')
    excludeSet.add('@vue/devtools-kit')
    excludeSet.add('notivue')
    excludeSet.add('zod')
    excludeSet.add('date-fns')
    excludeSet.add('date-fns/locale')
    excludeSet.add('lucide-vue-next')
    excludeSet.add('class-variance-authority')
    excludeSet.add('reka-ui')
    excludeSet.add('clsx')
    excludeSet.add('tailwind-merge')
    excludeSet.add('@sindresorhus/slugify')
    excludeSet.add('better-auth')
    nuxt.options.vite.optimizeDeps.exclude = Array.from(excludeSet)

    // Configure TypeScript
    nuxt.options.typescript = defu(nuxt.options.typescript, {
      tsConfig: {
        compilerOptions: {
          allowArbitraryExtensions: true,
        },
      },
    })

    // Configure color mode
    nuxt.options.colorMode = {
      classSuffix: '',
      fallback: 'light',
      storageKey: 'abckit-color-mode',
      preference: 'light',
      hid: 'nuxt-color-mode-script',
    } as unknown as typeof nuxt.options.colorMode

    // Register composables auto-imports
    addImportsDir(resolve('./runtime/composables'))

    // Register shared directory auto-imports (Nuxt 4 feature)
    // addImportsDir(resolve('./runtime/shared/utils'))
    // addImportsDir(resolve('./runtime/shared/types'))

    // Register server utils auto-imports
    // addServerImportsDir(resolve('./runtime/server/utils'))

    // Register shared directory for server-side (Nuxt 4 feature)
    // addServerImportsDir(resolve('./runtime/shared/utils'))
    // addServerImportsDir(resolve('./runtime/shared/types'))

    // Register server directory (auto-scans middleware, api, etc.)
    addServerScanDir(resolve('./runtime/server'))

    // Register auth layout
    // addLayout({
    //   src: resolve('./runtime/layouts/auth.vue'),
    //   filename: 'auth.vue',
    // })

    // Register setup page
    // extendPages((pages) => {
    //   pages.push({
    //     name: 'setup',
    //     path: '/setup',
    //     file: resolve('./runtime/pages/setup.vue'),
    //   })
    // })

    // Register global auth middleware (handles banned/pending users)
    addRouteMiddleware({
      name: 'auth-status',
      path: resolve('./runtime/middleware/auth.global'),
      global: true,
    })

    addComponentsDir({
      path: componentDir,
      extensions: [],
      ignore: ['**/*'],
    }, {
      prepend: true,
    })

    try {
      await Promise.all(readdirSync(componentDir).map(async (dir) => {
        try {
          const filePath = await resolvePath(join(componentDir, dir, 'index'), { extensions: ['.ts', '.js'] })

          addComponentExports({
            prefix: '',
            filePath: resolve(filePath),
            priority: 1,
          })
        }
        catch (err) {
          if (err instanceof Error)
            console.warn('Module error: ', err.message)
        }
      }))
    }
    catch (err) {
      if (err instanceof Error)
        console.warn(err.message)
    }
  },
})

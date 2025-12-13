import type { NitroGraphQLOptions } from 'nitro-graphql'
import type { BreadcrumbItemProps } from './runtime/composables/useBreadcrumbItems'
import { join } from 'node:path'
import { addRouteMiddleware, addServerScanDir, addTypeTemplate, createResolver, defineNuxtModule } from '@nuxt/kit'
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

export interface AuthClientOptions {
  /**
   * Base URL for Better Auth client
   * Required for Capacitor/mobile apps where the default URL is not http/https
   * @example 'https://api.example.com'
   */
  baseURL?: string

  /**
   * Base path for Better Auth API endpoints
   * @default '/api/auth'
   */
  basePath?: string

  /**
   * Enable Capacitor mode for mobile apps
   * When enabled, uses Bearer token auth with @capacitor/preferences storage
   * @default false
   */
  capacitor?: boolean
}

export interface ModuleOptions {
  /**
   * Enable Sentry user tracking in useAuth composable
   * @default false
   */
  sentry?: boolean

  /**
   * Better Auth client configuration
   */
  auth?: AuthClientOptions
}

declare module 'nuxt/schema' {
  interface AppConfig extends BreadcrumbsConfig, SetupConfig { }

  interface RuntimeConfig {
    dragonfly: {
      host: string
      port: number
      password: string
      url?: string
    }
    s3: {
      accessKeyId: string
      secretAccessKey: string
      endpoint: string
      bucket: string
      region: string
      publicUrl: string
    }
    polar: {
      accessToken: string
      checkoutSuccessUrl: string
      server: 'live' | 'sandbox'
      webhookSecret: string
    }
    imgproxy: {
      storageUrl: string
      cdnDomains: string[]
    }
    storage: {
      redis: boolean
      s3: boolean
      disk: boolean
    }
  }

  interface PublicRuntimeConfig {
    siteUrl: string
    debug: boolean
    imgproxy: {
      storageUrl: string
      cdnDomains: string[]
    }
    abckit: {
      sentry: boolean
      auth: {
        baseURL?: string
        basePath?: string
        capacitor?: boolean
      }
    }
  }
}

// declare module '@nuxt/schema' {
//   interface AppConfig extends BreadcrumbsConfig, SetupConfig { }

// }

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'abckit',
    configKey: 'abckit',
    version: '0.0.1',
  },
  defaults: {
    sentry: false,
    auth: {
      baseURL: undefined,
      basePath: '/api/auth',
      capacitor: false,
    },
  },
  moduleDependencies: nuxt => ({
    '@nuxtjs/tailwindcss': {},
    'notivue/nuxt': {},
    '@nuxt/icon': {},
    '@pinia/colada-nuxt': {},
    '@nuxtjs/color-mode': {},
    '@vueuse/nuxt': {},
    '@pinia/nuxt': {},
    '@vee-validate/nuxt': {},
    'nitro-graphql/nuxt': {},
    '@sentry/nuxt/module': {
      optional: nuxt.options.dev,
    },
  }),
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    // abckit konfigürasyonunu public runtime config'e ekle
    nuxt.options.runtimeConfig.public.abckit = {
      sentry: nuxt.options.runtimeConfig.public.abckit?.sentry ?? options.sentry ?? false,
      auth: {
        baseURL: nuxt.options.runtimeConfig.public.abckit?.auth?.baseURL ?? options.auth?.baseURL,
        basePath: nuxt.options.runtimeConfig.public.abckit?.auth?.basePath ?? options.auth?.basePath,
        capacitor: nuxt.options.runtimeConfig.public.abckit?.auth?.capacitor ?? options.auth?.capacitor ?? false,
      },
    }

    nuxt.options.runtimeConfig.dragonfly = defu(nuxt.options.runtimeConfig.dragonfly, {
      host: 'dragonfly',
      port: Number.parseInt('6379', 10),
      password: '',
      url: '',
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

    nuxt.hook('tailwindcss:sources:extend' as any, (sources: any[]) => {
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
    nuxt.options.alias['abckit/middleware'] = resolve('./runtime/middleware')
    nuxt.options.alias['abckit/plugins'] = resolve('./runtime/plugins')
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
    ;(nuxt.options as any).colorMode = {
      classSuffix: '',
      fallback: 'light',
      storageKey: 'abckit-color-mode',
      preference: 'light',
      hid: 'nuxt-color-mode-script',
    }

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

    // Register auth middleware (page-level, not global)
    // Usage: definePageMeta({ middleware: 'auth' })
    addRouteMiddleware({
      name: 'auth',
      path: resolve('./runtime/middleware/auth'),
    })

    // Components are NOT auto-imported
    // Import manually: import { Button } from 'abckit/shadcn/button'
  },
})

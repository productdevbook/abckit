import type { BreadcrumbItemProps } from './runtime/composables/useBreadcrumbItems'

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

export interface ModulesConfig {
  /**
   * Enable all modules by default
   * Individual module settings override this
   * @default false
   */
  all?: boolean

  /**
   * Enable Tailwind CSS
   * @default true
   */
  tailwindcss?: boolean

  /**
   * Enable Notivue toast notifications
   * @default true
   */
  notivue?: boolean

  /**
   * Enable Nuxt Icon
   * @default true
   */
  icon?: boolean

  /**
   * Enable Pinia Colada for data fetching
   * @default true
   */
  colada?: boolean

  /**
   * Enable Color Mode (dark/light)
   * @default true
   */
  colorMode?: boolean

  /**
   * Enable VueUse composables
   * @default true
   */
  vueuse?: boolean

  /**
   * Enable Pinia state management
   * @default true
   */
  pinia?: boolean

  /**
   * Enable VeeValidate form validation
   * @default true
   */
  veeValidate?: boolean

  /**
   * Enable GraphQL API with nitro-graphql
   * @default true
   */
  graphql?: boolean

  /**
   * Enable Pinia persisted state plugin
   * @default true
   */
  persistedState?: boolean

  /**
   * Enable Ionic Vue integration
   * @default true
   */
  ionic?: boolean

  /**
   * Enable Nuxt Scripts
   * @default true
   */
  scripts?: boolean

  /**
   * Enable Sentry error tracking
   * @default false (or true if all: true)
   */
  sentry?: boolean
}

export interface ModuleOptions {
  /**
   * Module toggles - enable/disable individual features
   * Use `all: true` to enable all modules, then disable specific ones
   * @example
   * modules: { all: true, graphql: false } // Enable all except graphql
   * modules: { sentry: true } // Only enable sentry
   */
  modules?: ModulesConfig

  /**
   * Better Auth client configuration
   */
  auth?: AuthClientOptions

  /**
   * Set to true when installed via npm package, dont used project.
   */
  npm?: boolean

  /**
   * @deprecated Use `modules.sentry` instead
   */
  sentry?: boolean

  /**
   * @deprecated Use `modules.graphql` instead
   */
  graphql?: boolean
}

// Nuxt Schema Augmentation
declare module '@nuxt/schema' {
  interface AppConfig extends BreadcrumbsConfig, SetupConfig {}

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
    isMobile: boolean
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

// Capacitor packages to externalize (optional dependencies)
export const CAPACITOR_EXTERNAL_PACKAGES = [
  '@capacitor/preferences',
  '@capacitor/app',
  '@capacitor/network',
] as const

// Vite optimization exclude packages
export const VITE_EXCLUDE_PACKAGES = [
  'abckit',
  'shadcn-nuxt',
  '@vue/devtools-core',
  '@vue/devtools-kit',
  'notivue',
  'zod',
  'date-fns',
  'date-fns/locale',
  'class-variance-authority',
  'reka-ui',
  'clsx',
  'tailwind-merge',
  '@sindresorhus/slugify',
  'better-auth',
  'leaflet',
  '@capgo/capacitor-social-login',
  'ionicons/icons',
  '@ionic/vue',
  '@capacitor/core',
  '@capacitor/status-bar',
  '@capacitor/splash-screen',
  '@capacitor/preferences',
  '@capacitor/geolocation',
  '@capacitor/network',
  '@capacitor/push-notifications',
  '@capacitor/device',
  '@capacitor/app',
  'capacitor-native-settings',
  '@capacitor/haptics',
  '@unovis/vue',
] as const

// Runtime config defaults
export const DRAGONFLY_DEFAULTS = {
  host: 'dragonfly',
  port: 6379,
  password: '',
  url: '',
}

export const S3_DEFAULTS = {
  accessKeyId: '',
  secretAccessKey: '',
  endpoint: '',
  bucket: '',
  region: 'auto',
  publicUrl: '',
}

export const POLAR_DEFAULTS = {
  accessToken: '',
  checkoutSuccessUrl: '/checkout/success',
  server: 'sandbox' as const,
  webhookSecret: '',
}

export const IMGPROXY_DEFAULTS = {
  storageUrl: '',
  cdnDomains: [] as string[],
}

export const STORAGE_DEFAULTS = {
  redis: false,
  s3: false,
  disk: false,
}

// App head link defaults
export const APP_HEAD_LINKS = [
  { rel: 'icon', type: 'image/png', href: '/favicon-96x96.png', sizes: '96x96' },
  { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
  { rel: 'shortcut icon', href: '/favicon.ico' },
  { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
]

// Alias paths
export const ALIAS_PATHS = {
  'abckit/runtime': './runtime',
  'abckit/server/utils': './runtime/server/utils',
  'abckit/components': './runtime/components',
  'abckit/shadcn': './runtime/components/ui',
  'abckit/composables': './runtime/composables',
  'abckit/middleware': './runtime/middleware',
  'abckit/plugins': './runtime/plugins',
  'abckit/graphql': './runtime/graphql',
  'abckit/stores': './runtime/stores',
  'abckit/utils': './runtime/utils',
  'abckit/types/client': './runtime/types/nitro-graphql-client',
  'abckit/shared': './runtime/shared',
} as const

// NPM mode TypeScript paths
export const NPM_TS_PATHS = {
  'abckit/components': ['./node_modules/abckit/runtime/components/ui'],
  'abckit/composables': ['./node_modules/abckit/runtime/composables'],
  'abckit/utils': ['./node_modules/abckit/runtime/utils'],
  'abckit/shadcn': ['./node_modules/abckit/runtime/components/ui'],
  'abckit/lib': ['./node_modules/abckit/runtime/utils'],
} as const

// H3 type template
export const H3_TYPE_TEMPLATE = `
declare module 'h3' {
  interface H3EventContext {
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
    authError?: {
      statusCode: number
      statusMessage: string
    }
    isPremium: boolean
    subscription: any | null
  }
}

export {}
`

// GraphQL scalars config
export const GRAPHQL_SCALARS = {
  Timestamp: 'string',
  File: 'File',
  Decimal: 'string',
}

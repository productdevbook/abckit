import type { Nuxt } from '@nuxt/schema'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { consola } from 'consola'

interface FeatureGroup {
  name: string
  description: string
  packages: string[]
  installCommand: string
}

export const FEATURE_GROUPS: Record<string, FeatureGroup> = {
  core: {
    name: 'Core UI',
    description: 'UI components, auth, state management',
    packages: [
      'reka-ui',
      'better-auth',
      '@nuxtjs/tailwindcss',
      'tailwindcss',
      '@nuxtjs/color-mode',
      '@pinia/nuxt',
      'pinia',
      '@pinia/colada-nuxt',
      '@pinia/colada',
      '@vueuse/nuxt',
      '@vueuse/core',
      '@vee-validate/nuxt',
      'vee-validate',
      'notivue',
      '@nuxt/icon',
      '@nuxt/scripts',
      'pinia-plugin-persistedstate',
      'vaul-vue',
      'vue-sonner',
      'embla-carousel-vue',
      'vue-input-otp',
      'date-fns',
      'zod',
    ],
    installCommand: `pnpm add reka-ui better-auth @nuxtjs/tailwindcss tailwindcss @nuxtjs/color-mode \\
  @pinia/nuxt pinia @pinia/colada-nuxt @pinia/colada @pinia/colada-plugin-auto-refetch \\
  @vueuse/nuxt @vueuse/core @vee-validate/nuxt vee-validate \\
  notivue @nuxt/icon @nuxt/scripts pinia-plugin-persistedstate \\
  vaul-vue vue-sonner embla-carousel-vue vue-input-otp date-fns zod uuid ofetch`,
  },
  graphql: {
    name: 'GraphQL',
    description: 'GraphQL API with Yoga',
    packages: ['graphql', 'graphql-yoga', 'nitro-graphql', 'graphql-scalars', '@graphql-tools/utils'],
    installCommand: 'pnpm add graphql graphql-yoga nitro-graphql graphql-scalars @graphql-tools/utils graphql-config',
  },
  ionic: {
    name: 'Ionic/Mobile UI',
    description: 'Ionic Vue components',
    packages: ['@ionic/vue', '@nuxtjs/ionic'],
    installCommand: 'pnpm add @ionic/vue @nuxtjs/ionic',
  },
  capacitor: {
    name: 'Capacitor',
    description: 'Native mobile features',
    packages: ['@capacitor/core', '@capacitor/preferences', '@capacitor/app'],
    installCommand: `pnpm add @capacitor/core @capacitor/cli @capacitor/preferences @capacitor/app \\
  @capacitor/browser @capacitor/device @capacitor/haptics @capacitor/network \\
  @capacitor/splash-screen @capacitor/status-bar capacitor-native-settings`,
  },
  sentry: {
    name: 'Sentry',
    description: 'Error tracking',
    packages: ['@sentry/nuxt'],
    installCommand: 'pnpm add @sentry/nuxt',
  },
  database: {
    name: 'Database',
    description: 'Drizzle ORM + PostgreSQL + Redis',
    packages: ['drizzle-orm', 'pg', 'ioredis'],
    installCommand: 'pnpm add drizzle-orm drizzle-kit drizzle-zod pg ioredis',
  },
  storage: {
    name: 'S3 Storage',
    description: 'S3/R2 file storage',
    packages: ['aws4fetch', 'unstorage'],
    installCommand: 'pnpm add aws4fetch unstorage',
  },
  i18n: {
    name: 'Internationalization',
    description: 'Multi-language support',
    packages: ['@nuxtjs/i18n'],
    installCommand: 'pnpm add @nuxtjs/i18n',
  },
  polar: {
    name: 'Polar',
    description: 'Polar.sh payments',
    packages: ['@polar-sh/sdk'],
    installCommand: 'pnpm add @polar-sh/sdk',
  },
  table: {
    name: 'Data Table',
    description: 'TanStack Table',
    packages: ['@tanstack/vue-table'],
    installCommand: 'pnpm add @tanstack/vue-table',
  },
  charts: {
    name: 'Charts',
    description: 'Unovis charts',
    packages: ['@unovis/vue'],
    installCommand: 'pnpm add @unovis/vue @unovis/ts',
  },
  editor: {
    name: 'Markdown Editor',
    description: 'MD Editor V3',
    packages: ['md-editor-v3'],
    installCommand: 'pnpm add md-editor-v3',
  },
}

function isPackageInstalled(pkg: string, nodeModulesPath: string): boolean {
  const pkgPath = join(nodeModulesPath, pkg)
  return existsSync(pkgPath)
}

export function checkDependencies(nuxt: Nuxt, features: Record<string, boolean>): void {
  const nodeModulesPath = join(nuxt.options.rootDir, 'node_modules')
  const warnings: string[] = []

  for (const [key, enabled] of Object.entries(features)) {
    if (!enabled)
      continue

    const group = FEATURE_GROUPS[key]
    if (!group)
      continue

    const missing = group.packages.filter(pkg => !isPackageInstalled(pkg, nodeModulesPath))

    if (missing.length > 0) {
      warnings.push(`\n${group.name} (${group.description}):`)
      warnings.push(`  Missing: ${missing.join(', ')}`)
      warnings.push(`  Install: ${group.installCommand}`)
    }
  }

  if (warnings.length > 0) {
    consola.warn(`[abckit] Missing peer dependencies detected:${warnings.join('\n')}`)
  }
}

export function getInstallGuide(): string {
  const lines = ['# abckit Installation Guide\n']

  for (const [_key, group] of Object.entries(FEATURE_GROUPS)) {
    lines.push(`## ${group.name}`)
    lines.push(`${group.description}\n`)
    lines.push('```bash')
    lines.push(group.installCommand)
    lines.push('```\n')
  }

  return lines.join('\n')
}

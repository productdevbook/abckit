import type { ModuleOptions, ModulesConfig } from './types'

// Modules that default to true (core modules)
export const CORE_MODULES = ['tailwindcss', 'notivue', 'icon', 'colada', 'colorMode', 'vueuse', 'pinia', 'veeValidate', 'graphql', 'persistedState', 'ionic', 'scripts'] as const

// Modules that default to false (opt-in modules)
export const OPTIONAL_MODULES = ['sentry'] as const

export type CoreModuleKey = typeof CORE_MODULES[number]
export type OptionalModuleKey = typeof OPTIONAL_MODULES[number]
export type ModuleKey = CoreModuleKey | OptionalModuleKey

/**
 * Resolve module enabled state
 * Priority: explicit module setting > all setting > default
 * Core modules default to true, optional modules default to false
 */
export function resolveModule(modules: ModulesConfig | undefined, key: ModuleKey): boolean {
  // Explicit setting takes priority
  if (modules?.[key] !== undefined) {
    return modules[key]!
  }
  // If all is set, use that
  if (modules?.all !== undefined) {
    return modules.all
  }
  // Default: core modules are true, optional modules are false
  return (CORE_MODULES as readonly string[]).includes(key)
}

/**
 * Create a helper to check if module is enabled
 * Supports deprecated top-level options for backwards compatibility
 */
export function createModuleChecker(opts: ModuleOptions | undefined) {
  const m = opts?.modules
  return (key: ModuleKey, deprecatedKey?: keyof ModuleOptions) => {
    if (deprecatedKey && opts?.[deprecatedKey] !== undefined) {
      return opts[deprecatedKey] === true
    }
    return resolveModule(m, key)
  }
}

/**
 * Get module dependencies configuration
 */
export function getModuleDependencies(nuxt: any): Record<string, any> {
  const opts = nuxt.options.abckit as ModuleOptions | undefined
  const isEnabled = createModuleChecker(opts)

  return {
    '@nuxtjs/tailwindcss': { optional: !isEnabled('tailwindcss') },
    'notivue/nuxt': { optional: !isEnabled('notivue') },
    '@nuxt/icon': { optional: !isEnabled('icon') },
    '@pinia/colada-nuxt': { optional: !isEnabled('colada') },
    '@nuxtjs/color-mode': { optional: !isEnabled('colorMode') },
    '@vueuse/nuxt': { optional: !isEnabled('vueuse') },
    '@pinia/nuxt': { optional: !isEnabled('pinia') },
    '@vee-validate/nuxt': { optional: !isEnabled('veeValidate') },
    'nitro-graphql/nuxt': { optional: !isEnabled('graphql', 'graphql') },
    'pinia-plugin-persistedstate/nuxt': { optional: !isEnabled('persistedState') },
    '@nuxtjs/ionic': { optional: !isEnabled('ionic') },
    '@nuxt/scripts': { optional: !isEnabled('scripts') },
    '@sentry/nuxt/module': { optional: nuxt.options.dev || !isEnabled('sentry', 'sentry') },
  }
}

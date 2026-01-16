import type { ModuleOptions } from './types'
import { createResolver, defineNuxtModule } from '@nuxt/kit'
import { defu } from 'defu'
import { createModuleChecker, getModuleDependencies } from './modules'
import {
  setupAliases,
  setupAppHead,
  setupColorMode,
  setupCSS,
  setupDevtools,
  setupHooks,
  setupNitro,
  setupRouting,
  setupRuntimeConfig,
  setupTypes,
  setupTypeScript,
  setupVite,
} from './setup'
import { checkDependencies } from './utils/check-deps'
import { isMobileBuild, mobileBaseURL } from './utils/mobile'
// Import types for augmentation
import './types'

// Re-export types for consumers
export type {
  AuthClientOptions,
  BreadcrumbsConfig,
  ModuleOptions,
  ModulesConfig,
  SetupConfig,
} from './types'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'abckit',
    configKey: 'abckit',
    version: '0.0.1',
  },
  defaults: {
    modules: {
      all: false,
      sentry: false,
    },
    auth: {
      baseURL: isMobileBuild ? mobileBaseURL : undefined,
      basePath: '/api/auth',
      capacitor: isMobileBuild,
    },
    npm: false,
  },
  async moduleDependencies(nuxt) {
    const deps = getModuleDependencies(nuxt)
    return deps
  },
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    nuxt.options.abckit = defu(nuxt.options.abckit, options)

    // Resolve module states
    const isEnabled = createModuleChecker(nuxt.options.abckit)
    const isSentryEnabled = isEnabled('sentry', 'sentry')
    const isGraphqlEnabled = isEnabled('graphql', 'graphql')
    const isIonicEnabled = isEnabled('ionic')

    // Check for missing peer dependencies in dev mode
    if (nuxt.options.dev) {
      checkDependencies(nuxt, {
        core: true,
        graphql: isGraphqlEnabled,
        ionic: isIonicEnabled,
        sentry: isSentryEnabled,
      })
    }

    // Setup
    setupDevtools(nuxt)
    await setupRuntimeConfig(nuxt, options, isSentryEnabled)
    setupAppHead(nuxt)
    setupTypes()
    setupHooks(nuxt, resolve)
    await setupCSS(nuxt, resolve)
    setupNitro(nuxt, resolve, isGraphqlEnabled)
    setupVite(nuxt)
    setupAliases(nuxt, resolve)
    setupTypeScript(nuxt)
    setupColorMode(nuxt)
    setupRouting(nuxt, resolve)
  },
})

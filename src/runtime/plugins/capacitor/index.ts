export {
  capacitorClient,
  getCookie,
  getSetCookie,
  hasBetterAuthCookies,
  normalizeCookieName,
  parseSetCookieHeader,
} from './client'
export type { CapacitorClientOptions } from './client'
export { setupCapacitorFocusManager } from './focus-manager'
export { setupCapacitorOnlineManager } from './online-manager'
export * from './plugins'

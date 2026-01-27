export {
  capacitorClient,
  getCapacitorAuthToken,
  getCookie,
  getSetCookie,
  hasBetterAuthCookies,
  isNativePlatform,
  normalizeCookieName,
  parseSetCookieHeader,
} from './client'
export type { CapacitorClientOptions, GetCapacitorAuthTokenOptions } from './client'
export { setupCapacitorFocusManager } from './focus-manager'
export { setupCapacitorOnlineManager } from './online-manager'
export * from './plugins'

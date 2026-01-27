import { networkInterfaces } from 'node:os'

export const isMobileBuild = process.env.MOBILE_BUILD === 'true' || process.env.NUXT_PUBLIC_MOBILE_DEV === 'true'
export const isMobileDev = process.env.MOBILE_DEV === 'true' || process.env.NUXT_PUBLIC_MOBILE_DEV === 'true'

export function getLocalIP(): string {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return 'localhost'
}

export const localIP = isMobileDev ? getLocalIP() : null
export const mobileBaseURL = isMobileDev ? `http://${localIP}:3000` : ''

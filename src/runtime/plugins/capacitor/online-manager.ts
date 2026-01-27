import type { OnlineManager } from 'better-auth/client'
import { Network } from '@capacitor/network'
import { kOnlineManager } from 'better-auth/client'

type OnlineListener = (online: boolean) => void

class CapacitorOnlineManager implements OnlineManager {
  listeners = new Set<OnlineListener>()
  isOnline = true
  unsubscribe?: () => void

  subscribe(listener: OnlineListener) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  setOnline(online: boolean) {
    // Deduplicate - don't notify if state hasn't changed
    if (this.isOnline === online)
      return
    this.isOnline = online
    this.listeners.forEach(listener => listener(online))
  }

  setup() {
    Network.addListener('networkStatusChange', (status) => {
      this.setOnline(status.connected)
    }).then((handle) => {
      this.unsubscribe = () => handle.remove()
    }).catch(() => {
      // Network plugin not available, fallback to always online
      this.setOnline(true)
    })

    return () => {
      this.unsubscribe?.()
    }
  }
}

export function setupCapacitorOnlineManager(): OnlineManager {
  const global = globalThis as unknown as Record<symbol, OnlineManager>
  if (!global[kOnlineManager]) {
    global[kOnlineManager] = new CapacitorOnlineManager()
  }
  return global[kOnlineManager]
}

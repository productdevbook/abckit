import { useRuntimeConfig } from 'nitro/runtime-config'
import { definePlugin } from 'nitro'
import { useStorage } from 'nitro/storage'

import fs from 'unstorage/drivers/fs-lite'
import redisDriver from 'unstorage/drivers/redis'
import s3Driver from 'unstorage/drivers/s3'

export default definePlugin(() => {
  const config = useRuntimeConfig()
  const storage = useStorage()
  const storageConfig = config.storage as { redis: boolean, s3: boolean, disk: boolean }

  // Mount Redis/DragonflyDB cache storage (if enabled)
  if (storageConfig.redis) {
    // Support both URL format (NUXT_DRAGONFLY_URL) and separate params (NUXT_DRAGONFLY_HOST/PORT/PASSWORD)
    const dragonflyUrl = process.env.NUXT_DRAGONFLY_URL || process.env.DRAGONFLY_URL || process.env.REDIS_URL
    const dragonflyConfig = config.dragonfly || {}

    const dragonflyDriver = dragonflyUrl
      ? redisDriver({ url: dragonflyUrl })
      : redisDriver({
          host: (dragonflyConfig as any).host || 'dragonfly',
          port: (dragonflyConfig as any).port || 6379,
          password: (dragonflyConfig as any).password || '',
          db: 0,
        })

    storage.mount('redis', dragonflyDriver)
  }

  // Mount S3/R2 storage (if enabled)
  if (storageConfig.s3) {
    const s3Config = config.s3 as any
    const driver = s3Driver({
      accessKeyId: s3Config.accessKeyId,
      secretAccessKey: s3Config.secretAccessKey,
      endpoint: s3Config.endpoint,
      bucket: s3Config.bucket,
      region: s3Config.region,
    })

    storage.mount('r2', driver)
  }

  // Mount local disk storage (if enabled)
  if (storageConfig.disk) {
    const localS3 = fs({
      base: './.data',
    })
    storage.mount('disk', localS3)
  }
})

import { definePlugin } from 'nitro'
import { useRuntimeConfig } from 'nitro/runtime-config'
import { useStorage } from 'nitro/storage'

import fs from 'unstorage/drivers/fs-lite'
import redisDriver from 'unstorage/drivers/redis'
import s3Driver from 'unstorage/drivers/s3'

export default definePlugin(() => {
  const config = useRuntimeConfig()
  const storage = useStorage()
  const storageConfig = config.modules

  // Mount Redis/DragonflyDB cache storage (if enabled)
  if (storageConfig.redis) {
    // Support both URL format (NUXT_DRAGONFLY_URL) and separate params (NUXT_DRAGONFLY_HOST/PORT/PASSWORD)
    const dragonflyUrl = process.env.NUXT_DRAGONFLY_URL || process.env.DRAGONFLY_URL || process.env.REDIS_URL

    const dragonflyDriver = dragonflyUrl
      ? redisDriver({ url: dragonflyUrl })
      : redisDriver({
          host: process.env.NUXT_DRAGONFLY_HOST || process.env.DRAGONFLY_HOST || 'dragonfly',
          port: Number.parseInt(process.env.NUXT_DRAGONFLY_PORT || process.env.DRAGONFLY_PORT || '6379', 10),
          password: process.env.NUXT_DRAGONFLY_PASSWORD || process.env.DRAGONFLY_PASSWORD || '',
          db: 0,
        })

    storage.mount('redis', dragonflyDriver)
  }

  // Mount S3/R2 storage (if enabled)
  if (storageConfig.s3) {
    const driver = s3Driver({
      accessKeyId: process.env.NITRO_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.NITRO_S3_SECRET_ACCESS_KEY,
      endpoint: process.env.NITRO_S3_ENDPOINT,
      bucket: process.env.NITRO_S3_BUCKET,
      region: process.env.NITRO_S3_REGION,
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

import { useRuntimeConfig } from '#app'

export type ImageSize
  = | 'raw'
    | 'xs'
    | 'sm'
    | 'md'
    | 'lg'
    | 'thumbnails'
    | 'thumbnails2'
    | '2k'
    | 'profile50'
    | 'profile75'

interface ImageSizeConfig {
  path: string
  description: string
}

const imageSizes: Record<ImageSize, ImageSizeConfig> = {
  'raw': {
    path: 'skip_processing:jpg:png:gif,default=resizing_type:fit',
    description: 'Original image without processing',
  },
  'xs': {
    path: 's:100:100/rt:fill/sh:0.2',
    description: 'Extra small (100x100)',
  },
  'sm': {
    path: 's:250:250/rt:fill/sh:0.3',
    description: 'Small (250x250)',
  },
  'md': {
    path: 's:500:500/rt:fill/sh:0.5',
    description: 'Medium (500x500)',
  },
  'lg': {
    path: 's:1000:1000/rt:fill/sh:0.7',
    description: 'Large (1000x1000)',
  },
  'thumbnails': {
    path: 's:525:175/sh:0.5',
    description: 'Thumbnail (525x175)',
  },
  'thumbnails2': {
    path: 's:1050:350/sh:0.3',
    description: 'Large thumbnail (1050x350)',
  },
  '2k': {
    path: 's:2000:2000/sh:1',
    description: '2K resolution (2000x2000)',
  },
  'profile50': {
    path: 's:100:100/rt:fill/f:avif',
    description: 'Profile small AVIF (100x100)',
  },
  'profile75': {
    path: 's:150:150/rt:fill/f:avif',
    description: 'Profile medium AVIF (150x150)',
  },
}

export function useImageUrl() {
  const config = useRuntimeConfig()
  const imgproxyConfig = config.public.imgproxy as { storageUrl: string, cdnDomains: string[] }
  const s3StaticUrl = imgproxyConfig.storageUrl
  const cdnDomains = imgproxyConfig.cdnDomains

  /**
   * Extract the S3 key from a full CDN URL
   * @param url - The full CDN URL (e.g., https://cdn.example.com/products/xxx.webp)
   * @returns The S3 key (e.g., products/xxx.webp) or null if not a known CDN URL
   */
  function extractKeyFromUrl(url: string): string | null {
    try {
      const parsedUrl = new URL(url)
      if (cdnDomains.includes(parsedUrl.host)) {
        // Remove leading slash from pathname
        return parsedUrl.pathname.slice(1)
      }
    }
    catch {
      // Invalid URL, return null
    }
    return null
  }

  /**
   * Get the full URL for an image with specified size
   * @param imageKey - The S3 key/path of the image or full CDN URL
   * @param size - The desired image size preset
   * @returns The full CDN URL for the image
   */
  function getImageUrl(imageKey: string | null | undefined, size: ImageSize = 'lg'): string {
    if (!imageKey) {
      return ''
    }

    let key = imageKey

    // If it's a full URL, try to extract the key from known CDN domains
    if (imageKey.startsWith('http://') || imageKey.startsWith('https://')) {
      const extractedKey = extractKeyFromUrl(imageKey)
      if (extractedKey) {
        key = extractedKey
      }
      else {
        // Unknown domain, return as-is
        return imageKey
      }
    }

    const basePath = size === 'raw' ? '/unsafe/raw/plain/' : `/unsafe/${size}/plain/`

    return new URL(key, `${s3StaticUrl}${basePath}`).toString()
  }

  /**
   * Get all available image sizes with their configurations
   */
  function getAvailableSizes() {
    return Object.entries(imageSizes).map(([key, config]) => ({
      key: key as ImageSize,
      ...config,
    }))
  }

  /**
   * Build a custom image URL with specific parameters
   * @param imageKey - The S3 key/path of the image or full CDN URL
   * @param params - Custom image processing parameters
   * @returns The full CDN URL for the image
   */
  function getCustomImageUrl(imageKey: string | null | undefined, params: string): string {
    if (!imageKey) {
      return ''
    }

    let key = imageKey

    // If it's a full URL, try to extract the key from known CDN domains
    if (imageKey.startsWith('http://') || imageKey.startsWith('https://')) {
      const extractedKey = extractKeyFromUrl(imageKey)
      if (extractedKey) {
        key = extractedKey
      }
      else {
        // Unknown domain, return as-is
        return imageKey
      }
    }

    return new URL(key, `${s3StaticUrl}/unsafe/${params}/plain/`).toString()
  }

  return {
    getImageUrl,
    getAvailableSizes,
    getCustomImageUrl,
  }
}

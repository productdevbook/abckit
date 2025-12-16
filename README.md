# abckit

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

Nuxt 4 module — UI components, auth, storage, GraphQL.

## Install

```bash
pnpm add abckit
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['abckit'],
})
```

## Modules

```typescript
abckit: {
  modules: {
    // Default: true
    tailwindcss: true,
    notivue: true,
    icon: true,
    colada: true,
    colorMode: true,
    vueuse: true,
    pinia: true,
    veeValidate: true,
    graphql: true,
    persistedState: true,
    ionic: true,
    scripts: true,

    // Default: false
    sentry: false,

    // all: true // Enable all
  },
  auth: {
    baseURL: 'https://api.example.com',
    basePath: '/api/auth',
    capacitor: false,
  },
}
```

## Usage

```typescript
import { Button } from 'abckit/shadcn/button'
import { useAuth } from 'abckit/composables/useAuth'
import { cn } from 'abckit/utils'
```

## Runtime Config

```typescript
runtimeConfig: {
  dragonfly: { host: 'localhost', port: 6379 },
  s3: { accessKeyId: '', secretAccessKey: '', endpoint: '', bucket: '' },
  storage: { redis: true, s3: true, disk: false },
}
```

## Development

```bash
pnpm install && pnpm dev:prepare && pnpm dev
```

## License

MIT

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/abckit?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/abckit
[npm-downloads-src]: https://img.shields.io/npm/dm/abckit?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/abckit
[license-src]: https://img.shields.io/github/license/productdevbook/abckit.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/productdevbook/abckit/blob/main/LICENSE

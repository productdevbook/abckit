# abckit

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

A batteries-included Nuxt 4 module that gives you everything you need to build modern web apps — beautiful UI components, authentication, storage, and more.

## Features

- **50+ UI Components** — shadcn/ui style components built on [Reka UI](https://reka-ui.com)
- **Authentication** — [Better Auth](https://better-auth.com) integration with session management
- **Storage** — S3/R2, Redis/Dragonfly, and local disk drivers
- **GraphQL API** — [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server) via nitro-graphql
- **Dark Mode** — Built-in color mode support
- **Forms** — Validation with VeeValidate + Zod
- **Data Fetching** — Pinia Colada with global error handling
- **Icons** — 100k+ icons via Nuxt Icon

## Quick Start

```bash
# Install
pnpm add abckit

# Add to nuxt.config.ts
export default defineNuxtConfig({
  modules: ['abckit']
})
```

Import components from `abckit/shadcn/*`:

```vue
<script setup lang="ts">
import { Button } from 'abckit/shadcn/button'
import { Card, CardHeader, CardTitle } from 'abckit/shadcn/card'
</script>

<template>
  <Button variant="outline">Click me</Button>
  <Card>
    <CardHeader>
      <CardTitle>Hello</CardTitle>
    </CardHeader>
  </Card>
</template>
```

## Components

Accordion, Alert, AlertDialog, AspectRatio, AutoForm, Avatar, Badge, Breadcrumb, Button, ButtonGroup, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Combobox, Command, ContextMenu, CountrySelect, CurrencySelect, Dialog, Drawer, DropdownMenu, Empty, Field, File, Form, HoverCard, Input, InputGroup, InputOTP, Item, Kbd, Label, LanguageSelect, Menubar, NativeSelect, NavigationMenu, NumberField, Pagination, PinInput, Popover, Progress, RadioGroup, RangeCalendar, Resizable, ScrollArea, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Spinner, Stepper, Storage, Switch, Table, Tabs, TagsInput, Textarea, TimezoneSelect, Toggle, ToggleGroup, Tooltip

## Composables

```ts
// Authentication
const { user, isAuthenticated, login, logout } = useAuth()

// Image CDN URLs with presets
const { getImageUrl } = useImageUrl()
const url = getImageUrl('products/photo.jpg', 'lg') // 1000x1000

// Auto breadcrumbs from routes
const items = useBreadcrumbItems()
```

## Configuration

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ['abckit'],
  runtimeConfig: {
    // Redis/Dragonfly
    dragonfly: {
      host: 'localhost',
      port: 6379
    },
    // S3/R2 Storage
    s3: {
      accessKeyId: '',
      secretAccessKey: '',
      endpoint: '',
      bucket: ''
    },
    // Enable storage drivers
    storage: {
      redis: true,
      s3: true,
      disk: false
    }
  }
})
```

## Theming

Override the default theme by creating `app/assets/css/tailwind.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";

:root {
  --primary: oklch(0.6 0.2 250);
  --radius: 0.5rem;
}
```

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to open an issue or submit a pull request.

## License

MIT

---

<p align="center">
  <img src=".github/assets/footer.svg" width="100%" alt="abckit footer" />
</p>

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/abckit?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/abckit
[npm-downloads-src]: https://img.shields.io/npm/dm/abckit?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/abckit
[license-src]: https://img.shields.io/github/license/productdevbook/abckit.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/productdevbook/abckit/blob/main/LICENSE

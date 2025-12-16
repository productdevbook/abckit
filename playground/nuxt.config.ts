import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['abckit'],
  devtools: { enabled: false },
  devServer: {
    port: 3070,
  },
  abckit: {
    modules: {
      graphql: true,
    },
  },
})

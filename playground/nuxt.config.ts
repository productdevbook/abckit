export default defineNuxtConfig({
  modules: ['abckit'],
  devtools: { enabled: false },
  devServer: {
    port: 3070,
  },
  // eslint: {
  //   config: {
  //     // Use the generated ESLint config for lint root project as well
  //     rootDir: fileURLToPath(new URL('..', import.meta.url)),
  //   },
  // },
})

import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      '.github',
      '.output',
      '.nitro',
      '.netlify',
      '.nuxt',
      'dist',
      'server/drizzle/generated',
      '*.md',
      'docs',
      'scripts',
      '.claude',
      'CLAUDE.md',
      '.devcontainer',
      '.claude',
      '*.md',
      '**/*.json',
      'src/runtime/components/ui',
    ],
  },
  {
    rules: {
      'node/prefer-global/process': 'off',
      'node/prefer-global/buffer': 'off',
    },
  },
)

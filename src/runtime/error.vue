<script setup lang="ts">
import { navigateTo } from '#app'
import { Icon } from '#components'
import { Button } from 'abckit/shadcn/button'
import { computed, ref } from 'vue'

const props = defineProps<{
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
    stack?: string
  }
}>()

const isDev = import.meta.dev

// Copy functionality for debug info
const copied = ref(false)
const currentUrl = computed(() => import.meta.client ? window.location.href : 'N/A')

async function copyDebugInfo() {
  const debugData = {
    statusCode: props.error.statusCode,
    statusMessage: props.error.statusMessage,
    message: props.error.message,
    stack: props.error.stack,
    timestamp: new Date().toISOString(),
    url: currentUrl.value,
    userAgent: import.meta.client ? navigator.userAgent : 'N/A',
  }

  const formattedData = `
# Debug Information
**Status Code:** ${debugData.statusCode}
**Status Message:** ${debugData.statusMessage || 'N/A'}
**Error Message:** ${debugData.message || 'N/A'}
**URL:** ${debugData.url}
**Timestamp:** ${debugData.timestamp}
**User Agent:** ${debugData.userAgent}

## Stack Trace
\`\`\`
${debugData.stack || 'No stack trace available'}
\`\`\`
  `.trim()

  try {
    await navigator.clipboard.writeText(formattedData)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
  catch (err) {
    console.error('Failed to copy debug info:', err)
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  }
  catch (err) {
    console.error('Failed to copy:', err)
  }
}

function getErrorData() {
  switch (props.error.statusCode) {
    case 401:
      return {
        emoji: '🔑',
        title: 'Authentication Required',
        description: 'You need to sign in or use a different account to perform this action.',
        primaryAction: 'Sign In',
        primaryHandler: switchUser,
      }
    case 403:
      return {
        emoji: '🔐',
        title: 'Access Denied',
        description: 'You need to sign in or use a different account to view this content.',
        primaryAction: 'Sign In',
        primaryHandler: switchUser,
      }
    case 404:
      return {
        emoji: '🤔',
        title: 'Page Not Found',
        description: 'The page you are looking for may have been deleted, moved, or you may have clicked an incorrect link.',
        primaryAction: 'Go to Home',
        primaryHandler: goHome,
      }
    case 500:
      return {
        emoji: '😔',
        title: 'Something Went Wrong',
        description: 'A technical issue occurred on the server. Please try again in a few minutes.',
        primaryAction: 'Try Again',
        primaryHandler: retry,
      }
    default:
      return {
        emoji: '😕',
        title: 'Unexpected Error',
        description: 'An error occurred. Try refreshing the page or go back to the home page.',
        primaryAction: 'Try Again',
        primaryHandler: retry,
      }
  }
}

function goHome() {
  // Clear localStorage on 403/404 errors before navigating
  if (props.error.statusCode === 403 || props.error.statusCode === 404) {
    if (import.meta.client) {
      window.location.href = '/'
      return
    }
  }
  navigateTo('/')
}

function goBack() {
  // Clear localStorage on 403/404 errors before navigating
  if (props.error.statusCode === 403 || props.error.statusCode === 404) {
    setTimeout(() => {
      window.history.back()
    }, 100)
    return
  }
  window.history.back()
}

function retry() {
  window.location.reload()
}

function switchUser() {
  navigateTo('/auth/login')
}
</script>

<template>
  <div class="min-h-dvh bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-6">
    <div class="w-full max-w-md text-center space-y-8">
      <!-- Main Content -->
      <div class="space-y-6">
        <!-- Emoji Icon -->
        <div class="text-8xl select-none">
          {{ getErrorData().emoji }}
        </div>

        <!-- Title & Description -->
        <div class="space-y-4">
          <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {{ getErrorData().title }}
          </h1>
          <p class="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            {{ getErrorData().description }}
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3 pt-4">
          <Button
            size="lg"
            class="w-full h-12 text-base font-medium"
            @click="getErrorData().primaryHandler"
          >
            {{ getErrorData().primaryAction }}
          </Button>

          <div class="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              class="flex-1 h-12"
              @click="goHome"
            >
              <Icon name="lucide:home" class="mr-2 size-4" />
              Home
            </Button>
            <Button
              variant="outline"
              size="lg"
              class="flex-1 h-12"
              @click="goBack"
            >
              <Icon name="lucide:arrow-left" class="mr-2 size-4" />
              Back
            </Button>
          </div>
        </div>

        <!-- Help Text -->
        <div class="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 text-sm text-slate-600 dark:text-slate-400">
          <template v-if="error.statusCode === 401">
            Your session has ended for security purposes. Please sign in again.
          </template>
          <template v-else-if="error.statusCode === 403">
            If the problem persists, please contact the site administrator.
          </template>
          <template v-else-if="error.statusCode === 404">
            Try navigating from the home page to find what you're looking for.
          </template>
          <template v-else>
            If the problem persists, please wait a few minutes and try again.
          </template>
        </div>
      </div>

      <!-- Debug Panel (Development Only) -->
      <div v-if="isDev" class="mt-8">
        <details class="bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <summary class="cursor-pointer p-4 font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl">
            <div class="flex items-center gap-2">
              <Icon name="lucide:bug" class="size-4" />
              Debug Information
            </div>
            <Button
              size="sm"
              variant="outline"
              class="h-8 px-3 text-xs"
              @click.stop="copyDebugInfo"
            >
              <Icon name="lucide:copy" class="size-3 mr-1" />
              {{ copied ? 'Copied!' : 'Copy All' }}
            </Button>
          </summary>
          <div class="p-4 pt-0 space-y-4 text-sm">
            <!-- Quick Info -->
            <div class="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div>
                <div class="font-medium text-slate-500 dark:text-slate-400 text-xs mb-1">
                  Status Code
                </div>
                <div class="font-mono text-slate-900 dark:text-slate-100">
                  {{ error.statusCode }}
                </div>
              </div>
              <div>
                <div class="font-medium text-slate-500 dark:text-slate-400 text-xs mb-1">
                  Timestamp
                </div>
                <div class="font-mono text-slate-900 dark:text-slate-100 text-xs">
                  {{ new Date().toLocaleString() }}
                </div>
              </div>
            </div>

            <!-- Error Details -->
            <div class="space-y-3">
              <div v-if="error.statusMessage">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-slate-600 dark:text-slate-400">Status Message</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    class="h-6 w-6 p-0"
                    @click="copyToClipboard(error.statusMessage || '')"
                  >
                    <Icon name="lucide:copy" class="size-3" />
                  </Button>
                </div>
                <div class="p-2 bg-slate-50 dark:bg-slate-900 rounded font-mono text-xs break-all">
                  {{ error.statusMessage }}
                </div>
              </div>

              <div v-if="error.message">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-slate-600 dark:text-slate-400">Error Message</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    class="h-6 w-6 p-0"
                    @click="copyToClipboard(error.message || '')"
                  >
                    <Icon name="lucide:copy" class="size-3" />
                  </Button>
                </div>
                <div class="p-2 bg-slate-50 dark:bg-slate-900 rounded font-mono text-xs break-all">
                  {{ error.message }}
                </div>
              </div>

              <div v-if="error.stack">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-slate-600 dark:text-slate-400">Stack Trace</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    class="h-6 w-6 p-0"
                    @click="copyToClipboard(error.stack || '')"
                  >
                    <Icon name="lucide:copy" class="size-3" />
                  </Button>
                </div>
                <pre class="text-xs bg-slate-50 dark:bg-slate-900 rounded p-3 overflow-auto max-h-40 font-mono border">{{ error.stack }}</pre>
              </div>

              <!-- URL Info -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-slate-600 dark:text-slate-400">Current URL</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    class="h-6 w-6 p-0"
                    @click="copyToClipboard(currentUrl)"
                  >
                    <Icon name="lucide:copy" class="size-3" />
                  </Button>
                </div>
                <div class="p-2 bg-slate-50 dark:bg-slate-900 rounded font-mono text-xs break-all">
                  {{ currentUrl }}
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

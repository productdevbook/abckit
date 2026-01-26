<script setup>
import { navigateTo } from '#app'
import { Icon } from '#components'
import { Button } from 'abckit/shadcn/button'
import { computed, ref } from 'vue'

const props = defineProps({
  error: { type: Object, required: true },
})
const isDev = import.meta.dev
const copied = ref(false)
const currentUrl = computed(() => import.meta.client ? window.location.href : 'N/A')
async function copyDebugInfo() {
  const debugData = {
    statusCode: props.error.statusCode,
    statusMessage: props.error.statusMessage,
    message: props.error.message,
    stack: props.error.stack,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
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
    }, 2e3)
  }
  catch (err) {
    console.error('Failed to copy debug info:', err)
  }
}
async function copyToClipboard(text) {
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
        emoji: '\u{1F511}',
        title: 'Authentication Required',
        description: 'You need to sign in or use a different account to perform this action.',
        primaryAction: 'Sign In',
        primaryHandler: switchUser,
      }
    case 403:
      return {
        emoji: '\u{1F510}',
        title: 'Access Denied',
        description: 'You need to sign in or use a different account to view this content.',
        primaryAction: 'Sign In',
        primaryHandler: switchUser,
      }
    case 404:
      return {
        emoji: '\u{1F914}',
        title: 'Page Not Found',
        description: 'The page you are looking for may have been deleted, moved, or you may have clicked an incorrect link.',
        primaryAction: 'Go to Home',
        primaryHandler: goHome,
      }
    case 500:
      return {
        emoji: '\u{1F614}',
        title: 'Something Went Wrong',
        description: 'A technical issue occurred on the server. Please try again in a few minutes.',
        primaryAction: 'Try Again',
        primaryHandler: retry,
      }
    default:
      return {
        emoji: '\u{1F615}',
        title: 'Unexpected Error',
        description: 'An error occurred. Try refreshing the page or go back to the home page.',
        primaryAction: 'Try Again',
        primaryHandler: retry,
      }
  }
}
function goHome() {
  if (props.error.statusCode === 403 || props.error.statusCode === 404) {
    if (import.meta.client) {
      window.location.href = '/'
      return
    }
  }
  navigateTo('/')
}
function goBack() {
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
  <div class="min-h-dvh bg-background flex flex-col safe-area-inset">
    <!-- Mobile App Header -->
    <header class="shrink-0 pt-safe-top border-b border-border/50">
      <div class="h-14 flex items-center justify-between relative">
        <!-- Back Button -->
        <Button
          variant="ghost"
          size="icon"
          class="size-14 rounded-none active:bg-muted transition-colors"
          @click="goBack"
        >
          <Icon name="lucide:chevron-left" class="size-6" />
        </Button>

        <!-- Center: Error Code Badge -->
        <div class="absolute left-1/2 -translate-x-1/2">
          <span class="px-3 py-1 bg-destructive/10 text-destructive text-sm font-medium rounded-full">
            {{ error.statusCode }}
          </span>
        </div>

        <!-- Home Button -->
        <Button
          variant="ghost"
          size="icon"
          class="size-14 rounded-none active:bg-muted transition-colors"
          @click="goHome"
        >
          <Icon name="lucide:home" class="size-5" />
        </Button>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 pb-8">
      <div class="w-full max-w-sm text-center space-y-6">
        <!-- Emoji Icon -->
        <div class="text-7xl select-none animate-bounce-slow">
          {{ getErrorData().emoji }}
        </div>

        <!-- Title & Description -->
        <div class="space-y-3">
          <h1 class="text-2xl font-bold text-foreground">
            {{ getErrorData().title }}
          </h1>
          <p class="text-base text-muted-foreground leading-relaxed">
            {{ getErrorData().description }}
          </p>
        </div>

        <!-- Help Text Card -->
        <div class="bg-muted/50 rounded-2xl p-4 text-sm text-muted-foreground">
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
    </div>

    <!-- Bottom Action Button (Mobile App Style) -->
    <div class="flex-shrink-0 px-6 pb-6 pt-2 space-y-4">
      <Button
        size="lg"
        class="w-full h-14 text-base font-semibold rounded-2xl"
        @click="getErrorData().primaryHandler"
      >
        {{ getErrorData().primaryAction }}
      </Button>

      <!-- Debug Panel (Development Only) -->
      <details v-if="isDev" class="bg-muted rounded-2xl">
        <summary class="cursor-pointer p-4 font-medium text-muted-foreground flex items-center justify-between rounded-2xl">
          <div class="flex items-center gap-2">
            <Icon name="lucide:bug" class="size-4" />
            Debug
          </div>
          <Button
            size="sm"
            variant="outline"
            class="h-8 px-3 text-xs rounded-xl"
            @click.stop="copyDebugInfo"
          >
            <Icon name="lucide:copy" class="size-3 mr-1" />
            {{ copied ? "Copied!" : "Copy" }}
          </Button>
        </summary>
        <div class="px-4 pb-4 space-y-3 text-sm">
          <div class="grid grid-cols-2 gap-3 p-3 bg-background rounded-xl">
            <div>
              <div class="text-muted-foreground text-xs mb-1">
                Status
              </div>
              <div class="font-mono text-foreground">
                {{ error.statusCode }}
              </div>
            </div>
            <div>
              <div class="text-muted-foreground text-xs mb-1">
                Time
              </div>
              <div class="font-mono text-foreground text-xs">
                {{ (/* @__PURE__ */ new Date()).toLocaleTimeString() }}
              </div>
            </div>
          </div>

          <div v-if="error.message" class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground text-xs">Message</span>
              <Button size="sm" variant="ghost" class="size-6 p-0" @click="copyToClipboard(error.message || '')">
                <Icon name="lucide:copy" class="size-3" />
              </Button>
            </div>
            <div class="p-2 bg-background rounded-xl font-mono text-xs break-all">
              {{ error.message }}
            </div>
          </div>

          <div v-if="error.stack" class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground text-xs">Stack</span>
              <Button size="sm" variant="ghost" class="size-6 p-0" @click="copyToClipboard(error.stack || '')">
                <Icon name="lucide:copy" class="size-3" />
              </Button>
            </div>
            <pre class="text-xs bg-background rounded-xl p-3 overflow-auto max-h-32 font-mono">{{ error.stack }}</pre>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

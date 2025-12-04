import type { PiniaColadaOptions } from '@pinia/colada'
import { PiniaColadaQueryHooksPlugin } from '@pinia/colada'
import { push } from 'notivue'
import { showError } from 'nuxt/app'

/**
 * Global Pinia Colada configuration for API error handling
 */
export default {
  plugins: [
    PiniaColadaQueryHooksPlugin({
      onSuccess(data: any, context: any) {
        // GraphQL can return errors even with HTTP 200
        // Check if there are errors in the response
        if (data?.errors?.length > 0) {
          const firstError = data.errors[0]
          const extensions = firstError.extensions || {}
          const statusCode = Number(extensions.code) || extensions.statusCode || 500

          // Critical errors (401) should use showError for full page error
          if (statusCode === 401) {
            showError({
              statusCode,
              statusMessage: firstError.message || 'Oturum süreniz doldu.',
              fatal: true,
            })
            return
          }

          // Client errors (4xx) should show toast notifications
          if (statusCode >= 400 && statusCode < 500) {
            push.error(firstError.message || 'Bir hata oluştu.')
            return
          }

          // Server errors (5xx) should use showError
          showError({
            statusCode,
            statusMessage: firstError.message || 'Sunucu hatası oluştu.',
            fatal: false,
          })
          return
        }

        // Show success notification for mutations only if no errors
        // Queries don't need success notifications usually
        if (context?.options?.mutation) {
          const successMessage = context?.options?.successMessage || 'İşlem başarıyla tamamlandı.'
          push.success(successMessage)
        }
      },
      onError(error: any) {
        // GraphQL errors (nitro-graphql format)
        if (error.graphQLErrors?.length > 0) {
          const firstError = error.graphQLErrors[0]
          const extensions = firstError.extensions || {}
          const statusCode = Number(extensions.code) || extensions.statusCode || 500

          // Critical errors (401) should use showError for full page error
          if (statusCode === 401) {
            showError({
              statusCode,
              statusMessage: firstError.message || 'Oturum süreniz doldu.',
              fatal: true,
            })
            return
          }

          // Client errors (4xx) should show toast notifications
          if (statusCode >= 400 && statusCode < 500) {
            push.error(firstError.message || 'Bir hata oluştu.')
            return
          }

          // Server errors (5xx) should use showError
          showError({
            statusCode,
            statusMessage: firstError.message || 'Sunucu hatası oluştu.',
            fatal: false,
          })
          return
        }

        // Network/Fetch errors
        const statusCode = error.response?.status || error.networkError?.statusCode || 500

        // Critical errors (401) should use showError for full page error
        if (statusCode === 401) {
          showError({
            statusCode,
            statusMessage: error.message || 'Oturum süreniz doldu.',
            fatal: true,
          })
          return
        }

        // Client errors (4xx) should show toast notifications
        if (statusCode >= 400 && statusCode < 500) {
          push.error(error.message || 'Bir hata oluştu.')
          return
        }

        // Server errors (5xx) should use showError
        showError({
          statusCode,
          statusMessage: error.message || 'Sunucu hatası oluştu.',
          fatal: false,
        })
      },
    }),
  ],

  queryOptions: {
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  },
} as PiniaColadaOptions

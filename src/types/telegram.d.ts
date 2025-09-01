// src/types/telegram.d.ts
export {}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string
        initDataUnsafe?: unknown
        ready?: () => void
      }
    }
  }
}

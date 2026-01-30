/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// 念のため（環境で型が拾えない時の保険）
declare module 'virtual:pwa-register' {
  export function registerSW(options?: any): (reloadPage?: boolean) => Promise<void>
}

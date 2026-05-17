
/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __APP_BUILD_NUMBER__: string;
declare const __APP_BUILD_TIMESTAMP__: string;

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_EMAIL_WEBHOOK_URL?: string
  readonly VITE_KINDLE_WEBHOOK_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

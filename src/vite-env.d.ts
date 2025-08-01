/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly OPENAI_API_KEY?: string
  readonly SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN?: string
  readonly SUPABASE_AUTH_EXTERNAL_APPLE_SECRET?: string
  readonly S3_HOST?: string
  readonly S3_REGION?: string
  readonly S3_ACCESS_KEY?: string
  readonly S3_SECRET_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

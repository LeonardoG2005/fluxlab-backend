export interface Env {
  NODE_ENV?: string;
  PORT?: string;
  HOST?: string;
  CORS_ORIGIN?: string;
  CORS_ORIGINS?: string;
  CORS_CREDENTIALS?: string;
  SWAGGER_ENABLED?: string;
  DATABASE_URL?: string;
  DB_SSL?: string;

  SUPABASE_HOST: string;
  SUPABASE_PORT: string;
  SUPABASE_DB: string;
  SUPABASE_USER: string;
  SUPABASE_PASSWORD: string;
  SUPABASE_PROJECT_ID: string;
  JWT_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

/**
 * Centralized configuration with runtime validation.
 * Validates all required environment variables on app initialization
 * and provides a typed config object.
 */

interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  phpApiUrl: string;
  aiProxyUrl: string | undefined;
  isDevelopment: boolean;
  isProduction: boolean;
}

function getRequiredEnvVar(name: string): string {
  const value = import.meta.env[name];
  if (!value || value === 'placeholder-key') {
    throw new Error(
      `[StockFlow Config] Missing required environment variable: ${name}. ` +
        `Please set ${name} in your .env file or deployment environment. ` +
        `See docs/deployment.md for configuration details.`,
    );
  }
  return value;
}

function getOptionalEnvVar(name: string, defaultValue?: string): string | undefined {
  const value = import.meta.env[name];
  return value || defaultValue;
}

function createConfig(): AppConfig {
  const mode = import.meta.env.MODE;
  const isDevelopment = mode === 'development';
  const isProduction = mode === 'production';

  // In development mode, allow fallback values for easier local setup
  const supabaseUrl = isDevelopment
    ? (import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321')
    : getRequiredEnvVar('VITE_SUPABASE_URL');

  const supabaseAnonKey = isDevelopment
    ? (import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key')
    : getRequiredEnvVar('VITE_SUPABASE_ANON_KEY');

  const phpApiUrl = getOptionalEnvVar('VITE_PHP_API_URL', 'http://localhost:8080') as string;
  const aiProxyUrl = getOptionalEnvVar('VITE_AI_PROXY_URL');

  return {
    supabaseUrl,
    supabaseAnonKey,
    phpApiUrl,
    aiProxyUrl,
    isDevelopment,
    isProduction,
  };
}

/**
 * Application configuration singleton.
 * Throws descriptive errors if required environment variables are missing in production.
 */
export const config: AppConfig = createConfig();

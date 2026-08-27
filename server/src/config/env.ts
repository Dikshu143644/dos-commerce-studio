import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stockflow_crm_erp',
  JWT_SECRET: process.env.JWT_SECRET || 'stockflow_super_secret_jwt_key_2026_enterprise',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'stockflow_super_refresh_jwt_key_2026_enterprise',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
};

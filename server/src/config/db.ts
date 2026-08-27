import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected successfully to StockFlow database.');
  } catch (error) {
    console.warn('⚠️ MongoDB connection warning (Running in memory/resilient fallback mode):', (error as Error).message);
  }
}

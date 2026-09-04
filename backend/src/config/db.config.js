import mongoose from 'mongoose';
import config from './env.config.js';
import User from '../models/user.model.js';
import { syncFromStoreToMongo } from '../services/storageService.js';

export const seedDefaultUsers = async () => {
  try {
    await syncFromStoreToMongo(mongoose);
    console.log('✅ Persistent store and demo accounts synced successfully.');
  } catch (err) {
    console.warn('⚠️ User seed notice:', err.message);
  }
};

export const connectDB = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 3000,
    };
    
    await mongoose.connect(config.mongodbUri, options);
    console.log(`🍃 MongoDB Connected: ${mongoose.connection.host}`);
    await seedDefaultUsers();
  } catch (error) {
    console.warn(`⚠️ Primary MongoDB Connection Error: ${error.message}`);
    
    if (config.isDev) {
      try {
        console.log('🔄 Launching MongoMemoryServer fallback for development testing...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);
        console.log(`🍃 MongoDB Memory Server Connected: ${uri}`);
        await seedDefaultUsers();
        return;
      } catch (memErr) {
        console.error('❌ MongoMemoryServer Fallback Failed:', memErr.message);
      }
    }
    
    console.error('❌ Failed to establish database connection.');
  }
};

export default connectDB;


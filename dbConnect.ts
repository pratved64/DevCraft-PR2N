// src/lib/dbConnect.ts
import mongoose from 'mongoose';

// Grab the connection string from your environment variables
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    // 1. If a connection already exists in the cache, return it immediately
    if (cached.conn) {
        return cached.conn;
    }

    // 2. If a connection is not already in progress, start one
    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // Disable Mongoose buffering; fail fast if not connected
        };

        cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
            console.log('✅ MongoDB connection established');
            return mongoose;
        });
    }

    // 3. Await the promise and assign it to the cached connection object
    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnect;

/*
Use this as follows:
- src/app/api/scans/route.ts (example path)
import dbConnect from '@/lib/dbConnect';
import { ScanEvent } from '@/models/ScanEvent';

export async function GET() {
  await dbConnect(); // Bootstraps or retrieves the active connection
  
  -- do sumn --
}
*/
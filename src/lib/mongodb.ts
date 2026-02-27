/**
 * MongoDB Connection Utility
 *
 * Maintains a cached connection across hot-reloads in development.
 * Uses mongoose (already in package.json).
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aurelion';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

/**
 * Global cache so hot module replacement in dev doesn't
 * open a new connection pool on every request.
 */
interface MongoCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoCache: MongoCache | undefined;
}

const cached: MongoCache = global._mongoCache ?? { conn: null, promise: null };
if (!global._mongoCache) global._mongoCache = cached;

/** Get (or create) a mongoose connection */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((m) => {
        console.log('[MongoDB] Connected to', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));
        return m;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;

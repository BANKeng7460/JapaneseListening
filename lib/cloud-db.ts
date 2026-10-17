import { MongoClient } from 'mongodb';

const shared = globalThis as typeof globalThis & { kikuMongo?: Promise<MongoClient> };
export async function database() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Database is not configured');
  if (!shared.kikuMongo) shared.kikuMongo = new MongoClient(uri, { serverSelectionTimeoutMS: 8000, maxPoolSize: 5 }).connect().catch(error => { shared.kikuMongo = undefined; throw error; });
  return (await shared.kikuMongo).db('japanese_listening');
}

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://Ritik:Ritik9060@tdm.uwkxmdo.mongodb.net/?appName=TDM";
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Removed the build-time throw error to fix Vercel/Cloudflare deployment.
// The URI will fallback to the hardcoded connection string if env is missing.

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

/**
 * Helper to get the database instance
 */
export async function getDb() {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME || "TDM");
}

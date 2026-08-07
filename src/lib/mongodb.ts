import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://guruarning_db_user:XgmcHOGP4ZeJr297@upi-db.x5eombm.mongodb.net";
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

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
  return client.db(process.env.MONGODB_DB_NAME || "upi-db");
}

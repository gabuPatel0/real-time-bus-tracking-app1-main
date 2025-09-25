import { MongoClient, Db, ObjectId } from "mongodb";

let client: MongoClient;
let database: Db;

async function connectToMongoDB() {
  if (!client) {
    const uri = process.env.DATABASE_URL || "mongodb://localhost:27017/bus_tracking";
    client = new MongoClient(uri);
    await client.connect();
    database = client.db();
    console.log("Connected to MongoDB (lib/db)");
  }
  return database;
}

// MongoDB helper functions for lib/db compatibility
export async function queryOne<T = any>(collection: string, filter: any): Promise<T | null> {
  const db = await connectToMongoDB();
  return await db.collection(collection).findOne(filter) as T | null;
}

export async function queryAll<T = any>(collection: string, filter: any = {}, options: any = {}): Promise<T[]> {
  const db = await connectToMongoDB();
  return await db.collection(collection).find(filter, options).toArray() as T[];
}

export async function exec(collection: string, operation: string, data: any): Promise<any> {
  const db = await connectToMongoDB();
  switch (operation) {
    case 'insertOne':
      return await db.collection(collection).insertOne({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    case 'updateOne':
      return await db.collection(collection).updateOne(data.filter, {
        ...data.update,
        $set: { ...data.update.$set, updatedAt: new Date() }
      });
    case 'deleteOne':
      return await db.collection(collection).deleteOne(data);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

export async function rawQueryAll<T = any>(collection: string, pipeline: any[]): Promise<T[]> {
  const db = await connectToMongoDB();
  return await db.collection(collection).aggregate(pipeline).toArray() as T[];
}

export default {
  queryOne,
  queryAll,
  rawQueryAll,
  exec,
  ObjectId
};

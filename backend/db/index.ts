import { MongoClient, Db, Collection, ObjectId, InsertOneResult, UpdateResult, DeleteResult } from "mongodb";

let client: MongoClient;
let database: Db;

async function connectToMongoDB() {
  if (!client) {
    const uri = process.env.DATABASE_URL || "mongodb://localhost:27017/bus_tracking";
    client = new MongoClient(uri);
    await client.connect();
    database = client.db();
    console.log("Connected to MongoDB");
  }
  return database;
}

// MongoDB Collections
export const getCollections = async () => {
  const database = await connectToMongoDB();
  return {
    users: database.collection('users'),
    routes: database.collection('routes'),
    rides: database.collection('rides'),
    locationUpdates: database.collection('locationUpdates')
  };
};

// Helper functions for common operations
export const mongoDb = {
  // Find one document
  async findOne<T = any>(collection: string, filter: any): Promise<T | null> {
    const db = await connectToMongoDB();
    return await db.collection(collection).findOne(filter) as T | null;
  },

  // Find multiple documents
  async findMany<T = any>(collection: string, filter: any = {}, options: any = {}): Promise<T[]> {
    const db = await connectToMongoDB();
    return await db.collection(collection).find(filter, options).toArray() as T[];
  },

  // Insert one document
  async insertOne(collection: string, document: any): Promise<InsertOneResult> {
    const db = await connectToMongoDB();
    const now = new Date();
    const docWithTimestamps = {
      ...document,
      createdAt: now,
      updatedAt: now
    };
    return await db.collection(collection).insertOne(docWithTimestamps);
  },

  // Update one document
  async updateOne(collection: string, filter: any, update: any): Promise<UpdateResult> {
    const db = await connectToMongoDB();
    const updateWithTimestamp = {
      ...update,
      $set: {
        ...update.$set,
        updatedAt: new Date()
      }
    };
    return await db.collection(collection).updateOne(filter, updateWithTimestamp);
  },

  // Delete one document
  async deleteOne(collection: string, filter: any): Promise<DeleteResult> {
    const db = await connectToMongoDB();
    return await db.collection(collection).deleteOne(filter);
  },

  // Count documents
  async count(collection: string, filter: any = {}): Promise<number> {
    const db = await connectToMongoDB();
    return await db.collection(collection).countDocuments(filter);
  },

  // Aggregate pipeline
  async aggregate<T = any>(collection: string, pipeline: any[]): Promise<T[]> {
    const db = await connectToMongoDB();
    return await db.collection(collection).aggregate(pipeline).toArray() as T[];
  }
};

// Legacy compatibility layer for existing code
const db = {
  // Simulate SQL-like queries for easier migration
  async queryRow<T = any>(filter: any, collection: string = 'users'): Promise<T | null> {
    return await mongoDb.findOne<T>(collection, filter);
  },

  async queryAll<T = any>(filter: any = {}, collection: string = 'users'): Promise<T[]> {
    return await mongoDb.findMany<T>(collection, filter);
  },

  async exec(operation: string, data: any, collection: string = 'users'): Promise<any> {
    switch (operation) {
      case 'insert':
        return await mongoDb.insertOne(collection, data);
      case 'update':
        return await mongoDb.updateOne(collection, data.filter, data.update);
      case 'delete':
        return await mongoDb.deleteOne(collection, data);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  },

  // Direct access to MongoDB operations
  mongo: mongoDb,
  collections: getCollections,
  ObjectId: ObjectId
};

export default db;

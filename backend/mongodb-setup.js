// MongoDB Setup Script for Real-time Bus Tracking App
// Run this script to set up collections and indexes

const { MongoClient } = require('mongodb');

async function setupDatabase() {
  const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/bus_tracking';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();

    // Create collections with validation schemas
    
    // Users collection
    await db.createCollection('users', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['email', 'passwordHash', 'role', 'name'],
          properties: {
            email: {
              bsonType: 'string',
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            },
            passwordHash: { bsonType: 'string' },
            role: { 
              bsonType: 'string',
              enum: ['driver', 'user']
            },
            name: { bsonType: 'string' },
            phone: { bsonType: ['string', 'null'] },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });

    // Routes collection
    await db.createCollection('routes', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['driverId', 'name', 'startLocation', 'endLocation'],
          properties: {
            driverId: { bsonType: 'objectId' },
            name: { bsonType: 'string' },
            description: { bsonType: ['string', 'null'] },
            startLocation: { bsonType: 'string' },
            endLocation: { bsonType: 'string' },
            estimatedDurationMinutes: { bsonType: ['int', 'null'] },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });

    // Rides collection
    await db.createCollection('rides', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['routeId', 'driverId', 'status'],
          properties: {
            routeId: { bsonType: 'objectId' },
            driverId: { bsonType: 'objectId' },
            status: {
              bsonType: 'string',
              enum: ['pending', 'in_progress', 'ended']
            },
            startedAt: { bsonType: ['date', 'null'] },
            endedAt: { bsonType: ['date', 'null'] },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });

    // Location updates collection
    await db.createCollection('locationUpdates', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['rideId', 'latitude', 'longitude', 'timestamp'],
          properties: {
            rideId: { bsonType: 'objectId' },
            latitude: { 
              bsonType: 'double',
              minimum: -90,
              maximum: 90
            },
            longitude: { 
              bsonType: 'double',
              minimum: -180,
              maximum: 180
            },
            timestamp: { bsonType: 'date' },
            speed: { bsonType: ['double', 'null'] },
            heading: { bsonType: ['double', 'null'] },
            accuracy: { bsonType: ['double', 'null'] },
            altitude: { bsonType: ['double', 'null'] }
          }
        }
      }
    });

    // Create indexes for performance
    
    // Users indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    
    // Routes indexes
    await db.collection('routes').createIndex({ driverId: 1 });
    await db.collection('routes').createIndex({ createdAt: -1 });
    
    // Rides indexes
    await db.collection('rides').createIndex({ routeId: 1 });
    await db.collection('rides').createIndex({ driverId: 1 });
    await db.collection('rides').createIndex({ status: 1 });
    await db.collection('rides').createIndex({ startedAt: -1 });
    
    // Location updates indexes
    await db.collection('locationUpdates').createIndex({ rideId: 1 });
    await db.collection('locationUpdates').createIndex({ timestamp: -1 });
    await db.collection('locationUpdates').createIndex({ 
      latitude: 1, 
      longitude: 1 
    });
    
    // TTL index for location updates (auto-delete after 30 days)
    await db.collection('locationUpdates').createIndex(
      { timestamp: 1 }, 
      { expireAfterSeconds: 30 * 24 * 60 * 60 }
    );

    // Insert sample data
    const users = await db.collection('users').insertMany([
      {
        email: 'driver1@example.com',
        passwordHash: '$2a$10$example.hash.for.password123',
        role: 'driver',
        name: 'John Driver',
        phone: '+1234567890',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'user1@example.com',
        passwordHash: '$2a$10$example.hash.for.password123',
        role: 'user',
        name: 'Jane User',
        phone: '+0987654321',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const driverId = users.insertedIds[0];

    await db.collection('routes').insertMany([
      {
        driverId: driverId,
        name: 'Downtown Express',
        description: 'Fast route through downtown area',
        startLocation: 'Central Station',
        endLocation: 'Business District',
        estimatedDurationMinutes: 25,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        driverId: driverId,
        name: 'University Loop',
        description: 'Route serving university campus',
        startLocation: 'Main Campus',
        endLocation: 'Student Housing',
        estimatedDurationMinutes: 15,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    console.log('MongoDB setup completed successfully!');
    console.log('Collections created: users, routes, rides, locationUpdates');
    console.log('Indexes created for optimal performance');
    console.log('Sample data inserted');

  } catch (error) {
    console.error('Error setting up MongoDB:', error);
  } finally {
    await client.close();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  require('dotenv').config();
  setupDatabase();
}

module.exports = { setupDatabase };

// Requirements: 2.1, 2.5 - MongoDB connection utility with connection pooling

import { MongoClient, Db, Collection, MongoClientOptions } from 'mongodb';
import type { VerificationResult } from '@/lib/verification/types';

/**
 * MongoDB document type for verification results
 * Extends VerificationResult with MongoDB-specific _id field
 */
export interface VerificationResultDocument extends VerificationResult {
  _id?: import('mongodb').ObjectId;
}

// Global variable to cache the MongoDB client across hot reloads in development
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// MongoDB connection configuration
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'packmate';
const VERIFICATION_COLLECTION_NAME = 'verification_results';

// Connection options for optimal performance
const clientOptions: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

// Cached client promise for connection pooling
let clientPromise: Promise<MongoClient> | undefined;

/**
 * Error thrown when MONGODB_URI environment variable is not set
 */
export class MongoDBConfigError extends Error {
  constructor() {
    super(
      'MONGODB_URI environment variable is not set. ' +
      'Please add MONGODB_URI to your .env.local file.'
    );
    this.name = 'MongoDBConfigError';
  }
}

/**
 * Get the MongoDB client with connection pooling
 * Uses a cached promise to ensure only one connection is created
 * 
 * @returns Promise resolving to the MongoDB client
 * @throws MongoDBConfigError if MONGODB_URI is not set
 */
export async function getMongoClient(): Promise<MongoClient> {
  if (!MONGODB_URI) {
    throw new MongoDBConfigError();
  }

  // In development, use a global variable to preserve the client across hot reloads
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(MONGODB_URI, clientOptions);
      global._mongoClientPromise = client.connect();
    }
    return global._mongoClientPromise;
  }

  // In production, use module-level caching
  if (!clientPromise) {
    const client = new MongoClient(MONGODB_URI, clientOptions);
    clientPromise = client.connect();
  }

  return clientPromise;
}

/**
 * Get the Packmate database instance
 * 
 * @returns Promise resolving to the database instance
 * @throws MongoDBConfigError if MONGODB_URI is not set
 */
export async function getDatabase(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(DATABASE_NAME);
}

/**
 * Get the verification results collection with proper typing
 * 
 * @returns Promise resolving to the typed collection
 * @throws MongoDBConfigError if MONGODB_URI is not set
 */
export async function getVerificationCollection(): Promise<Collection<VerificationResultDocument>> {
  const db = await getDatabase();
  return db.collection<VerificationResultDocument>(VERIFICATION_COLLECTION_NAME);
}

/**
 * Initialize the database with required indexes
 * Should be called once during application startup or first connection
 * 
 * Creates the following indexes:
 * - { appId: 1, packageManagerId: 1, timestamp: -1 } - For latest status lookup
 * - { manualReviewFlag: 1, timestamp: -1 } - For admin review queries
 * - { timestamp: -1 } - For audit/history queries
 * 
 * @returns Promise that resolves when indexes are created
 * @throws MongoDBConfigError if MONGODB_URI is not set
 */
export async function initializeDatabase(): Promise<void> {
  const collection = await getVerificationCollection();

  // Create indexes for efficient queries
  await Promise.all([
    // Index for latest status lookup by app and package manager
    collection.createIndex(
      { appId: 1, packageManagerId: 1, timestamp: -1 },
      { name: 'idx_app_pm_timestamp' }
    ),
    // Index for admin review queries (flagged packages)
    collection.createIndex(
      { manualReviewFlag: 1, timestamp: -1 },
      { name: 'idx_manual_review_timestamp' }
    ),
    // Index for audit/history queries
    collection.createIndex(
      { timestamp: -1 },
      { name: 'idx_timestamp' }
    ),
  ]);
}

/**
 * Check if the MongoDB connection is healthy
 * Useful for health check endpoints
 * 
 * @returns Promise resolving to true if connected, false otherwise
 */
export async function isConnected(): Promise<boolean> {
  try {
    if (!MONGODB_URI) {
      return false;
    }
    const client = await getMongoClient();
    await client.db(DATABASE_NAME).command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Close the MongoDB connection
 * Should be called during graceful shutdown
 * 
 * @returns Promise that resolves when connection is closed
 */
export async function closeConnection(): Promise<void> {
  if (clientPromise) {
    const client = await clientPromise;
    await client.close();
    clientPromise = undefined;
  }
  
  if (global._mongoClientPromise) {
    const client = await global._mongoClientPromise;
    await client.close();
    global._mongoClientPromise = undefined;
  }
}

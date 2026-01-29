// Tests for MongoDB connection utility
// Requirements: 2.1, 2.5

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create mock objects
const mockCollection = {
  createIndex: vi.fn().mockResolvedValue('index_name'),
};

const mockDb = {
  collection: vi.fn().mockReturnValue(mockCollection),
  command: vi.fn().mockResolvedValue({ ok: 1 }),
};

const mockClient = {
  connect: vi.fn().mockImplementation(function() {
    return Promise.resolve(mockClient);
  }),
  db: vi.fn().mockReturnValue(mockDb),
  close: vi.fn().mockResolvedValue(undefined),
};

// Mock the mongodb module before importing the module under test
vi.mock('mongodb', () => {
  return {
    MongoClient: vi.fn().mockImplementation(function() {
      return mockClient;
    }),
    ObjectId: vi.fn(),
  };
});

describe('MongoDB Connection Utility', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    // Clear global cache
    if (global._mongoClientPromise) {
      global._mongoClientPromise = undefined;
    }
    // Reset mock call counts
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
  
  describe('MongoDBConfigError', () => {
    it('should have correct error name and message', async () => {
      // Set MONGODB_URI to undefined to trigger the error
      delete process.env.MONGODB_URI;
      
      const { MongoDBConfigError } = await import('@/lib/db/mongodb');
      const error = new MongoDBConfigError();
      
      expect(error.name).toBe('MongoDBConfigError');
      expect(error.message).toContain('MONGODB_URI environment variable is not set');
    });
  });
  
  describe('getMongoClient', () => {
    it('should throw MongoDBConfigError when MONGODB_URI is not set', async () => {
      delete process.env.MONGODB_URI;
      
      const { getMongoClient, MongoDBConfigError } = await import('@/lib/db/mongodb');
      
      await expect(getMongoClient()).rejects.toThrow(MongoDBConfigError);
    });
    
    it('should return a client when MONGODB_URI is set', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      
      const { getMongoClient } = await import('@/lib/db/mongodb');
      const client = await getMongoClient();
      
      expect(client).toBeDefined();
      expect(client.db).toBeDefined();
    });
  });
  
  describe('getDatabase', () => {
    it('should throw MongoDBConfigError when MONGODB_URI is not set', async () => {
      delete process.env.MONGODB_URI;
      
      const { getDatabase, MongoDBConfigError } = await import('@/lib/db/mongodb');
      
      await expect(getDatabase()).rejects.toThrow(MongoDBConfigError);
    });
    
    it('should return a database instance when MONGODB_URI is set', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      
      const { getDatabase } = await import('@/lib/db/mongodb');
      const db = await getDatabase();
      
      expect(db).toBeDefined();
      expect(db.collection).toBeDefined();
    });
  });
  
  describe('getVerificationCollection', () => {
    it('should throw MongoDBConfigError when MONGODB_URI is not set', async () => {
      delete process.env.MONGODB_URI;
      
      const { getVerificationCollection, MongoDBConfigError } = await import('@/lib/db/mongodb');
      
      await expect(getVerificationCollection()).rejects.toThrow(MongoDBConfigError);
    });
    
    it('should return a typed collection when MONGODB_URI is set', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      
      const { getVerificationCollection } = await import('@/lib/db/mongodb');
      const collection = await getVerificationCollection();
      
      expect(collection).toBeDefined();
      expect(collection.createIndex).toBeDefined();
    });
  });
  
  describe('initializeDatabase', () => {
    it('should create required indexes', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      
      const { initializeDatabase } = await import('@/lib/db/mongodb');
      
      await initializeDatabase();
      
      // Verify createIndex was called for each index
      expect(mockCollection.createIndex).toHaveBeenCalledTimes(3);
      
      // Verify the index configurations
      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { appId: 1, packageManagerId: 1, timestamp: -1 },
        { name: 'idx_app_pm_timestamp' }
      );
      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { manualReviewFlag: 1, timestamp: -1 },
        { name: 'idx_manual_review_timestamp' }
      );
      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { timestamp: -1 },
        { name: 'idx_timestamp' }
      );
    });
  });
  
  describe('isConnected', () => {
    it('should return false when MONGODB_URI is not set', async () => {
      delete process.env.MONGODB_URI;
      
      const { isConnected } = await import('@/lib/db/mongodb');
      const connected = await isConnected();
      
      expect(connected).toBe(false);
    });
    
    it('should return true when connection is healthy', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      
      const { isConnected } = await import('@/lib/db/mongodb');
      const connected = await isConnected();
      
      expect(connected).toBe(true);
    });
  });
  
  describe('closeConnection', () => {
    it('should close the connection without error', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      
      const { getMongoClient, closeConnection } = await import('@/lib/db/mongodb');
      
      // First establish a connection
      await getMongoClient();
      
      // Then close it
      await expect(closeConnection()).resolves.not.toThrow();
    });
    
    it('should handle closing when no connection exists', async () => {
      const { closeConnection } = await import('@/lib/db/mongodb');
      
      // Should not throw even when no connection exists
      await expect(closeConnection()).resolves.not.toThrow();
    });
  });
});

describe('VerificationResultDocument type', () => {
  it('should extend VerificationResult with optional _id', async () => {
    // Type check - this is a compile-time check
    // The document should have all VerificationResult fields plus optional _id
    const doc: import('@/lib/db/mongodb').VerificationResultDocument = {
      appId: 'firefox',
      packageManagerId: 'homebrew',
      packageName: '--cask firefox',
      status: 'verified',
      timestamp: new Date().toISOString(),
      // _id is optional
    };
    
    expect(doc.appId).toBe('firefox');
    expect(doc._id).toBeUndefined();
  });
});

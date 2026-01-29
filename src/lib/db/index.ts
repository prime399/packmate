// Database utilities barrel export
// Requirements: 2.1, 2.5

export {
  getMongoClient,
  getDatabase,
  getVerificationCollection,
  initializeDatabase,
  isConnected,
  closeConnection,
  MongoDBConfigError,
  type VerificationResultDocument,
} from './mongodb';

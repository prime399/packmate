// Requirements: 1.6, 2.1, 2.2, 2.5, 3.3, 7.2, 7.3 - Core VerificationService class
// Handles package verification routing, unverifiable package managers, result storage,
// and retry mechanism with exponential backoff

import type { PackageManagerId } from '@/lib/data';
import type { MongoClient, Collection } from 'mongodb';
import type {
  PackageVerifier,
  VerificationResult,
  VerificationSummary,
} from '@/lib/verification/types';
import {
  VERIFIABLE_MANAGERS,
  UNVERIFIABLE_MANAGERS,
} from '@/lib/verification/types';
import { getVerifier } from '@/lib/verification/verifiers';
import type { VerificationResultDocument } from '@/lib/db/mongodb';
import { RateLimitError, NetworkError } from '@/lib/verification/verifiers/homebrew';

/**
 * Name of the MongoDB collection for verification results
 */
const VERIFICATION_COLLECTION_NAME = 'verification_results';

/**
 * Core service for verifying package existence across package managers
 * 
 * Responsibilities:
 * - Route verification requests to appropriate verifiers
 * - Handle unverifiable package managers (return 'unverifiable' status)
 * - Generate ISO 8601 timestamps for results
 * - Set appId in results (verifiers return empty appId)
 * - Retry failed requests with exponential backoff
 * 
 * Note: Storage methods and batch verification
 * will be implemented in subsequent tasks.
 */
export class VerificationService {
  private verifiers: Map<PackageManagerId, PackageVerifier>;
  private db: MongoClient | null;

  /**
   * Default maximum number of retry attempts for failed API calls
   */
  static readonly DEFAULT_MAX_RETRIES = 3;

  /**
   * Base delay in milliseconds for exponential backoff (1 second)
   */
  static readonly BASE_DELAY_MS = 1000;

  /**
   * Package managers that have public APIs for verification
   */
  static readonly VERIFIABLE_MANAGERS: PackageManagerId[] = VERIFIABLE_MANAGERS;

  /**
   * Package managers without public APIs (will return 'unverifiable' status)
   */
  static readonly UNVERIFIABLE_MANAGERS: PackageManagerId[] = UNVERIFIABLE_MANAGERS;

  /**
   * Creates a new VerificationService instance
   * 
   * @param mongoClient - Optional MongoDB client for result storage
   *                      (storage methods will be implemented in task 4.3)
   */
  constructor(mongoClient?: MongoClient | null) {
    this.db = mongoClient ?? null;
    
    // Initialize verifiers map with all verifiable package managers
    this.verifiers = new Map();
    for (const pmId of VERIFIABLE_MANAGERS) {
      const verifier = getVerifier(pmId);
      if (verifier) {
        this.verifiers.set(pmId, verifier);
      }
    }
  }

  /**
   * Verifies that a package exists in its package manager repository
   * 
   * For verifiable package managers (homebrew, chocolatey, winget, flatpak, snap),
   * this method queries the appropriate API to check if the package exists.
   * 
   * For unverifiable package managers (macports, apt, dnf, pacman, zypper, scoop),
   * this method returns a result with status 'unverifiable' since these package
   * managers don't have public APIs for verification.
   * 
   * If a previously verified package now fails verification, the manualReviewFlag
   * is set to true to indicate that an administrator should investigate.
   * 
   * @param appId - The application ID (e.g., "firefox", "vscode")
   * @param packageManagerId - The package manager ID (e.g., "homebrew", "apt")
   * @param packageName - The package name in the package manager (e.g., "--cask firefox")
   * @param options - Optional configuration for verification behavior
   * @param options.storeResult - Whether to store the result in MongoDB (default: true if MongoDB is configured)
   * @returns VerificationResult with status, timestamp, and optional error message
   * 
   * @example
   * ```typescript
   * const service = new VerificationService();
   * 
   * // Verifiable package manager
   * const result = await service.verifyPackage('firefox', 'homebrew', '--cask firefox');
   * // result.status === 'verified' or 'failed'
   * 
   * // Unverifiable package manager
   * const result2 = await service.verifyPackage('firefox', 'apt', 'firefox');
   * // result2.status === 'unverifiable'
   * 
   * // Status regression detection
   * // If previous status was 'verified' and new status is 'failed':
   * // result.manualReviewFlag === true
   * ```
   * 
   * Requirements: 1.6, 2.1, 2.4
   */
  async verifyPackage(
    appId: string,
    packageManagerId: PackageManagerId,
    packageName: string,
    options?: { storeResult?: boolean }
  ): Promise<VerificationResult> {
    // Check if package manager is unverifiable
    if (VerificationService.UNVERIFIABLE_MANAGERS.includes(packageManagerId)) {
      return this.createUnverifiableResult(appId, packageManagerId, packageName);
    }

    // Get the verifier for this package manager
    const verifier = this.verifiers.get(packageManagerId);
    if (!verifier) {
      // No verifier available - treat as unverifiable
      return this.createUnverifiableResult(appId, packageManagerId, packageName);
    }

    // Execute verification with retry mechanism for transient errors
    // Requirements: 3.3, 7.2, 7.3 - Retry up to 3 times with exponential backoff
    const result = await this.executeWithRetry(
      () => verifier.verify(packageName)
    );

    // Set the appId (verifiers return empty appId)
    result.appId = appId;

    // Check for status regression (verified → failed) and set manual review flag
    // Requirements: 2.4 - WHEN a verification fails for a previously verified package,
    // THE Verification_Service SHALL set the Manual_Review_Flag to true
    if (result.status === 'failed') {
      const previousResult = await this.getLatestResult(appId, packageManagerId);
      if (previousResult?.status === 'verified') {
        result.manualReviewFlag = true;
      }
    }

    // Store the result if MongoDB is configured and storage is enabled
    const shouldStore = options?.storeResult ?? true;
    if (shouldStore && this.db) {
      await this.storeResult(result);
    }

    return result;
  }

  /**
   * Creates a verification result for unverifiable package managers
   * 
   * Unverifiable package managers (macports, apt, dnf, pacman, zypper, scoop)
   * don't have public APIs, so we return a result with status 'unverifiable'
   * to indicate that verification is not possible.
   * 
   * @param appId - The application ID
   * @param packageManagerId - The package manager ID
   * @param packageName - The package name
   * @returns VerificationResult with status 'unverifiable'
   */
  private createUnverifiableResult(
    appId: string,
    packageManagerId: PackageManagerId,
    packageName: string
  ): VerificationResult {
    return {
      appId,
      packageManagerId,
      packageName,
      status: 'unverifiable',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if a package manager is verifiable
   * 
   * @param packageManagerId - The package manager ID to check
   * @returns true if the package manager has a public API for verification
   */
  isVerifiable(packageManagerId: PackageManagerId): boolean {
    return VerificationService.VERIFIABLE_MANAGERS.includes(packageManagerId);
  }

  /**
   * Check if a package manager is unverifiable
   * 
   * @param packageManagerId - The package manager ID to check
   * @returns true if the package manager does not have a public API
   */
  isUnverifiable(packageManagerId: PackageManagerId): boolean {
    return VerificationService.UNVERIFIABLE_MANAGERS.includes(packageManagerId);
  }

  /**
   * Get the MongoDB client (if configured)
   * Used by storage methods (to be implemented in task 4.3)
   */
  getDbClient(): MongoClient | null {
    return this.db;
  }

  /**
   * Stores a verification result in MongoDB
   * 
   * Each verification creates a new document to maintain history for audit purposes.
   * The timestamp is generated in ISO 8601 format.
   * 
   * @param result - The verification result to store
   * @returns Promise that resolves when the result is stored, or immediately if MongoDB is not configured
   * 
   * @example
   * ```typescript
   * const service = new VerificationService(mongoClient);
   * await service.storeResult({
   *   appId: 'firefox',
   *   packageManagerId: 'homebrew',
   *   packageName: '--cask firefox',
   *   status: 'verified',
   *   timestamp: new Date().toISOString()
   * });
   * ```
   * 
   * Requirements: 2.1, 2.2, 2.5
   */
  async storeResult(result: VerificationResult): Promise<void> {
    // If MongoDB client is not configured, return gracefully
    if (!this.db) {
      return;
    }

    try {
      const collection = this.getVerificationCollection();
      
      // Ensure timestamp is in ISO 8601 format
      const document: VerificationResultDocument = {
        ...result,
        timestamp: this.ensureISO8601Timestamp(result.timestamp),
      };

      await collection.insertOne(document);
    } catch (error) {
      // Log error but don't throw - storage failures shouldn't break verification
      console.error('Failed to store verification result:', error);
    }
  }

  /**
   * Fetches the most recent verification result for an app and package manager combination
   * 
   * Uses the compound index on { appId, packageManagerId, timestamp } for efficient lookup.
   * Returns null if no previous result exists or if MongoDB is not configured.
   * 
   * @param appId - The application ID (e.g., "firefox", "vscode")
   * @param packageManagerId - The package manager ID (e.g., "homebrew", "chocolatey")
   * @returns Promise resolving to the latest VerificationResult or null
   * 
   * @example
   * ```typescript
   * const service = new VerificationService(mongoClient);
   * const latest = await service.getLatestResult('firefox', 'homebrew');
   * if (latest) {
   *   console.log(`Last verified: ${latest.timestamp}, status: ${latest.status}`);
   * }
   * ```
   * 
   * Requirements: 2.1, 2.5
   */
  async getLatestResult(
    appId: string,
    packageManagerId: PackageManagerId
  ): Promise<VerificationResult | null> {
    // If MongoDB client is not configured, return null
    if (!this.db) {
      return null;
    }

    try {
      const collection = this.getVerificationCollection();
      
      // Find the most recent result for this app/package manager combination
      // Uses the compound index: { appId: 1, packageManagerId: 1, timestamp: -1 }
      const document = await collection.findOne(
        { appId, packageManagerId },
        { sort: { timestamp: -1 } }
      );

      if (!document) {
        return null;
      }

      // Convert document to VerificationResult (remove MongoDB _id)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...result } = document;
      return result as VerificationResult;
    } catch (error) {
      // Log error but don't throw - read failures shouldn't break verification
      console.error('Failed to fetch latest verification result:', error);
      return null;
    }
  }

  /**
   * Gets the verification results collection from MongoDB
   * 
   * @returns The typed MongoDB collection for verification results
   * @private
   */
  private getVerificationCollection(): Collection<VerificationResultDocument> {
    if (!this.db) {
      throw new Error('MongoDB client is not configured');
    }
    return this.db.db('packmate').collection<VerificationResultDocument>(VERIFICATION_COLLECTION_NAME);
  }

  /**
   * Ensures a timestamp is in ISO 8601 format
   * 
   * If the timestamp is already valid ISO 8601, returns it as-is.
   * Otherwise, attempts to parse and convert to ISO 8601.
   * Falls back to current time if parsing fails.
   * 
   * @param timestamp - The timestamp to validate/convert
   * @returns A valid ISO 8601 timestamp string
   * @private
   * 
   * Requirements: 2.2
   */
  private ensureISO8601Timestamp(timestamp: string): string {
    // Check if already valid ISO 8601
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
    if (iso8601Regex.test(timestamp)) {
      return timestamp;
    }

    // Try to parse and convert
    try {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch {
      // Fall through to default
    }

    // Fall back to current time
    return new Date().toISOString();
  }

  /**
   * Generates a new ISO 8601 timestamp
   * 
   * @returns Current time in ISO 8601 format
   * 
   * Requirements: 2.2
   */
  static generateTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Checks if an error is retryable (should trigger a retry attempt)
   * 
   * Retryable errors include:
   * - RateLimitError (429 status code)
   * - NetworkError (network failures)
   * - HTTP 5xx server errors
   * - Timeout errors
   * 
   * Non-retryable errors include:
   * - HTTP 404 (package not found - this is a definitive answer)
   * - HTTP 400 (bad request - client error)
   * - Other client errors (4xx except 429)
   * 
   * @param error - The error to check
   * @returns true if the error should trigger a retry
   * 
   * Requirements: 3.3, 7.2, 7.3
   */
  static isRetryableError(error: unknown): boolean {
    // RateLimitError (429) is retryable
    if (error instanceof RateLimitError) {
      return true;
    }

    // NetworkError (fetch failures) is retryable
    if (error instanceof NetworkError) {
      return true;
    }

    // Check for Response objects with retryable status codes
    if (error instanceof Response) {
      // 429 (rate limited) is retryable
      if (error.status === 429) {
        return true;
      }
      // 5xx server errors are retryable
      if (error.status >= 500) {
        return true;
      }
      // Other status codes are not retryable
      return false;
    }

    // Check for TypeError with fetch-related messages (network errors)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }

    // Check for timeout errors (common patterns)
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (
        message.includes('timeout') ||
        message.includes('timed out') ||
        message.includes('etimedout') ||
        message.includes('econnreset') ||
        message.includes('econnrefused')
      ) {
        return true;
      }
    }

    // Default: not retryable
    return false;
  }

  /**
   * Executes a function with retry logic and exponential backoff
   * 
   * When the function throws a retryable error (rate limit, network error, 
   * server error, timeout), this method will retry up to maxRetries times
   * with exponential backoff delays (1s, 2s, 4s by default).
   * 
   * For RateLimitError with a retryAfter value, the specified delay is used
   * instead of the exponential backoff delay.
   * 
   * @param fn - The async function to execute
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @returns The result of the function if successful
   * @throws The last error if all retries are exhausted
   * 
   * @example
   * ```typescript
   * const result = await service.executeWithRetry(
   *   () => verifier.verify('package-name'),
   *   3
   * );
   * ```
   * 
   * Requirements: 3.3, 7.2, 7.3
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = VerificationService.DEFAULT_MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Check if this error is retryable
        if (!VerificationService.isRetryableError(error)) {
          // Non-retryable error - throw immediately
          throw error;
        }

        // Don't delay after the last attempt (we're about to throw anyway)
        if (attempt < maxRetries - 1) {
          // Calculate delay: use retryAfter for RateLimitError, otherwise exponential backoff
          let delayMs: number;
          
          if (error instanceof RateLimitError && error.retryAfter !== undefined) {
            // Use the server-specified retry delay (convert seconds to milliseconds)
            delayMs = error.retryAfter * 1000;
          } else {
            // Exponential backoff: 1s, 2s, 4s (Math.pow(2, attempt) * 1000)
            delayMs = Math.pow(2, attempt) * VerificationService.BASE_DELAY_MS;
          }

          await this.delay(delayMs);
        }
      }
    }

    // All retries exhausted - throw the last error
    throw lastError;
  }

  /**
   * Delays execution for the specified number of milliseconds
   * 
   * @param ms - Number of milliseconds to delay
   * @returns Promise that resolves after the delay
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verifies all packages in the app catalog
   * 
   * Iterates through all apps and their package manager targets, verifying
   * each package. Applies rate limiting delays between requests to respect
   * external API limits. Continues processing even if individual verifications fail.
   * 
   * @param options - Optional configuration for batch verification
   * @param options.delayBetweenRequests - Delay in ms between requests (default: 100)
   * @param options.storeResults - Whether to store results in MongoDB (default: true)
   * @returns VerificationSummary with counts of verified, failed, errors, and unverifiable
   * 
   * @example
   * ```typescript
   * const service = new VerificationService(mongoClient);
   * const summary = await service.verifyAllPackages();
   * console.log(`Verified: ${summary.verified}, Failed: ${summary.failed}`);
   * ```
   * 
   * Requirements: 3.1, 3.2, 3.4, 3.5
   */
  async verifyAllPackages(
    options?: { delayBetweenRequests?: number; storeResults?: boolean }
  ): Promise<VerificationSummary> {
    // Import apps dynamically to avoid circular dependencies
    const { apps } = await import('@/lib/data');
    
    const delayMs = options?.delayBetweenRequests ?? 100;
    const storeResults = options?.storeResults ?? true;
    
    const summary: VerificationSummary = {
      total: 0,
      verified: 0,
      failed: 0,
      errors: 0,
      unverifiable: 0,
    };

    for (const app of apps) {
      // Iterate through all package manager targets for this app
      for (const [pmId, packageName] of Object.entries(app.targets)) {
        if (!packageName) continue;
        
        summary.total++;
        
        try {
          const result = await this.verifyPackage(
            app.id,
            pmId as PackageManagerId,
            packageName,
            { storeResult: storeResults }
          );
          
          // Update summary based on result status
          switch (result.status) {
            case 'verified':
              summary.verified++;
              break;
            case 'failed':
              summary.failed++;
              break;
            case 'unverifiable':
              summary.unverifiable++;
              break;
            // 'pending' status shouldn't occur from verifyPackage
          }
          
          // Rate limiting delay between requests
          // Requirements: 3.2 - Respect rate limits of external APIs
          await this.delay(delayMs);
        } catch (error) {
          // Requirements: 3.5 - Continue processing on individual failures
          summary.errors++;
          console.error(`Error verifying ${app.id}/${pmId}:`, error);
        }
      }
    }

    return summary;
  }
}
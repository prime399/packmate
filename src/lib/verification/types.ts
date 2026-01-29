// Requirements: 1.6, 2.1 - Verification types and constants

import type { PackageManagerId } from '@/lib/data';

/**
 * Status of a package verification attempt
 * - verified: Package exists in the package manager repository
 * - failed: Package was not found or verification failed
 * - pending: Package has not been verified yet
 * - unverifiable: Package manager does not have a public API for verification
 */
export type VerificationStatus = 'verified' | 'failed' | 'pending' | 'unverifiable';

/**
 * Result of a package verification attempt
 * Contains all required fields for tracking verification history
 */
export interface VerificationResult {
  appId: string;
  packageManagerId: PackageManagerId;
  packageName: string;
  status: VerificationStatus;
  timestamp: string; // ISO 8601 format
  errorMessage?: string;
  manualReviewFlag?: boolean;
}

/**
 * Interface for package manager verifiers
 * Each verifiable package manager implements this interface
 */
export interface PackageVerifier {
  packageManagerId: PackageManagerId;
  verify(packageName: string): Promise<VerificationResult>;
}

/**
 * Summary of a batch verification job
 */
export interface VerificationSummary {
  total: number;
  verified: number;
  failed: number;
  errors: number;
  unverifiable: number;
}

/**
 * Verifiable package managers (have public APIs)
 * These package managers have APIs that can be queried to verify package existence
 */
export const VERIFIABLE_MANAGERS: PackageManagerId[] = [
  'homebrew',
  'chocolatey',
  'winget',
  'flatpak',
  'snap',
];

/**
 * Unverifiable package managers (no public APIs)
 * These package managers do not have public APIs for verification
 * Packages from these managers will be marked as "unverifiable"
 */
export const UNVERIFIABLE_MANAGERS: PackageManagerId[] = [
  'macports',
  'apt',
  'dnf',
  'pacman',
  'zypper',
  'scoop',
];

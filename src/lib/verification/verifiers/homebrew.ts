// Requirements: 1.1 - Homebrew package verification
// Validates: Property 1 (URL Construction for Verifiable Package Managers - Homebrew)

import type { PackageManagerId } from '@/lib/data';
import type { PackageVerifier, VerificationResult } from '@/lib/verification/types';

/**
 * Homebrew API base URLs
 * - Formulae: https://formulae.brew.sh/api/formula/{name}.json
 * - Casks: https://formulae.brew.sh/api/cask/{name}.json
 */
const HOMEBREW_FORMULA_API = 'https://formulae.brew.sh/api/formula';
const HOMEBREW_CASK_API = 'https://formulae.brew.sh/api/cask';

/**
 * Verifier for Homebrew packages (macOS package manager)
 * 
 * Handles both formulae and casks:
 * - Formulae: CLI tools and libraries (e.g., "git", "node")
 * - Casks: GUI applications (prefixed with "--cask", e.g., "--cask firefox")
 */
export class HomebrewVerifier implements PackageVerifier {
  packageManagerId: PackageManagerId = 'homebrew';

  /**
   * Parses a package name to determine if it's a cask and extract the clean name
   * @param packageName - The package name, possibly prefixed with "--cask "
   * @returns Object with isCask flag and cleaned package name
   */
  static parsePackageName(packageName: string): { isCask: boolean; name: string } {
    const isCask = packageName.startsWith('--cask ');
    const name = isCask ? packageName.replace('--cask ', '').trim() : packageName.trim();
    return { isCask, name };
  }

  /**
   * Builds the API URL for a Homebrew package
   * Static method for testing URL construction
   * 
   * @param packageName - The package name (may include "--cask " prefix)
   * @returns The full API URL for the package
   */
  static buildUrl(packageName: string): string {
    const { isCask, name } = HomebrewVerifier.parsePackageName(packageName);
    const baseUrl = isCask ? HOMEBREW_CASK_API : HOMEBREW_FORMULA_API;
    return `${baseUrl}/${name}.json`;
  }

  /**
   * Verifies that a Homebrew package exists
   * 
   * @param packageName - The package name to verify (may include "--cask " prefix)
   * @returns VerificationResult with status and metadata
   */
  async verify(packageName: string): Promise<VerificationResult> {
    const { name } = HomebrewVerifier.parsePackageName(packageName);
    const url = HomebrewVerifier.buildUrl(packageName);
    const timestamp = new Date().toISOString();

    try {
      const response = await fetch(url);

      if (response.ok) {
        return {
          appId: '', // Will be set by the calling service
          packageManagerId: this.packageManagerId,
          packageName,
          status: 'verified',
          timestamp,
        };
      }

      if (response.status === 404) {
        return {
          appId: '',
          packageManagerId: this.packageManagerId,
          packageName,
          status: 'failed',
          timestamp,
          errorMessage: 'Package not found',
        };
      }

      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(
          `Rate limited by Homebrew API${retryAfter ? `. Retry after ${retryAfter}s` : ''}`,
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      }

      // Handle other HTTP errors
      return {
        appId: '',
        packageManagerId: this.packageManagerId,
        packageName,
        status: 'failed',
        timestamp,
        errorMessage: `HTTP error: ${response.status} ${response.statusText}`,
      };
    } catch (error) {
      // Re-throw rate limit errors for retry handling
      if (error instanceof RateLimitError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError(`Network error while verifying ${name}: ${error.message}`);
      }

      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        appId: '',
        packageManagerId: this.packageManagerId,
        packageName,
        status: 'failed',
        timestamp,
        errorMessage: `Verification error: ${errorMessage}`,
      };
    }
  }
}

/**
 * Custom error for rate limiting responses
 * Allows the retry mechanism to handle 429 responses appropriately
 */
export class RateLimitError extends Error {
  retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Custom error for network failures
 * Allows the service to preserve previous status on network errors
 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

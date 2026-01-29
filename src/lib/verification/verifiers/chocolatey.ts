// Requirements: 1.2 - Chocolatey package verification
// Validates: Property 1 (URL Construction for Verifiable Package Managers - Chocolatey)

import type { PackageManagerId } from '@/lib/data';
import type { PackageVerifier, VerificationResult } from '@/lib/verification/types';
import { RateLimitError, NetworkError } from './homebrew';

/**
 * Chocolatey API base URL
 * Uses OData format: https://community.chocolatey.org/api/v2/Packages()?$filter=Id eq '{id}'
 */
const CHOCOLATEY_API_BASE = 'https://community.chocolatey.org/api/v2/Packages()';

/**
 * Escapes special characters in package names for OData queries
 * OData string literals use single quotes, so single quotes must be doubled
 * 
 * @param packageName - The package name to escape
 * @returns The escaped package name safe for OData queries
 */
function escapeODataString(packageName: string): string {
  // In OData, single quotes in string literals are escaped by doubling them
  return packageName.replace(/'/g, "''");
}

/**
 * Verifier for Chocolatey packages (Windows package manager)
 * 
 * Uses the Chocolatey Community Repository OData API to verify package existence.
 * The API returns JSON when Accept: application/json header is provided.
 */
export class ChocolateyVerifier implements PackageVerifier {
  packageManagerId: PackageManagerId = 'chocolatey';

  /**
   * Builds the API URL for a Chocolatey package
   * Static method for testing URL construction
   * 
   * @param packageName - The package name to query
   * @returns The full OData API URL for the package
   */
  static buildUrl(packageName: string): string {
    const escapedName = escapeODataString(packageName);
    return `${CHOCOLATEY_API_BASE}?$filter=Id eq '${escapedName}'`;
  }

  /**
   * Verifies that a Chocolatey package exists
   * 
   * @param packageName - The package name to verify
   * @returns VerificationResult with status and metadata
   */
  async verify(packageName: string): Promise<VerificationResult> {
    const url = ChocolateyVerifier.buildUrl(packageName);
    const timestamp = new Date().toISOString();

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(
          `Rate limited by Chocolatey API${retryAfter ? `. Retry after ${retryAfter}s` : ''}`,
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      }

      // Handle 404 - package not found
      if (response.status === 404) {
        return {
          appId: '', // Will be set by the calling service
          packageManagerId: this.packageManagerId,
          packageName,
          status: 'failed',
          timestamp,
          errorMessage: 'Package not found',
        };
      }

      // Handle other HTTP errors
      if (!response.ok) {
        return {
          appId: '',
          packageManagerId: this.packageManagerId,
          packageName,
          status: 'failed',
          timestamp,
          errorMessage: `HTTP error: ${response.status} ${response.statusText}`,
        };
      }

      // Parse JSON response
      let data: ChocolateyApiResponse;
      try {
        data = await response.json();
      } catch {
        return {
          appId: '',
          packageManagerId: this.packageManagerId,
          packageName,
          status: 'failed',
          timestamp,
          errorMessage: 'Invalid JSON response from Chocolatey API',
        };
      }

      // Check if package exists in results
      // OData response format: { d: { results: [...] } }
      const exists = data.d?.results && data.d.results.length > 0;

      if (exists) {
        return {
          appId: '',
          packageManagerId: this.packageManagerId,
          packageName,
          status: 'verified',
          timestamp,
        };
      }

      return {
        appId: '',
        packageManagerId: this.packageManagerId,
        packageName,
        status: 'failed',
        timestamp,
        errorMessage: 'Package not found',
      };
    } catch (error) {
      // Re-throw rate limit errors for retry handling
      if (error instanceof RateLimitError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError(`Network error while verifying ${packageName}: ${error.message}`);
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
 * Type definition for Chocolatey OData API response
 */
interface ChocolateyApiResponse {
  d?: {
    results?: ChocolateyPackage[];
  };
}

/**
 * Type definition for a Chocolatey package in the API response
 */
interface ChocolateyPackage {
  Id: string;
  Version: string;
  Title?: string;
  Description?: string;
  // Additional fields exist but are not needed for verification
}

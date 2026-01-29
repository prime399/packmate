// Requirements: 1.5 - Snap package verification
// Validates: Property 1 (URL Construction for Verifiable Package Managers - Snap)

import type { PackageManagerId } from '@/lib/data';
import type { PackageVerifier, VerificationResult } from '@/lib/verification/types';
import { RateLimitError, NetworkError } from './homebrew';

/**
 * Snapcraft API base URL
 * Uses the v2 API: https://api.snapcraft.io/v2/snaps/info/{name}
 * 
 * Snap packages may include flags like --classic, --devmode, --jailmode
 * These flags must be stripped before querying the API
 */
const SNAPCRAFT_API_BASE = 'https://api.snapcraft.io/v2/snaps/info';

/**
 * Verifier for Snap packages (Linux universal package format)
 * 
 * Snap packages are distributed through the Snap Store.
 * The verifier queries the Snapcraft API to check if a snap exists.
 * 
 * Package names may include installation flags (e.g., "slack --classic")
 * which must be stripped before verification.
 */
export class SnapVerifier implements PackageVerifier {
  packageManagerId: PackageManagerId = 'snap';

  /**
   * Strips installation flags from a snap package name
   * Snap packages can have flags like --classic, --devmode, --jailmode
   * 
   * @param packageName - The package name, possibly with flags (e.g., "slack --classic")
   * @returns The clean package name without flags
   */
  static stripFlags(packageName: string): string {
    // Split by whitespace and take the first part (the actual package name)
    // This handles cases like "slack --classic" -> "slack"
    return packageName.trim().split(/\s+/)[0];
  }

  /**
   * Builds the Snapcraft API URL for a snap package
   * Static method for testing URL construction
   * 
   * @param packageName - The snap package name (may include flags like "--classic")
   * @returns The full Snapcraft API URL for the package
   */
  static buildUrl(packageName: string): string {
    const name = SnapVerifier.stripFlags(packageName);
    return `${SNAPCRAFT_API_BASE}/${name}`;
  }

  /**
   * Verifies that a snap package exists in the Snap Store
   * 
   * @param packageName - The snap package name to verify (may include flags)
   * @returns VerificationResult with status and metadata
   */
  async verify(packageName: string): Promise<VerificationResult> {
    const url = SnapVerifier.buildUrl(packageName);
    const timestamp = new Date().toISOString();

    try {
      const response = await fetch(url, {
        headers: {
          // Required header for Snapcraft API v2
          'Snap-Device-Series': '16',
        },
      });

      if (response.ok) {
        return {
          appId: '', // Will be set by the calling service
          packageManagerId: this.packageManagerId,
          packageName,
          status: 'verified',
          timestamp,
        };
      }

      // Handle 404 - package not found
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
          `Rate limited by Snapcraft API${retryAfter ? `. Retry after ${retryAfter}s` : ''}`,
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

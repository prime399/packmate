// Requirements: 1.4 - Flatpak package verification
// Validates: Property 1 (URL Construction for Verifiable Package Managers - Flatpak)

import type { PackageManagerId } from '@/lib/data';
import type { PackageVerifier, VerificationResult } from '@/lib/verification/types';
import { RateLimitError, NetworkError } from './homebrew';

/**
 * Flathub API base URL
 * Uses the appstream endpoint: https://flathub.org/api/v2/appstream/{app_id}
 * 
 * Flatpak app IDs follow reverse domain notation (e.g., "org.mozilla.firefox")
 */
const FLATHUB_API_BASE = 'https://flathub.org/api/v2/appstream';

/**
 * Verifier for Flatpak packages (Linux application sandboxing)
 * 
 * Flatpak packages are distributed through Flathub, the primary Flatpak repository.
 * The verifier queries the Flathub API to check if an app exists.
 * 
 * App ID format: Reverse domain notation (e.g., "org.mozilla.firefox", "com.spotify.Client")
 */
export class FlatpakVerifier implements PackageVerifier {
  packageManagerId: PackageManagerId = 'flatpak';

  /**
   * Builds the Flathub API URL for a Flatpak app
   * Static method for testing URL construction
   * 
   * @param packageName - The Flatpak app ID (e.g., "org.mozilla.firefox")
   * @returns The full Flathub API URL for the app
   */
  static buildUrl(packageName: string): string {
    // Trim whitespace from package name
    const cleanName = packageName.trim();
    return `${FLATHUB_API_BASE}/${cleanName}`;
  }

  /**
   * Verifies that a Flatpak app exists on Flathub
   * 
   * @param packageName - The Flatpak app ID to verify (e.g., "org.mozilla.firefox")
   * @returns VerificationResult with status and metadata
   */
  async verify(packageName: string): Promise<VerificationResult> {
    const url = FlatpakVerifier.buildUrl(packageName);
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
          `Rate limited by Flathub API${retryAfter ? `. Retry after ${retryAfter}s` : ''}`,
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

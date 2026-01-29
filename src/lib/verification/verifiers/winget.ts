// Requirements: 1.3 - Winget package verification
// Validates: Property 1 (URL Construction for Verifiable Package Managers - Winget)

import type { PackageManagerId } from '@/lib/data';
import type { PackageVerifier, VerificationResult } from '@/lib/verification/types';
import { RateLimitError, NetworkError } from './homebrew';

/**
 * Winget packages are stored in the microsoft/winget-pkgs GitHub repository
 * The manifest path follows the format: manifests/{first-letter}/{publisher}/{name}
 * 
 * Example: Microsoft.VisualStudioCode -> manifests/m/Microsoft/VisualStudioCode
 */
const WINGET_GITHUB_API_BASE = 'https://api.github.com/repos/microsoft/winget-pkgs/contents/manifests';

/**
 * Parses a Winget package ID into its components
 * Winget IDs are in format: Publisher.PackageName (e.g., "Microsoft.VisualStudioCode")
 * 
 * @param packageName - The full Winget package ID
 * @returns Object with publisher, name, and firstLetter for URL construction
 */
export function parseWingetPackageId(packageName: string): {
  publisher: string;
  name: string;
  firstLetter: string;
} | null {
  const parts = packageName.split('.');
  
  // Winget IDs must have at least Publisher.Name format
  if (parts.length < 2) {
    return null;
  }
  
  const publisher = parts[0];
  const name = parts.slice(1).join('.');
  
  // Publisher must have at least one character
  if (!publisher || publisher.length === 0) {
    return null;
  }
  
  const firstLetter = publisher[0].toLowerCase();
  
  return { publisher, name, firstLetter };
}

/**
 * Verifier for Winget packages (Windows Package Manager)
 * 
 * Winget packages are stored in the microsoft/winget-pkgs GitHub repository.
 * The verifier queries the GitHub API to check if the manifest directory exists.
 * 
 * Package ID format: Publisher.PackageName
 * - Microsoft.VisualStudioCode
 * - Mozilla.Firefox
 * - Google.Chrome
 */
export class WingetVerifier implements PackageVerifier {
  packageManagerId: PackageManagerId = 'winget';

  /**
   * Builds the GitHub API URL for a Winget package manifest
   * Static method for testing URL construction
   * 
   * @param packageName - The Winget package ID (e.g., "Microsoft.VisualStudioCode")
   * @returns The full GitHub API URL for the package manifest, or null if invalid
   */
  static buildUrl(packageName: string): string | null {
    const parsed = parseWingetPackageId(packageName);
    
    if (!parsed) {
      return null;
    }
    
    const { publisher, name, firstLetter } = parsed;
    return `${WINGET_GITHUB_API_BASE}/${firstLetter}/${publisher}/${name}`;
  }

  /**
   * Verifies that a Winget package exists in the winget-pkgs repository
   * 
   * @param packageName - The Winget package ID to verify (e.g., "Microsoft.VisualStudioCode")
   * @returns VerificationResult with status and metadata
   */
  async verify(packageName: string): Promise<VerificationResult> {
    const timestamp = new Date().toISOString();
    const url = WingetVerifier.buildUrl(packageName);

    // Handle invalid package ID format
    if (!url) {
      return {
        appId: '', // Will be set by the calling service
        packageManagerId: this.packageManagerId,
        packageName,
        status: 'failed',
        timestamp,
        errorMessage: 'Invalid Winget package ID format. Expected: Publisher.PackageName',
      };
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (response.ok) {
        return {
          appId: '',
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

      // Handle rate limiting (403 with rate limit message or 429)
      if (response.status === 429 || response.status === 403) {
        const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
        const rateLimitReset = response.headers.get('X-RateLimit-Reset');
        
        // GitHub returns 403 when rate limited (unauthenticated)
        if (rateLimitRemaining === '0' || response.status === 429) {
          const resetTime = rateLimitReset ? parseInt(rateLimitReset, 10) : undefined;
          const retryAfter = resetTime ? Math.max(0, resetTime - Math.floor(Date.now() / 1000)) : undefined;
          
          throw new RateLimitError(
            `Rate limited by GitHub API${retryAfter ? `. Retry after ${retryAfter}s` : ''}`,
            retryAfter
          );
        }
        
        // 403 for other reasons (e.g., forbidden)
        return {
          appId: '',
          packageManagerId: this.packageManagerId,
          packageName,
          status: 'failed',
          timestamp,
          errorMessage: `HTTP error: ${response.status} ${response.statusText}`,
        };
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

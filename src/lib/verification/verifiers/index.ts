// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5 - Verifier factory function
// Provides a factory function to get the appropriate verifier for each package manager

import type { PackageManagerId } from '@/lib/data';
import type { PackageVerifier } from '@/lib/verification/types';
import { VERIFIABLE_MANAGERS, UNVERIFIABLE_MANAGERS } from '@/lib/verification/types';

// Import all verifier classes
import { HomebrewVerifier } from './homebrew';
import { ChocolateyVerifier } from './chocolatey';
import { WingetVerifier } from './winget';
import { FlatpakVerifier } from './flatpak';
import { SnapVerifier } from './snap';

// Re-export all verifier classes for direct use
export { HomebrewVerifier } from './homebrew';
export { ChocolateyVerifier } from './chocolatey';
export { WingetVerifier } from './winget';
export { FlatpakVerifier } from './flatpak';
export { SnapVerifier } from './snap';

// Re-export error classes for error handling
export { RateLimitError, NetworkError } from './homebrew';

/**
 * Map of package manager IDs to their verifier instances
 * Only verifiable package managers have verifiers
 */
const verifierMap: Map<PackageManagerId, PackageVerifier> = new Map([
  ['homebrew', new HomebrewVerifier()],
  ['chocolatey', new ChocolateyVerifier()],
  ['winget', new WingetVerifier()],
  ['flatpak', new FlatpakVerifier()],
  ['snap', new SnapVerifier()],
]);

/**
 * Factory function to get the appropriate verifier for a package manager
 * 
 * Returns the verifier instance for verifiable package managers (homebrew, chocolatey,
 * winget, flatpak, snap). Returns null for unverifiable package managers (macports,
 * apt, dnf, pacman, zypper, scoop) as they don't have public APIs for verification.
 * 
 * @param packageManagerId - The ID of the package manager
 * @returns The PackageVerifier instance for the package manager, or null if unverifiable
 * 
 * @example
 * ```typescript
 * const verifier = getVerifier('homebrew');
 * if (verifier) {
 *   const result = await verifier.verify('git');
 * }
 * ```
 */
export function getVerifier(packageManagerId: PackageManagerId): PackageVerifier | null {
  // Check if the package manager is verifiable
  if (UNVERIFIABLE_MANAGERS.includes(packageManagerId)) {
    return null;
  }

  // Return the verifier instance if available
  return verifierMap.get(packageManagerId) ?? null;
}

/**
 * Check if a package manager is verifiable (has a public API)
 * 
 * @param packageManagerId - The ID of the package manager
 * @returns true if the package manager has a verifier, false otherwise
 */
export function isVerifiable(packageManagerId: PackageManagerId): boolean {
  return VERIFIABLE_MANAGERS.includes(packageManagerId);
}

/**
 * Get all available verifiers
 * 
 * @returns Array of all verifier instances
 */
export function getAllVerifiers(): PackageVerifier[] {
  return Array.from(verifierMap.values());
}

/**
 * Get all verifiable package manager IDs
 * 
 * @returns Array of package manager IDs that have verifiers
 */
export function getVerifiablePackageManagerIds(): PackageManagerId[] {
  return [...VERIFIABLE_MANAGERS];
}

/**
 * Get all unverifiable package manager IDs
 * 
 * @returns Array of package manager IDs that don't have verifiers
 */
export function getUnverifiablePackageManagerIds(): PackageManagerId[] {
  return [...UNVERIFIABLE_MANAGERS];
}

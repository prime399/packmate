// Requirements: 6.1 - Server-side data fetching for verification statuses
// Fetches verification statuses at build time for initial page load performance

import type { VerificationResult } from './types';

/**
 * Fetch all verification statuses from the database
 * This function is designed to be called from server components
 * 
 * Requirement 6.1: Fetch verification data at build time for initial page load performance
 */
export async function fetchVerificationStatuses(): Promise<VerificationResult[]> {
  try {
    // In production, this would fetch from the database directly
    // For now, we'll use the API endpoint with absolute URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/verification-status`, {
      // Enable ISR with 24-hour revalidation
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      console.error('Failed to fetch verification statuses:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data as VerificationResult[];
  } catch (error) {
    console.error('Error fetching verification statuses:', error);
    return [];
  }
}

/**
 * Convert verification results array to a map for O(1) lookups
 */
export function createVerificationStatusMap(
  results: VerificationResult[]
): Map<string, VerificationResult> {
  const map = new Map<string, VerificationResult>();
  
  for (const result of results) {
    const key = `${result.appId}:${result.packageManagerId}`;
    map.set(key, result);
  }
  
  return map;
}

/**
 * Serialize verification results for passing to client components
 * Maps are not serializable, so we convert to a plain object
 */
export function serializeVerificationStatuses(
  results: VerificationResult[]
): Record<string, VerificationResult> {
  const serialized: Record<string, VerificationResult> = {};
  
  for (const result of results) {
    const key = `${result.appId}:${result.packageManagerId}`;
    serialized[key] = result;
  }
  
  return serialized;
}

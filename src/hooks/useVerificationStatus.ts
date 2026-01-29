'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { VerificationResult, VerificationStatus } from '@/lib/verification/types';
import type { PackageManagerId } from '@/lib/data';

// Requirements: 6.4, 6.5 - Hook for fetching and managing verification statuses

interface UseVerificationStatusReturn {
  /** Map of verification results keyed by "appId:packageManagerId" */
  statuses: Map<string, VerificationResult>;
  /** Get status for a specific app and package manager */
  getStatus: (appId: string, packageManagerId: PackageManagerId) => VerificationResult | undefined;
  /** Get verification status enum for a specific app and package manager */
  getVerificationStatus: (appId: string, packageManagerId: PackageManagerId) => VerificationStatus;
  /** Whether the initial fetch is loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refresh verification statuses */
  refresh: () => Promise<void>;
}

/**
 * Create a unique key for a verification result
 */
function createKey(appId: string, packageManagerId: PackageManagerId): string {
  return `${appId}:${packageManagerId}`;
}

/**
 * Hook for fetching and managing verification statuses
 * Fetches all verification statuses on mount and provides lookup functions
 */
export function useVerificationStatus(): UseVerificationStatusReturn {
  const [statuses, setStatuses] = useState<Map<string, VerificationResult>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all verification statuses
  const fetchStatuses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/verification-status');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch verification statuses: ${response.statusText}`);
      }

      const data: VerificationResult[] = await response.json();
      
      // Convert array to map for O(1) lookups
      const statusMap = new Map<string, VerificationResult>();
      for (const result of data) {
        const key = createKey(result.appId, result.packageManagerId);
        statusMap.set(key, result);
      }
      
      setStatuses(statusMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch verification statuses');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  // Get status for a specific app and package manager
  const getStatus = useCallback(
    (appId: string, packageManagerId: PackageManagerId): VerificationResult | undefined => {
      const key = createKey(appId, packageManagerId);
      return statuses.get(key);
    },
    [statuses]
  );

  // Get verification status enum (defaults to 'pending' if not found)
  const getVerificationStatus = useCallback(
    (appId: string, packageManagerId: PackageManagerId): VerificationStatus => {
      const result = getStatus(appId, packageManagerId);
      return result?.status ?? 'pending';
    },
    [getStatus]
  );

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(
    () => ({
      statuses,
      getStatus,
      getVerificationStatus,
      isLoading,
      error,
      refresh: fetchStatuses,
    }),
    [statuses, getStatus, getVerificationStatus, isLoading, error, fetchStatuses]
  );
}

/**
 * Hook for fetching verification status for a single app/package manager
 * Useful when you only need status for one combination
 */
export function useSingleVerificationStatus(
  appId: string,
  packageManagerId: PackageManagerId
): {
  status: VerificationResult | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [status, setStatus] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        appId,
        packageManagerId,
      });
      
      const response = await fetch(`/api/verification-status?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch verification status: ${response.statusText}`);
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch verification status');
    } finally {
      setIsLoading(false);
    }
  }, [appId, packageManagerId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return useMemo(
    () => ({
      status,
      isLoading,
      error,
      refresh: fetchStatus,
    }),
    [status, isLoading, error, fetchStatus]
  );
}

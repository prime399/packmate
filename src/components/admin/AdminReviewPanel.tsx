'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Check, Filter, ArrowUpDown } from 'lucide-react';
import type { VerificationResult } from '@/lib/verification/types';
import { VERIFIABLE_MANAGERS } from '@/lib/verification/types';
import type { PackageManagerId } from '@/lib/data';
import { VerificationBadge } from '@/components/verification/VerificationBadge';
import { formatVerificationDate } from '@/components/verification/VerificationBadge';

// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5 - Admin review interface for flagged packages

type SortField = 'timestamp' | 'appId';

export interface AdminReviewPanelProps {
  /** Initial filter value */
  initialFilter?: PackageManagerId | 'all';
  /** Initial sort field */
  initialSortBy?: SortField;
}

/**
 * AdminReviewPanel component
 * Displays a table of packages flagged for manual review
 * 
 * Requirements:
 * - 5.1: Display list of packages with manualReviewFlag = true
 * - 5.2: Show app name, package manager, package name, error, last verification date
 * - 5.3: Allow clearing manualReviewFlag (resolve action)
 * - 5.4: Filter by package manager
 * - 5.5: Sort by last verification date
 */
export function AdminReviewPanel({
  initialFilter = 'all',
  initialSortBy = 'timestamp',
}: AdminReviewPanelProps) {
  const [flaggedPackages, setFlaggedPackages] = useState<VerificationResult[]>([]);
  const [filter, setFilter] = useState<PackageManagerId | 'all'>(initialFilter);
  const [sortBy, setSortBy] = useState<SortField>(initialSortBy);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());

  // Fetch flagged packages from API
  const fetchFlaggedPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.set('packageManagerId', filter);
      }
      params.set('sortBy', sortBy);
      
      const response = await fetch(`/api/admin/flagged?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      
      const data = await response.json();
      setFlaggedPackages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flagged packages');
    } finally {
      setLoading(false);
    }
  }, [filter, sortBy]);

  // Fetch on mount and when filter/sort changes
  useEffect(() => {
    fetchFlaggedPackages();
  }, [fetchFlaggedPackages]);

  // Requirement 5.3: Resolve action clears manualReviewFlag
  const handleResolve = async (appId: string, packageManagerId: string) => {
    const key = `${appId}-${packageManagerId}`;
    setResolvingIds(prev => new Set(prev).add(key));
    
    try {
      const response = await fetch('/api/admin/flagged', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, packageManagerId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to resolve');
      }
      
      // Remove from local state
      setFlaggedPackages(prev => 
        prev.filter(pkg => !(pkg.appId === appId && pkg.packageManagerId === packageManagerId))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve package');
    } finally {
      setResolvingIds(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  // Toggle sort direction
  const toggleSort = () => {
    setSortBy(prev => prev === 'timestamp' ? 'appId' : 'timestamp');
  };

  return (
    <div className="admin-review-panel p-4 bg-(--bg-primary) rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-(--text-primary)">
          Flagged Packages for Review
        </h2>
        <button
          onClick={fetchFlaggedPackages}
          disabled={loading}
          className="p-2 rounded hover:bg-(--bg-hover) transition-colors disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filters - Requirement 5.4 */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-(--text-tertiary)" />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as PackageManagerId | 'all')}
            className="px-3 py-1.5 rounded bg-(--bg-secondary) border border-(--border-secondary) text-(--text-secondary) text-sm"
          >
            <option value="all">All Package Managers</option>
            {VERIFIABLE_MANAGERS.map(pm => (
              <option key={pm} value={pm}>
                {pm.charAt(0).toUpperCase() + pm.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Sort - Requirement 5.5 */}
        <button
          onClick={toggleSort}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-(--bg-secondary) border border-(--border-secondary) text-(--text-secondary) text-sm hover:bg-(--bg-hover) transition-colors"
        >
          <ArrowUpDown size={14} />
          Sort by {sortBy === 'timestamp' ? 'Date' : 'App'}
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 rounded bg-red-500/10 text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-8 text-(--text-tertiary)">
          Loading flagged packages...
        </div>
      )}

      {/* Empty state */}
      {!loading && flaggedPackages.length === 0 && (
        <div className="text-center py-8 text-(--text-tertiary)">
          No packages flagged for review
        </div>
      )}

      {/* Table - Requirements 5.1, 5.2 */}
      {!loading && flaggedPackages.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--border-secondary)">
                <th className="text-left py-2 px-3 text-(--text-tertiary) font-medium">App</th>
                <th className="text-left py-2 px-3 text-(--text-tertiary) font-medium">Package Manager</th>
                <th className="text-left py-2 px-3 text-(--text-tertiary) font-medium">Package Name</th>
                <th className="text-left py-2 px-3 text-(--text-tertiary) font-medium">Status</th>
                <th className="text-left py-2 px-3 text-(--text-tertiary) font-medium">Error</th>
                <th className="text-left py-2 px-3 text-(--text-tertiary) font-medium">Last Checked</th>
                <th className="text-left py-2 px-3 text-(--text-tertiary) font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flaggedPackages.map(pkg => {
                const key = `${pkg.appId}-${pkg.packageManagerId}`;
                const isResolving = resolvingIds.has(key);
                
                return (
                  <tr 
                    key={key}
                    className="border-b border-(--border-secondary) hover:bg-(--bg-hover) transition-colors"
                  >
                    <td className="py-2 px-3 text-(--text-primary)">{pkg.appId}</td>
                    <td className="py-2 px-3 text-(--text-secondary)">{pkg.packageManagerId}</td>
                    <td className="py-2 px-3 text-(--text-secondary) font-mono text-xs">{pkg.packageName}</td>
                    <td className="py-2 px-3">
                      <VerificationBadge status={pkg.status} showTooltip={false} />
                    </td>
                    <td className="py-2 px-3 text-(--text-tertiary) max-w-xs truncate" title={pkg.errorMessage}>
                      {pkg.errorMessage || '-'}
                    </td>
                    <td className="py-2 px-3 text-(--text-tertiary) text-xs">
                      {formatVerificationDate(pkg.timestamp)}
                    </td>
                    <td className="py-2 px-3">
                      {/* Requirement 5.3: Resolve button */}
                      <button
                        onClick={() => handleResolve(pkg.appId, pkg.packageManagerId)}
                        disabled={isResolving}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors disabled:opacity-50 text-xs"
                      >
                        <Check size={12} />
                        {isResolving ? 'Resolving...' : 'Resolve'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {!loading && flaggedPackages.length > 0 && (
        <div className="mt-4 text-xs text-(--text-tertiary)">
          Showing {flaggedPackages.length} flagged package{flaggedPackages.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

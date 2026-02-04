/**
 * SearchEmptyState component
 * Displays a message when no apps match the search query
 * 
 * Requirements: 6.1, 6.2
 */

import { Search, X } from 'lucide-react';

interface SearchEmptyStateProps {
  query: string;
  onClear: () => void;
}

export function SearchEmptyState({ query, onClear }: SearchEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center empty-state-animate">
      <div className="p-4 rounded-full bg-(--bg-secondary) mb-4">
        <Search size={32} className="text-(--text-muted)" />
      </div>
      
      <h2 className="text-lg font-medium text-foreground mb-2">
        No apps found
      </h2>
      
      <p className="text-sm text-(--text-muted) mb-6 max-w-md">
        No apps match &quot;{query}&quot;. Try a different search term or clear the search to see all apps.
      </p>
      
      <button
        onClick={onClear}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-(--bg-secondary) hover:bg-(--bg-tertiary) text-foreground text-sm font-medium transition-colors"
      >
        <X size={16} />
        Clear search
      </button>
    </div>
  );
}

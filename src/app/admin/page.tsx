'use client';

import { Package, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ThemeProvider } from '@/hooks/useTheme';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AdminReviewPanel } from '@/components/admin';

/**
 * Admin page for reviewing flagged packages
 * Accessible at /admin
 */
export default function AdminPage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background border-b border-(--border-primary)">
          <div className="max-w-5xl mx-auto px-5 py-4">
            <div className="flex items-center justify-between">
              {/* Logo and Back Link */}
              <div className="flex items-center gap-4">
                <Link 
                  href="/"
                  className="flex items-center gap-2 text-(--text-tertiary) hover:text-(--text-primary) transition-colors"
                >
                  <ArrowLeft size={18} />
                  <span className="text-sm">Back to App</span>
                </Link>
                <div className="h-6 w-px bg-(--border-primary)" />
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-(--bg-secondary)">
                    <Package size={18} className="text-foreground" />
                  </div>
                  <div>
                    <h1 className="text-base font-semibold text-foreground">Packmate Admin</h1>
                    <p className="text-xs text-(--text-muted)">Package Verification Review</p>
                  </div>
                </div>
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-5 py-6">
          <AdminReviewPanel />
        </main>
      </div>
    </ThemeProvider>
  );
}

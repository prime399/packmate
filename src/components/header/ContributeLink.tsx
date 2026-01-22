import { Heart } from 'lucide-react';

// Requirement 1.5 - Contribute link

export function ContributeLink() {
  return (
    <a
      href="https://github.com/packmate/packmate/blob/main/CONTRIBUTING.md"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
    >
      <Heart size={16} />
      <span>Contribute</span>
    </a>
  );
}

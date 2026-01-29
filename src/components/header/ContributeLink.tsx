import { Heart } from 'lucide-react';

// Requirement 1.5 - Contribute link with subtle hover animation

export function ContributeLink() {
  return (
    <a
      href="https://github.com/prime/packmate/blob/main/CONTRIBUTING.md"
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all duration-200 hover:translate-y-[-1px]"
    >
      <Heart 
        size={16} 
        className="transition-all duration-200 group-hover:scale-110 group-hover:text-red-400"
      />
      <span className="transition-transform duration-200 group-hover:translate-x-0.5">Contribute</span>
    </a>
  );
}

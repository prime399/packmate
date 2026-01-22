import { Github } from 'lucide-react';

// Requirement 1.4 - GitHub icon link

export function GitHubLink() {
  return (
    <a
      href="https://github.com/packmate/packmate"
      target="_blank"
      rel="noopener noreferrer"
      className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
      aria-label="View on GitHub"
    >
      <Github size={20} />
    </a>
  );
}

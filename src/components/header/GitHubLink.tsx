import { Github } from 'lucide-react';

// Requirement 1.4 - GitHub icon link with subtle hover animation

export function GitHubLink() {
  return (
    <a
      href="https://github.com/prime/packmate"
      target="_blank"
      rel="noopener noreferrer"
      className="group p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-200 hover:translate-y-[-1px] hover:shadow-sm"
      aria-label="View on GitHub"
    >
      <Github 
        size={20} 
        className="transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[-8deg]"
      />
    </a>
  );
}

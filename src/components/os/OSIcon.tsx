'use client';

import { useState } from 'react';
import { Monitor } from 'lucide-react';

// Requirement 2.1 - OS icon component with fallback handling

interface OSIconProps {
  iconUrl: string;
  name: string;
  size?: number;
  className?: string;
}

export function OSIcon({ iconUrl, name, size = 20, className = '' }: OSIconProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <Monitor 
        size={size} 
        className={`text-[var(--text-muted)] ${className}`}
        aria-label={name}
      />
    );
  }

  return (
    <img
      src={iconUrl}
      alt={name}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}

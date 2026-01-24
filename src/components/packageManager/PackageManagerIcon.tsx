'use client';

import { useState } from 'react';
import { Package } from 'lucide-react';

// Requirement 2.5 - Package manager icon component with fallback handling

interface PackageManagerIconProps {
  iconUrl: string;
  name: string;
  size?: number;
  className?: string;
}

export function PackageManagerIcon({ 
  iconUrl, 
  name, 
  size = 20, 
  className = '' 
}: PackageManagerIconProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <Package 
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

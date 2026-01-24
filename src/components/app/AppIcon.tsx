'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';

// Requirement 6.1 - App icon with fallback and loading states

interface AppIconProps {
  iconUrl: string;
  name: string;
  size?: number;
  className?: string;
}

export function AppIcon({ iconUrl, name, size = 20, className = '' }: AppIconProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    return (
      <Package 
        size={size} 
        className={`text-(--text-muted) ${className}`}
        aria-label={name}
      />
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {isLoading && (
        <div 
          className="absolute inset-0 rounded bg-(--bg-tertiary) skeleton-pulse"
        />
      )}
      <Image
        src={iconUrl}
        alt={name}
        width={size}
        height={size}
        className={`object-contain transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}

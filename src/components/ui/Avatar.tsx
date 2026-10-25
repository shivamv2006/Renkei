'use client';

import React, { useState } from 'react';
import { getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Avatar({
  src,
  name,
  size = 'md',
  isOnline,
  className = '',
  onClick,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const badgeSizes = {
    xs: 'w-2 h-2 bottom-0 right-0 border',
    sm: 'w-2.5 h-2.5 bottom-0 right-0 border-[1.5px]',
    md: 'w-3 h-3 bottom-0 right-0 border-2',
    lg: 'w-3.5 h-3.5 bottom-0.5 right-0.5 border-2',
    xl: 'w-4 h-4 bottom-1 right-1 border-2',
  };

  const initials = getInitials(name);

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex shrink-0 items-center justify-center select-none ${className}`}
    >
      <div
        className={`${sizeClasses[size]} rounded-2xl overflow-hidden flex items-center justify-center font-bold bg-gradient-to-tr from-brand-600 to-accent-600 text-white shadow-xs`}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={name || 'Avatar'}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {isOnline !== undefined && (
        <span
          className={`absolute rounded-full border-white dark:border-slate-900 ${badgeSizes[size]} ${
            isOnline ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}

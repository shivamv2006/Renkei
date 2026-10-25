'use client';

import React from 'react';
import { BRANDING } from '@/config/branding';

interface RenkeiLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  showTagline?: boolean;
  textSize?: 'sm' | 'md' | 'lg';
  variant?: 'sapphire' | 'cyber' | 'sunset' | 'mint';
}

export function RenkeiLogo({
  size = 40,
  className = '',
  showText = false,
  showTagline = false,
  textSize = 'md',
  variant = 'sapphire',
}: RenkeiLogoProps) {
  const textClasses = {
    sm: 'text-base font-extrabold tracking-tight',
    md: 'text-xl font-black tracking-tight',
    lg: 'text-2xl font-black tracking-tight',
  };

  const variantGradients = {
    sapphire: {
      start: '#38bdf8',
      end: '#2563eb',
      glow: 'rgba(56, 189, 248, 0.6)',
      dotColor: 'bg-sky-400',
      textGrad: 'from-sky-300 via-blue-400 to-indigo-400',
    },
    cyber: {
      start: '#00f0ff',
      end: '#c026d3',
      glow: 'rgba(0, 240, 255, 0.6)',
      dotColor: 'bg-cyan-400',
      textGrad: 'from-cyan-400 via-sky-300 to-fuchsia-400',
    },
    sunset: {
      start: '#f59e0b',
      end: '#ef4444',
      glow: 'rgba(245, 158, 11, 0.6)',
      dotColor: 'bg-amber-400',
      textGrad: 'from-amber-300 via-orange-400 to-rose-400',
    },
    mint: {
      start: '#84cc16',
      end: '#14b8a6',
      glow: 'rgba(132, 204, 22, 0.6)',
      dotColor: 'bg-emerald-400',
      textGrad: 'from-lime-300 via-emerald-400 to-teal-400',
    },
  };

  const cur = variantGradients[variant];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Exact Squircle Icon Container with Illuminated Glowing R */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-2xl bg-[#090d16] border border-white/10 shadow-lg shadow-sky-950/50 p-1 overflow-hidden"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]"
        >
          <defs>
            <linearGradient id={`renkei-grad-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={cur.start} />
              <stop offset="100%" stopColor={cur.end} />
            </linearGradient>
            <filter id={`neon-glow-${variant}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer continuous looping R stroke */}
          <path
            d="M 22 24 L 62 24 C 76 24, 86 35, 86 48 C 86 60, 76 70, 62 70 L 46 70 L 68 96 L 52 96 L 34 74 L 34 96 L 22 96 Z"
            fill="none"
            stroke={`url(#renkei-grad-${variant})`}
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#neon-glow-${variant})`}
          />

          {/* Inner interlocking geometric chevron band */}
          <path
            d="M 34 50 L 58 50 C 64 50, 70 45, 70 38 C 70 31, 64 26, 58 26 L 34 26 Z"
            fill="none"
            stroke={`url(#renkei-grad-${variant})`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* Brand Text: Capital R "Renkei" */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${cur.textGrad} ${textClasses[textSize]}`}
            >
              Renkei
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${cur.dotColor} animate-pulse shadow-[0_0_6px_#38bdf8]`} />
          </div>
          {showTagline ? (
            <span className="text-[10px] font-semibold text-slate-400 tracking-wide mt-0.5">
              stay in sync • connect & coordinate
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-sky-400/90 lowercase tracking-wider mt-0.5">
              stay in sync
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Backward compatibility alias
export const GenzokuLogo = RenkeiLogo;

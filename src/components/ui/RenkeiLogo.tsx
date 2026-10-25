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
  variant = 'cyber',
}: RenkeiLogoProps) {
  const textClasses = {
    sm: 'text-base font-extrabold tracking-tight',
    md: 'text-xl font-black tracking-tight',
    lg: 'text-2xl font-black tracking-tight',
  };

  const variantGradients = {
    sapphire: {
      start: '#38bdf8',
      mid: '#6366f1',
      end: '#2563eb',
      glow: 'rgba(56, 189, 248, 0.7)',
      dotColor: 'bg-sky-400',
      textGrad: 'from-sky-300 via-indigo-300 to-blue-400',
    },
    cyber: {
      start: '#00f0ff',
      mid: '#818cf8',
      end: '#ec4899',
      glow: 'rgba(0, 240, 255, 0.75)',
      dotColor: 'bg-cyan-400',
      textGrad: 'from-cyan-300 via-indigo-300 to-fuchsia-400',
    },
    sunset: {
      start: '#f59e0b',
      mid: '#f97316',
      end: '#ef4444',
      glow: 'rgba(245, 158, 11, 0.7)',
      dotColor: 'bg-amber-400',
      textGrad: 'from-amber-300 via-orange-400 to-rose-400',
    },
    mint: {
      start: '#84cc16',
      mid: '#10b981',
      end: '#14b8a6',
      glow: 'rgba(132, 204, 22, 0.7)',
      dotColor: 'bg-emerald-400',
      textGrad: 'from-lime-300 via-emerald-400 to-teal-400',
    },
  };

  const cur = variantGradients[variant];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Redesigned Futuristic Cyber-Nexus Emblem */}
      <div
        className="relative shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#0c0f17] via-[#080a10] to-[#04060a] border border-white/15 shadow-xl shadow-cyan-950/60 p-1.5 overflow-hidden group"
        style={{ width: size, height: size }}
      >
        {/* Subtle ambient neon pulse in background */}
        <div
          className="absolute inset-0 opacity-40 blur-md pointer-events-none transition-opacity group-hover:opacity-75"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${cur.start} 0%, transparent 70%)`,
          }}
        />

        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-[0_0_10px_rgba(0,240,255,0.7)]"
        >
          <defs>
            <linearGradient id={`renkei-nexus-grad-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={cur.start} />
              <stop offset="50%" stopColor={cur.mid} />
              <stop offset="100%" stopColor={cur.end} />
            </linearGradient>
            <filter id={`renkei-glow-${variant}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Orbiting Quantum Ring */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke={`url(#renkei-nexus-grad-${variant})`}
            strokeWidth="2.5"
            strokeDasharray="14 10"
            opacity="0.65"
          />

          {/* Futuristic Geometric Nexus R Stroke */}
          <path
            d="M 28 20 L 60 20 C 74 20, 82 30, 82 44 C 82 56, 73 64, 60 64 L 44 64 L 68 84 L 52 84 L 32 66 L 32 84 L 22 84 L 22 20 Z"
            fill="none"
            stroke={`url(#renkei-nexus-grad-${variant})`}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#renkei-glow-${variant})`}
          />

          {/* Inner Quantum Core Diamond / Portal */}
          <path
            d="M 36 32 L 56 32 C 64 32, 68 37, 68 44 C 68 51, 64 54, 56 54 L 36 54 Z"
            fill={`url(#renkei-nexus-grad-${variant})`}
            fillOpacity="0.3"
            stroke={`url(#renkei-nexus-grad-${variant})`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Glowing Nexus Nodes */}
          <circle cx="28" cy="20" r="3.5" fill="#ffffff" />
          <circle cx="68" cy="84" r="3.5" fill={cur.start} />
          <circle cx="82" cy="44" r="3" fill={cur.end} />
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
            <span className={`w-2 h-2 rounded-full ${cur.dotColor} animate-pulse shadow-[0_0_8px_#00f0ff]`} />
          </div>
          {showTagline ? (
            <span className="text-[10px] font-semibold text-slate-400 tracking-wide mt-0.5">
              stay in sync • connect & coordinate
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-cyan-400/90 lowercase tracking-wider mt-0.5">
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

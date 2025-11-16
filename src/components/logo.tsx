'use client';

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-auto transition-transform duration-300 ease-in-out hover:scale-105", className)}
      aria-label="VideoKoleks Logo"
    >
      <defs>
        <linearGradient id="mainBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: '#141e30', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: '#243b55', stopOpacity: 1}} />
        </linearGradient>
        
        <linearGradient id="videoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: '#667eea', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: '#764ba2', stopOpacity: 1}} />
        </linearGradient>
        
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor: '#f093fb', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: '#f5576c', stopOpacity: 1}} />
        </linearGradient>
        
        <clipPath id="screenClip">
          <rect x="65" y="55" width="70" height="50" rx="3"/>
        </clipPath>
      </defs>
      
      <circle cx="100" cy="100" r="95" fill="url(#mainBg)"/>
      
      <g>
        <path d="M 50 50 L 50 45 C 50 42 52 40 55 40 L 80 40 L 88 50 Z" fill="url(#videoGrad)" opacity="0.8"/>
        
        <rect x="50" y="50" width="100" height="75" rx="5" fill="url(#videoGrad)"/>
        
        <rect x="50" y="50" width="100" height="75" rx="5" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.3"/>
        
        <rect x="65" y="55" width="70" height="50" rx="3" fill="#1a1a2e"/>
        
        <rect x="68" y="58" width="20" height="14" rx="2" fill="#2d3436"/>
        <circle cx="78" cy="65" r="3" fill="url(#accentGrad)" opacity="0.8"/>
        
        <rect x="92" y="58" width="20" height="14" rx="2" fill="#2d3436"/>
        <circle cx="102" cy="65" r="3" fill="url(#accentGrad)" opacity="0.8"/>
        
        <rect x="116" y="58" width="20" height="14" rx="2" fill="#2d3436"/>
        <circle cx="126" cy="65" r="3" fill="url(#accentGrad)" opacity="0.8"/>
        
        <rect x="68" y="76" width="20" height="14" rx="2" fill="#2d3436"/>
        <circle cx="78" cy="83" r="3" fill="url(#accentGrad)" opacity="0.8"/>
        
        <rect x="92" y="76" width="20" height="14" rx="2" fill="#2d3436"/>
        <circle cx="102" cy="83" r="3" fill="url(#accentGrad)" opacity="0.8"/>
        
        <rect x="116" y="76" width="20" height="14" rx="2" fill="#2d3436"/>
        <circle cx="126" cy="83" r="3" fill="url(#accentGrad)" opacity="0.8"/>
        
        <rect x="60" y="110" width="80" height="8" rx="2" fill="#1a1a2e" opacity="0.5"/>
        <rect x="62" y="112" width="35" height="4" rx="1" fill="url(#accentGrad)"/>
      </g>
      
      <circle cx="135" cy="65" r="12" fill="url(#accentGrad)"/>
      <text x="135" y="70" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle">6</text>
      
      <text x="100" y="155" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="#667eea" textAnchor="middle">VIDEO</text>
      <text x="100" y="173" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="url(#accentGrad)" textAnchor="middle">KOLEKS</text>
    </svg>
  );
}

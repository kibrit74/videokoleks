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
      </defs>
      
      <circle cx="100" cy="100" r="95" fill="url(#mainBg)"/>
      
      <g transform="translate(0, -10)">
        <path d="M 50 50 L 50 45 C 50 42 52 40 55 40 L 80 40 L 88 50 Z" fill="url(#videoGrad)" opacity="0.8"/>
        
        <rect x="50" y="50" width="100" height="65" rx="5" fill="url(#videoGrad)"/>
        
        <rect x="50" y="50" width="100" height="65" rx="5" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.3"/>
        
        <polygon points="85,70 120,90 85,110" fill="white" />

      </g>
      
      <text x="100" y="150" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="bold" fill="#667eea" text-anchor="middle">VIDEO</text>
      <text x="100" y="172" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="bold" fill="url(#accentGrad)" text-anchor="middle">KOLEKS</text>
    </svg>
  );
}

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
          <stop offset="0%" style={{stopColor: 'hsl(var(--muted))', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: 'hsl(var(--card))', stopOpacity: 1}} />
        </linearGradient>
        
        <linearGradient id="videoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: 'hsl(var(--primary))', stopOpacity: 0.8}} />
          <stop offset="100%" style={{stopColor: 'hsl(var(--accent))', stopOpacity: 1}} />
        </linearGradient>
        
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
           <stop offset="0%" style={{stopColor: 'hsl(var(--secondary))', stopOpacity: 1}} />
           <stop offset="100%" style={{stopColor: 'hsl(var(--accent))', stopOpacity: 1}} />
        </linearGradient>
        
        <clipPath id="screenClip">
          <rect x="65" y="55" width="70" height="50" rx="3"/>
        </clipPath>
      </defs>
      
      {/* Arka plan */}
      <circle cx="100" cy="100" r="95" fill="url(#mainBg)"/>
      
      {/* Video klasörü / koleksiyon kutusu */}
      <g>
        {/* Klasör tab */}
        <path d="M 50 50 L 50 45 C 50 42 52 40 55 40 L 80 40 L 88 50 Z" fill="url(#videoGrad)" opacity="0.8"/>
        
        {/* Ana klasör gövdesi */}
        <rect x="50" y="50" width="100" height="75" rx="5" fill="url(#videoGrad)"/>
        
        {/* Klasör detayları */}
        <rect x="50" y="50" width="100" height="75" rx="5" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.3"/>
        
        {/* Ekran/pencere içinde video grid */}
        <rect x="65" y="55" width="70" height="50" rx="3" fill="hsl(var(--background) / 0.5)"/>
        
        {/* Video thumbnail'leri (3x2 grid) */}
        <rect x="68" y="58" width="20" height="14" rx="2" fill="hsl(var(--muted))"/>
        <circle cx="78" cy="65" r="3" fill="url(#accentGrad)" opacity="0.8"/>
        
        <rect x="92" y="58" width="20" height="14" rx="2" fill="hsl(var(--muted))"/>
        <circle cx="102" cy="65" r="3" fill="url(#accentGrad)" opacity="0.8"/>
        
        <rect x="116" y="58" width="20" height="14" rx="2" fill="hsl(var(--muted))"/>
        <circle cx="126" cy="65" r="3" fill="url(#accentGrad)" opacity="0.8"/>
        
        <rect x="68" y="76" width="20" height="14" rx="2" fill="hsl(var(--muted))"/>
        <circle cx="78" cy="83" r="3" fill="url(#accentGrad)" opacity="0.8"/>
        
        <rect x="92" y="76" width="20" height="14" rx="2" fill="hsl(var(--muted))"/>
        <circle cx="102" cy="83" r="3" fill="url(#accentGrad)" opacity="0.8"/>
        
        <rect x="116" y="76" width="20" height="14" rx="2" fill="hsl(var(--muted))"/>
        <circle cx="126" cy="83" r="3" fill="url(#accentGrad)" opacity="0.8"/>
        
        {/* Klasör altı bilgi çubuğu */}
        <rect x="60" y="110" width="80" height="8" rx="2" fill="hsl(var(--background) / 0.3)" opacity="0.5"/>
        <rect x="62" y="112" width="35" height="4" rx="1" fill="url(#accentGrad)"/>
      </g>
      
      {/* Koleksiyon sayısı göstergesi */}
      <circle cx="135" cy="65" r="12" fill="url(#accentGrad)"/>
      <text x="135" y="70" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle">6</text>
      
      {/* Logo metni */}
      <text x="100" y="155" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="url(#videoGrad)" textAnchor="middle">VIDEO</text>
      <text x="100" y="173" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="url(#videoGrad)" textAnchor="middle">KOLEKS</text>
    </svg>
  );
}

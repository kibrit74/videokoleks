'use client';

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={cn("w-auto", className)}
      aria-label="VideoKoleks Logo"
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--secondary))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <g fill="url(#logo-gradient)">
        {/* Layer 3 (Back) */}
        <path
          d="M208,88v96a16,16,0,0,1-16,16H64a16,16,0,0,1-16-16V88"
          opacity="0.4"
        />
        {/* Layer 2 (Middle) */}
        <path
          d="M192,72v96a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V72"
          opacity="0.7"
        />
        {/* Layer 1 (Front with Play button cutout) */}
        <path
          d="M176,56V152a16,16,0,0,1-16,16H32a16,16,0,0,1-16-16V56A16,16,0,0,1,32,40H160A16,16,0,0,1,176,56Z M149.33,100.67l-48,32A8,8,0,0,1,88,124.67V63.33a8,8,0,0,1,13.33-6.66l48,32A8,8,0,0,1,149.33,100.67Z"
          transform="translate(40, 24)"
        />
      </g>
      <text x="50%" y="90%" dominantBaseline="middle" textAnchor="middle" fontSize="48" fontWeight="bold" fill="hsl(var(--foreground))" className="hidden">
        VideoKoleks
      </text>
    </svg>
  );
}

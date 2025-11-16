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
        {/* Box/Collection part */}
        <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216Z" opacity="0.3"/>
        <path d="M216,32H40a24,24,0,0,0-24,24V200a24,24,0,0,0,24,24H216a24,24,0,0,0,24-24V56A24,24,0,0,0,216,32ZM40,216a8,8,0,0,1-8-8V56a8,8,0,0,1,8-8H216a8,8,0,0,1,8,8V200a8,8,0,0,1-8,8Z"/>

        {/* Play button part */}
        <path d="M149.33,124.67l-48,32A8,8,0,0,1,88,148.67V87.33a8,8,0,0,1,13.33-6.66l48,32A8,8,0,0,1,149.33,124.67Z"/>
      </g>
      <text x="50%" y="90%" dominantBaseline="middle" textAnchor="middle" fontSize="48" fontWeight="bold" fill="hsl(var(--foreground))" className="hidden">
        VideoKoleks
      </text>
    </svg>
  );
}
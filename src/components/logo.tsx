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
      <path
        fill="url(#logo-gradient)"
        d="M224,48H48A16,16,0,0,0,32,64V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V64A16,16,0,0,0,208,48Zm-8,152a8,8,0,0,1-8,8H56a8,8,0,0,1-8-8V72a8,8,0,0,1,8-8H208a8,8,0,0,1,8,8Z"
        opacity="0.2"
      />
      <path
        fill="url(#logo-gradient)"
        d="M208,32H32A16,16,0,0,0,16,48V192a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V48A16,16,0,0,0,192,32ZM152.49,124,96.49,156a8,8,0,0,1-12.49-7V83a8,8,0,0,1,12.49-7l56,32a8,8,0,0,1,0,14Z"
      />
    </svg>
  );
}

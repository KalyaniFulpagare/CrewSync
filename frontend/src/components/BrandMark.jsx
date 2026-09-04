import React from 'react';

export default function BrandMark({ size = 36, className = '' }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-label="CrewSync" role="img" className={className}>
      <defs>
        <linearGradient id="crewsync-gradient" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7887FF" />
          <stop offset="1" stopColor="#4A5AF0" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#crewsync-gradient)" />
      <path d="M33.5 15.4a12 12 0 1 0 0 17.2" fill="none" stroke="white" strokeWidth="4.4" strokeLinecap="round" />
      <circle cx="34.5" cy="15" r="3" fill="#DDE2FF" />
      <circle cx="34.5" cy="33" r="3" fill="#DDE2FF" />
      <path d="M29.5 18.2h3.2M29.5 29.8h3.2" stroke="#DDE2FF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

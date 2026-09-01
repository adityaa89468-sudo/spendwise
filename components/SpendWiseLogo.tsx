import React from 'react';

interface SpendWiseLogoProps {
  className?: string;
  variant?: 'icon' | 'full' | 'mark';
  darkMode?: boolean;
  withBackground?: boolean;
}

export const SpendWiseLogo: React.FC<SpendWiseLogoProps> = ({ 
  className = "w-9 h-9", 
  variant = "icon",
  darkMode = false,
  withBackground = true
}) => {
  // Brand palette matching the new official emblem
  const forestGreenDark = "#06382D";
  const forestGreenLight = "#0B4B3D";

  const goldStart = "#E8AE52";
  const goldMid = "#DE9F43";
  const goldEnd = "#CF8F33";

  const creamLight = "#FCF9EE";
  const creamDark = "#F2EADA";

  if (variant === 'icon' || variant === 'mark') {
    return (
      <svg 
        viewBox="0 0 512 512" 
        className={`${className} shrink-0 transition-transform duration-200`}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        referrerPolicy="no-referrer"
      >
        <defs>
          <linearGradient id="swForestBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={forestGreenLight} />
            <stop offset="100%" stopColor={forestGreenDark} />
          </linearGradient>

          <linearGradient id="swGoldArrow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={goldStart} />
            <stop offset="50%" stopColor={goldMid} />
            <stop offset="100%" stopColor={goldEnd} />
          </linearGradient>

          <linearGradient id="swCream" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={creamLight} />
            <stop offset="100%" stopColor={creamDark} />
          </linearGradient>

          <filter id="swShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.16" />
          </filter>
        </defs>

        {withBackground && (
          <rect width="512" height="512" rx="108" fill="url(#swForestBg)" />
        )}

        <g filter={withBackground ? "url(#swShadow)" : undefined}>
          {/* Chimney on right roof slope */}
          <rect 
            x="318" 
            y="118" 
            width="34" 
            height="62" 
            rx="3" 
            fill={withBackground ? "url(#swCream)" : (darkMode ? "#E2E8F0" : "#0E5244")} 
          />

          {/* House Gable Roof (Geometric roof slab) */}
          <path 
            d="M 256,86 L 400,230 L 400,244 L 366,244 L 256,134 L 146,244 L 112,244 L 112,230 Z" 
            fill={withBackground ? "url(#swCream)" : (darkMode ? "#F8FAFC" : "#0E5244")} 
          />

          {/* Attic 4-Pane Square Window */}
          <g transform="translate(232, 176)">
            <rect x="0" y="0" width="19" height="19" rx="2.5" fill={withBackground ? "url(#swCream)" : (darkMode ? "#F8FAFC" : "#0E5244")} />
            <rect x="27" y="0" width="19" height="19" rx="2.5" fill={withBackground ? "url(#swCream)" : (darkMode ? "#F8FAFC" : "#0E5244")} />
            <rect x="0" y="27" width="19" height="19" rx="2.5" fill={withBackground ? "url(#swCream)" : (darkMode ? "#F8FAFC" : "#0E5244")} />
            <rect x="27" y="27" width="19" height="19" rx="2.5" fill={withBackground ? "url(#swCream)" : (darkMode ? "#F8FAFC" : "#0E5244")} />
          </g>

          {/* Left Split Arrow (Cream / Off-White) */}
          <path 
            d="M 256,342 C 256,298 226,276 172,276 L 172,328 L 110,274 L 172,220 L 172,254 C 238,254 256,282 256,342 Z" 
            fill={withBackground ? "url(#swCream)" : (darkMode ? "#F8FAFC" : "#0E5244")} 
          />

          {/* Right Split Arrow (Golden Ochre) */}
          <path 
            d="M 256,342 C 256,298 286,276 340,276 L 340,328 L 402,274 L 340,220 L 340,254 C 274,254 256,282 256,342 Z" 
            fill="url(#swGoldArrow)" 
          />

          {/* Bottom Hexagon Chevron / Diamond Base */}
          <path 
            d="M 184,334 L 256,406 L 328,334 L 304,320 L 256,368 L 208,320 Z" 
            fill={withBackground ? "url(#swCream)" : (darkMode ? "#F8FAFC" : "#0E5244")} 
          />
        </g>
      </svg>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center p-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
      {/* Dynamic scaled logo */}
      <div className="w-28 h-28 mb-4 shadow-xl rounded-3xl overflow-hidden shadow-emerald-950/25">
        <SpendWiseLogo variant="icon" className="w-full h-full" darkMode={darkMode} withBackground={true} />
      </div>

      {/* Main branded label */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-3xl font-light tracking-wide text-emerald-800 dark:text-emerald-400 font-sans">
          FLAT
        </span>
        <div className="w-[2px] h-7 bg-emerald-600/30 dark:bg-emerald-400/30 rounded-full mx-0.5" />
        <span className="text-3xl font-extrabold tracking-wide text-emerald-950 dark:text-white font-sans">
          HISAB
        </span>
      </div>

      {/* Sub-label */}
      <p className="text-[11px] font-bold tracking-[0.25em] text-slate-400 dark:text-slate-400 uppercase mt-2.5 leading-none">
        Shared Expenses Made Simple
      </p>
    </div>
  );
};

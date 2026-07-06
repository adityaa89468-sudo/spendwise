import React from 'react';

interface SpendWiseLogoProps {
  className?: string;
  variant?: 'icon' | 'full';
  darkMode?: boolean;
}

export const SpendWiseLogo: React.FC<SpendWiseLogoProps> = ({ 
  className = "w-9 h-9", 
  variant = "icon",
  darkMode = false 
}) => {
  // Luxe, high-contrast palette matching the emerald green and metallic gold logo
  const emeraldStop1 = darkMode ? "#34D399" : "#1B533E";
  const emeraldStop2 = darkMode ? "#10B981" : "#114734";
  const emeraldStop3 = darkMode ? "#059669" : "#0A2F21";

  const goldStop1 = darkMode ? "#FDE047" : "#E5D5B8";
  const goldStop2 = darkMode ? "#FBBF24" : "#CEB78D";
  const goldStop3 = darkMode ? "#F59E0B" : "#B29767";
  const goldStop4 = darkMode ? "#D97706" : "#8A6E44";

  if (variant === 'icon') {
    return (
      <svg 
        viewBox="0 0 400 400" 
        className={`${className} transition-all duration-300`}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        referrerPolicy="no-referrer"
      >
        <defs>
          {/* Champagne/Gold Gradient */}
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={goldStop1} />
            <stop offset="35%" stopColor={goldStop2} />
            <stop offset="70%" stopColor={goldStop3} />
            <stop offset="100%" stopColor={goldStop4} />
          </linearGradient>
          
          {/* Emerald Green Gradient */}
          <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={emeraldStop1} />
            <stop offset="50%" stopColor={emeraldStop2} />
            <stop offset="100%" stopColor={emeraldStop3} />
          </linearGradient>

          {/* Real shadow to simulate the elegant 3D papercut look of the brand logo */}
          <filter id="luxeShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#000000" floodOpacity="0.12" />
          </filter>
        </defs>

        <g filter="url(#luxeShadow)">
          {/* THE HOUSE SILHOUETTE (Center Nest) */}
          {/* House body facade fill */}
          <path 
            d="M 160,195 L 200,155 L 240,195 L 240,230 L 160,230 Z" 
            fill={darkMode ? "#111827" : "#FCFBF7"} 
            className="transition-colors duration-300"
          />

          {/* Main House Roof structure (forms part of the monogram weave) */}
          <path 
            d="M 152,198 L 200,150 L 248,198" 
            stroke="url(#emeraldGrad)" 
            strokeWidth="16" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Minimalist 4-Pane Square Window */}
          <g transform="translate(191, 185)">
            <rect x="0" y="0" width="18" height="18" rx="2" fill="url(#emeraldGrad)" />
            <line x1="9" y1="0" x2="9" y2="18" stroke={darkMode ? "#111827" : "#FCFBF7"} strokeWidth="2.5" />
            <line x1="0" y1="9" x2="18" y2="9" stroke={darkMode ? "#111827" : "#FCFBF7"} strokeWidth="2.5" />
          </g>

          {/* THE MONOGRAM RIBBONS ("S" & "W" Interlocking loops) */}
          
          {/* S-Ribbon Upper Loop & Sweep */}
          <path 
            d="M 215,115 C 160,110 110,140 110,190 C 110,240 160,250 200,250 C 240,250 245,215 215,190" 
            stroke="url(#emeraldGrad)" 
            strokeWidth="18" 
            strokeLinecap="round" 
            fill="none" 
          />
          
          {/* S-Ribbon Gold Accent Ribbon Accent (interweaves for luxury 3D effect) */}
          <path 
            d="M 115,175 C 115,135 150,120 190,120" 
            stroke="url(#goldGrad)" 
            strokeWidth="12" 
            strokeLinecap="round" 
            fill="none" 
          />

          {/* W-Ribbon Loop (champagne gold loops that sweep down, up, and frame the right) */}
          <path 
            d="M 210,185 C 210,225 230,250 280,250 C 325,250 325,185 285,145 C 245,105 210,135 210,165 L 210,205" 
            stroke="url(#goldGrad)" 
            strokeWidth="18" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none" 
          />

          {/* Weaving Connector overpass */}
          <path 
            d="M 190,250 C 205,250 215,240 215,220" 
            stroke="url(#emeraldGrad)" 
            strokeWidth="18" 
            strokeLinecap="round" 
            fill="none" 
          />
        </g>
      </svg>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center p-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
      {/* Dynamic scaled logo */}
      <div className="w-32 h-32 mb-4">
        <SpendWiseLogo variant="icon" className="w-full h-full" darkMode={darkMode} />
      </div>

      {/* Main branded label */}
      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-3xl font-light tracking-wide text-emerald-800 dark:text-emerald-400 font-sans">
          SPEND
        </span>
        <div className="w-[1px] h-8 bg-slate-300 dark:bg-slate-700 mx-1" />
        <span className="text-3xl font-extrabold tracking-wide text-emerald-950 dark:text-white font-sans">
          WISE
        </span>
      </div>

      {/* Sub-label */}
      <p className="text-[10px] font-black tracking-[0.25em] text-slate-400 dark:text-slate-500 uppercase mt-2.5 leading-none">
        Shared Expenses Made Simple
      </p>
    </div>
  );
};

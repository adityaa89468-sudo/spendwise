import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Check } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  const handleStart = (clientY: number) => {
    // Only allow pulling if we are at the top of the viewport
    if (window.scrollY === 0) {
      touchStartY.current = clientY;
      isDragging.current = true;
      setShowSuccess(false);
    }
  };

  const handleMove = (clientY: number) => {
    if (!isDragging.current || isRefreshing) return;

    const deltaY = clientY - touchStartY.current;
    if (deltaY > 0 && window.scrollY === 0) {
      // Add non-linear resistance so it gets harder to pull further down
      const resistance = 0.4;
      const pull = Math.min(120, deltaY * resistance);
      setPullDistance(pull);
    }
  };

  const handleEnd = async () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (pullDistance >= 50 && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(50); // Hold at active refreshing position
      try {
        await onRefresh();
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setPullDistance(0);
          setIsRefreshing(false);
        }, 1200);
      } catch (error) {
        console.error("Refresh error:", error);
        setPullDistance(0);
        setIsRefreshing(false);
      }
    } else {
      // Snap back to 0
      setPullDistance(0);
    }
  };

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && e.touches[0].clientY - touchStartY.current > 0) {
      // Prevent browser bounce if pulling down
      if (e.cancelable) e.preventDefault();
    }
    handleMove(e.touches[0].clientY);
  };

  const onTouchEnd = () => {
    handleEnd();
  };

  // Mouse handlers for desktop testing
  const onMouseDown = (e: React.MouseEvent) => {
    // Only drag with left click
    if (e.button === 0) {
      handleStart(e.clientY);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      handleMove(e.clientY);
    }
  };

  const onMouseUp = () => {
    handleEnd();
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      className="relative select-none"
    >
      {/* Pull indicator layer */}
      <div 
        className="absolute left-0 right-0 flex justify-center items-center pointer-events-none transition-all duration-150"
        style={{ 
          height: `${pullDistance}px`, 
          top: `-${pullDistance}px`,
          opacity: Math.min(1, pullDistance / 50)
        }}
      >
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-md px-4 py-2 rounded-full mt-2">
          {showSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                Synced!
              </span>
            </>
          ) : isRefreshing ? (
            <>
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                Synchronizing...
              </span>
            </>
          ) : (
            <>
              <RefreshCw 
                className="w-4 h-4 text-slate-400" 
                style={{ transform: `rotate(${pullDistance * 6}deg)` }} 
              />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {pullDistance >= 50 ? "Release to sync" : "Pull down to sync"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Manual refresh trigger link helper for desktop accessibility */}
      <div className="flex justify-end mb-2 pr-1">
        <button
          onClick={async () => {
            if (isRefreshing) return;
            setIsRefreshing(true);
            setPullDistance(50);
            try {
              await onRefresh();
              setShowSuccess(true);
              setTimeout(() => {
                setShowSuccess(false);
                setPullDistance(0);
                setIsRefreshing(false);
              }, 1200);
            } catch (err) {
              setPullDistance(0);
              setIsRefreshing(false);
            }
          }}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-slate-100/40 hover:bg-slate-100 dark:bg-slate-900/40 dark:hover:bg-slate-900 px-3 py-1.5 rounded-lg cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          {isRefreshing ? 'Synchronizing...' : 'Sync Cloud'}
        </button>
      </div>

      {/* Content wrapper */}
      <motion.div
        style={{ y: pullDistance }}
        className="transition-shadow"
      >
        {children}
      </motion.div>
    </div>
  );
};

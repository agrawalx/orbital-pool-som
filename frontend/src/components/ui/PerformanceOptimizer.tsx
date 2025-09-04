/**
 * Orbital AMM - Performance Optimizer
 * 
 * Component to optimize rendering performance and reduce flickering.
 * 
 * @author Orbital Protocol Team
 * @version 1.0.0
 */
'use client';

import { useEffect } from 'react';

export function PerformanceOptimizer() {
  useEffect(() => {
    // Optimize CSS animations for better performance
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-backface-visibility: hidden;
        -moz-backface-visibility: hidden;
        -webkit-transform: translate3d(0, 0, 0);
        -moz-transform: translate3d(0, 0, 0);
      }
      
      /* Reduce motion for users who prefer it */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }
      
      /* Optimize for 60fps */
      .animate-spin,
      .animate-pulse,
      .animate-bounce {
        animation-fill-mode: both;
        will-change: transform;
      }
    `;
    document.head.appendChild(style);

    // Cleanup
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
}
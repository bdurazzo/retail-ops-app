/**
 * useViewModeTransition Hook
 *
 * Manages fade-out/fade-in transitions for view mode changes.
 * Orchestrates timing for smooth UI transitions.
 */

import { useState } from 'react';

/**
 * @param {object} options - Configuration options
 * @param {number} options.fadeOutDuration - Duration of fade out in ms (default: 300)
 * @param {number} options.fadeInDelay - Delay before fade in after state change in ms (default: 50)
 * @param {function} options.onComplete - Callback when transition completes
 */
export function useViewModeTransition(options = {}) {
  const {
    fadeOutDuration = 300,
    fadeInDelay = 50,
    onComplete
  } = options;

  const [isTransitioning, setIsTransitioning] = useState(false);

  /**
   * Execute a transition with fade-out/fade-in animation
   * @param {function} asyncCallback - Async function to execute during transition
   * @returns {Promise<void>}
   */
  const transition = async (asyncCallback) => {
    try {
      // Phase 1: Start fade out
      setIsTransitioning(true);

      // Phase 2: Wait for fade out animation
      await new Promise(resolve => setTimeout(resolve, fadeOutDuration));

      // Phase 3: Execute the state change (e.g., view mode switch)
      await asyncCallback();

      // Phase 4: Allow DOM to update
      await new Promise(resolve => setTimeout(resolve, fadeInDelay));

      // Phase 5: Fade back in
      setIsTransitioning(false);

      // Phase 6: Optional completion callback
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('[useViewModeTransition] Transition failed:', error);
      setIsTransitioning(false); // Ensure we don't get stuck in transitioning state
    }
  };

  /**
   * Immediately cancel transition and reset state
   */
  const cancelTransition = () => {
    setIsTransitioning(false);
  };

  return {
    isTransitioning,
    transition,
    cancelTransition
  };
}

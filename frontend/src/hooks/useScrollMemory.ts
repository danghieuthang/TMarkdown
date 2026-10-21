import { useEffect, useRef, useCallback } from 'react';
import { scrollMemory } from '../utils/scrollStorage';
import type { HeadingItem } from '../types';

interface UseScrollMemoryProps {
  filePath: string | null;
  content?: string;
  headings: HeadingItem[];
  onActiveHeadingChange?: (headingId: string) => void;
  onScrollProgressChange?: (progressPercent: number) => void;
}

export function useScrollMemory({
  filePath,
  content,
  headings,
  onActiveHeadingChange,
  onScrollProgressChange,
}: UseScrollMemoryProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const isRestoringRef = useRef<boolean>(false);

  const isScrollSpyLockedRef = useRef<boolean>(false);
  const lockTimerRef = useRef<number | null>(null);

  const lockScrollSpy = useCallback((durationMs = 200) => {
    isScrollSpyLockedRef.current = true;
    if (lockTimerRef.current) {
      window.clearTimeout(lockTimerRef.current);
    }
    lockTimerRef.current = window.setTimeout(() => {
      isScrollSpyLockedRef.current = false;
    }, durationMs);
  }, []);

  // Handle scroll event
  const handleScroll = useCallback(() => {
    if (!filePath || !containerRef.current || isRestoringRef.current) return;

    const el = containerRef.current;
    const scrollTop = el.scrollTop;
    const scrollHeight = el.scrollHeight;
    const clientHeight = el.clientHeight;

    // Calculate progress
    const maxScroll = scrollHeight - clientHeight;
    const progress = maxScroll > 0 ? Math.min(100, Math.round((scrollTop / maxScroll) * 100)) : 0;
    if (onScrollProgressChange) {
      onScrollProgressChange(progress);
    }

    // Scroll-Spy: detect which heading is currently active (skip if locked during programmatic navigation)
    if (!isScrollSpyLockedRef.current && headings.length > 0) {
      if (scrollTop < 30) {
        // At the very top of document
        onActiveHeadingChange?.(headings[0].id);
      } else if (scrollHeight - scrollTop - clientHeight < 30) {
        // At the very bottom of document
        onActiveHeadingChange?.(headings[headings.length - 1].id);
      } else {
        const containerTop = el.getBoundingClientRect().top;
        const threshold = containerTop + 120; // 120px below top of viewport
        let currentHeadingId = headings[0].id;

        for (const h of headings) {
          const headingEl = document.getElementById(h.id);
          if (headingEl) {
            const rect = headingEl.getBoundingClientRect();
            if (rect.top <= threshold) {
              currentHeadingId = h.id;
            } else {
              break;
            }
          }
        }

        if (onActiveHeadingChange) {
          onActiveHeadingChange(currentHeadingId);
        }
      }
    }

    // Debounce save to storage
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      scrollMemory.savePosition(filePath, el.scrollTop, el.scrollHeight, el.clientHeight);
    }, 120);
  }, [filePath, headings, onActiveHeadingChange, onScrollProgressChange]);

  // Clean up lock timer on unmount
  useEffect(() => {
    return () => {
      if (lockTimerRef.current) {
        window.clearTimeout(lockTimerRef.current);
      }
    };
  }, []);

  // Restore scroll position when filePath or content changes
  useEffect(() => {
    if (!filePath || !containerRef.current) return;

    isRestoringRef.current = true;
    const element = containerRef.current;

    // Small timeout to allow DOM to paint the new content
    const timeout = setTimeout(() => {
      scrollMemory.restoreScroll(element, filePath, () => {
        isRestoringRef.current = false;
        handleScroll();
      });
    }, 40);

    return () => {
      clearTimeout(timeout);
    };
  }, [filePath, content, handleScroll]);

  // Initial spy check when headings or content change
  useEffect(() => {
    if (headings.length > 0) {
      const timer = setTimeout(() => {
        handleScroll();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [headings, content, handleScroll]);

  return { containerRef, handleScroll, lockScrollSpy };
}

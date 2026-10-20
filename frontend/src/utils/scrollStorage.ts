import type { ScrollState } from '../types';

const STORAGE_KEY = 'tmarkdown_scroll_memory';

class ScrollMemoryManager {
  private memory: Map<string, ScrollState> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed: Record<string, ScrollState> = JSON.parse(data);
        for (const [key, val] of Object.entries(parsed)) {
          this.memory.set(key, val);
        }
      }
    } catch (err) {
      console.warn('Failed to load scroll memory from localStorage:', err);
    }
  }

  private saveToStorage() {
    try {
      const obj: Record<string, ScrollState> = {};
      this.memory.forEach((val, key) => {
        obj[key] = val;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (err) {
      console.warn('Failed to save scroll memory to localStorage:', err);
    }
  }

  public savePosition(filePath: string, scrollTop: number, scrollHeight: number, clientHeight: number, activeHeadingId?: string) {
    if (!filePath || scrollHeight <= clientHeight) return;
    const maxScroll = scrollHeight - clientHeight;
    const scrollRatio = maxScroll > 0 ? scrollTop / maxScroll : 0;

    const state: ScrollState = {
      scrollTop,
      scrollRatio,
      activeHeadingId,
      lastUpdated: Date.now()
    };

    this.memory.set(filePath, state);
    this.saveToStorage();
  }

  public getPosition(filePath: string): ScrollState | undefined {
    return this.memory.get(filePath);
  }

  public restoreScroll(element: HTMLElement | null, filePath: string, onDone?: () => void): boolean {
    if (!element || !filePath) return false;
    const state = this.memory.get(filePath);
    if (!state) {
      if (onDone) onDone();
      return false;
    }

    let attempts = 0;
    const maxAttempts = 5;

    const applyScroll = () => {
      attempts++;
      const maxScroll = element.scrollHeight - element.clientHeight;

      if (maxScroll > 0) {
        if (state.scrollTop <= maxScroll) {
          element.scrollTop = state.scrollTop;
        } else {
          element.scrollTop = Math.round(state.scrollRatio * maxScroll);
        }

        // If target reached or close enough, complete
        if (Math.abs(element.scrollTop - state.scrollTop) < 5 || attempts >= maxAttempts) {
          if (onDone) onDone();
          return;
        }
      }

      if (attempts < maxAttempts) {
        requestAnimationFrame(applyScroll);
      } else {
        if (onDone) onDone();
      }
    };

    requestAnimationFrame(applyScroll);
    return true;
  }
}

export const scrollMemory = new ScrollMemoryManager();

export interface FileNode {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  size?: number;
}

export interface TabItem {
  id: string;
  name: string;
  path: string;
  isDirty?: boolean;
}

export interface HeadingItem {
  id: string;
  level: number;
  text: string;
}

export interface ScrollState {
  scrollTop: number;
  scrollRatio: number;
  activeHeadingId?: string;
  lastUpdated: number;
}

export interface RecentItem {
  path: string;
  name: string;
  timestamp: number;
}

export interface VaultSession {
  vaultPath: string;
  vaultName: string;
  openTabs: TabItem[];
  activeTabId: string | null;
  scrollMemory: Record<string, ScrollState>;
  favorites?: string[];
  recentFiles?: RecentItem[];
}

export type ViewMode = 'reading' | 'edit' | 'split';
export type ContentWidthMode = 'standard' | 'wide' | 'full';


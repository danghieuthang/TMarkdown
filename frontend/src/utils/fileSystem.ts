import type { FileNode } from '../types';
import { SAMPLE_VAULT_FILES, SAMPLE_FILE_CONTENTS } from '../data/sampleVault';
import * as GoApp from '../../wailsjs/go/main/App';

// Check if running in Wails native environment
export function isWailsEnvironment(): boolean {
  return typeof (window as any).go !== 'undefined' && typeof (window as any).go.main !== 'undefined';
}

export class VaultService {
  private currentHandle: any = null;
  private currentVaultRoot: string | null = null;
  private fileCache: Map<string, string> = new Map();

  constructor() {
    // Pre-populate cache with sample files
    for (const [path, content] of Object.entries(SAMPLE_FILE_CONTENTS)) {
      this.fileCache.set(path, content);
    }
  }

  public getVaultRoot(): string | null {
    return this.currentVaultRoot;
  }

  public setVaultRoot(path: string | null) {
    this.currentVaultRoot = path;
  }

  // Clear or invalidate cached file contents
  public invalidateCache(filePath?: string) {
    if (filePath) {
      this.fileCache.delete(filePath);
    } else {
      this.fileCache.clear();
    }
  }

  // Listen to vault file system changes from Go backend
  public onVaultFileChanged(callback: (event: { path: string; op: string }) => void): () => void {
    if (typeof (window as any).runtime?.EventsOn === 'function') {
      (window as any).runtime.EventsOn('vault:file-changed', callback);
      return () => {
        if (typeof (window as any).runtime?.EventsOff === 'function') {
          (window as any).runtime.EventsOff('vault:file-changed');
        }
      };
    }
    return () => {};
  }

  // Open directory directly by path (e.g. from session persistence)
  public async openVaultPath(folderPath: string): Promise<{ name: string; rootPath: string; files: FileNode[] } | null> {
    if (isWailsEnvironment() && folderPath) {
      try {
        const files = await GoApp.GetDirectoryTree(folderPath);
        const name = folderPath.replace(/\\/g, '/').split('/').filter(Boolean).pop() || folderPath;
        this.currentVaultRoot = folderPath;
        return {
          name,
          rootPath: folderPath,
          files: (files as any) || []
        };
      } catch (err) {
        console.warn('Wails openVaultPath failed:', err);
      }
    }
    return null;
  }

  // Open directory via native Wails Go backend or fallback to Web File System Access API
  public async openDirectory(): Promise<{ name: string; rootPath: string; files: FileNode[] } | null> {
    if (isWailsEnvironment()) {
      try {
        const folderPath = await GoApp.OpenFolderDialog();
        if (folderPath) {
          return await this.openVaultPath(folderPath);
        }
        return null;
      } catch (err) {
        console.warn('Wails OpenFolderDialog failed, attempting fallback:', err);
      }
    }

    // Web File System Access API fallback
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite'
        });
        this.currentHandle = dirHandle;
        this.currentVaultRoot = dirHandle.name;
        const files = await this.readDirectoryRecursive(dirHandle, '');
        return {
          name: dirHandle.name,
          rootPath: dirHandle.name,
          files
        };
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Failed to open directory:', err);
        }
        return null;
      }
    }

    // Default sample vault
    return {
      name: 'Sample Vault',
      rootPath: 'sample',
      files: SAMPLE_VAULT_FILES
    };
  }

  // Recursively read directory handle for Web fallback
  private async readDirectoryRecursive(dirHandle: any, parentPath: string): Promise<FileNode[]> {
    const nodes: FileNode[] = [];

    for await (const entry of dirHandle.values()) {
      const currentPath = `${parentPath}/${entry.name}`;
      if (entry.kind === 'directory') {
        if (entry.name === '.git' || entry.name === 'node_modules' || entry.name.startsWith('.')) {
          continue;
        }
        const children = await this.readDirectoryRecursive(entry, currentPath);
        nodes.push({
          id: currentPath,
          name: entry.name,
          path: currentPath,
          isDirectory: true,
          children
        });
      } else if (entry.kind === 'file') {
        const ext = entry.name.toLowerCase();
        if (ext.endsWith('.md') || ext.endsWith('.markdown') || ext.endsWith('.txt')) {
          const file = await entry.getFile();
          nodes.push({
            id: currentPath,
            name: entry.name,
            path: currentPath,
            isDirectory: false,
            size: file.size
          });
        }
      }
    }

    return nodes.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  // Read file content
  public async readFile(filePath: string): Promise<string> {
    if (this.fileCache.has(filePath)) {
      return this.fileCache.get(filePath)!;
    }

    // If in Wails and root folder is loaded
    if (isWailsEnvironment() && this.currentVaultRoot) {
      try {
        const content = await GoApp.ReadFile(this.currentVaultRoot, filePath);
        this.fileCache.set(filePath, content);
        return content;
      } catch (err) {
        console.error(`Wails ReadFile error on ${filePath}:`, err);
      }
    }

    // If using Web directory handle
    if (this.currentHandle) {
      try {
        const parts = filePath.split('/').filter(Boolean);
        let current = this.currentHandle;
        for (let i = 0; i < parts.length - 1; i++) {
          current = await current.getDirectoryHandle(parts[i]);
        }
        const fileHandle = await current.getFileHandle(parts[parts.length - 1]);
        const file = await fileHandle.getFile();
        const text = await file.text();
        this.fileCache.set(filePath, text);
        return text;
      } catch (err) {
        console.error(`Web handle readFile error on ${filePath}:`, err);
      }
    }

    return '# Tài liệu trống\n\nBắt đầu viết ghi chú tại đây...';
  }

  // Write file content
  public async writeFile(filePath: string, content: string): Promise<boolean> {
    this.fileCache.set(filePath, content);

    // If in Wails
    if (isWailsEnvironment() && this.currentVaultRoot) {
      try {
        await GoApp.WriteFile(this.currentVaultRoot, filePath, content);
        return true;
      } catch (err) {
        console.error(`Wails WriteFile error on ${filePath}:`, err);
        return false;
      }
    }

    // If using Web handle
    if (this.currentHandle) {
      try {
        const parts = filePath.split('/').filter(Boolean);
        let current = this.currentHandle;
        for (let i = 0; i < parts.length - 1; i++) {
          current = await current.getDirectoryHandle(parts[i], { create: true });
        }
        const fileHandle = await current.getFileHandle(parts[parts.length - 1], { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        return true;
      } catch (err) {
        console.error(`Web handle writeFile error on ${filePath}:`, err);
        return false;
      }
    }

    return true;
  }

  // Create new file
  public async createNewFile(relativePath: string, initialContent = ''): Promise<{ success: boolean; error?: string }> {
    if (isWailsEnvironment() && this.currentVaultRoot) {
      try {
        await GoApp.CreateNewFile(this.currentVaultRoot, relativePath, initialContent);
        this.fileCache.set(relativePath, initialContent);
        return { success: true };
      } catch (err: any) {
        console.error('Wails CreateNewFile error:', err);
        return { success: false, error: err?.toString() || 'Lỗi tạo tệp tin' };
      }
    }
    return { success: false, error: 'Chỉ hỗ trợ trong môi trường Vault thực tế' };
  }

  // Create new directory
  public async createNewDirectory(relativePath: string): Promise<{ success: boolean; error?: string }> {
    if (isWailsEnvironment() && this.currentVaultRoot) {
      try {
        await GoApp.CreateNewDirectory(this.currentVaultRoot, relativePath);
        return { success: true };
      } catch (err: any) {
        console.error('Wails CreateNewDirectory error:', err);
        return { success: false, error: err?.toString() || 'Lỗi tạo thư mục' };
      }
    }
    return { success: false, error: 'Chỉ hỗ trợ trong môi trường Vault thực tế' };
  }

  // Rename path
  public async renamePath(oldRelPath: string, newRelPath: string): Promise<{ success: boolean; error?: string }> {
    if (isWailsEnvironment() && this.currentVaultRoot) {
      try {
        await GoApp.RenamePath(this.currentVaultRoot, oldRelPath, newRelPath);
        if (this.fileCache.has(oldRelPath)) {
          const cached = this.fileCache.get(oldRelPath)!;
          this.fileCache.delete(oldRelPath);
          this.fileCache.set(newRelPath, cached);
        }
        return { success: true };
      } catch (err: any) {
        console.error('Wails RenamePath error:', err);
        return { success: false, error: err?.toString() || 'Lỗi đổi tên' };
      }
    }
    return { success: false, error: 'Chỉ hỗ trợ trong môi trường Vault thực tế' };
  }

  // Delete path
  public async deletePath(relativePath: string): Promise<{ success: boolean; error?: string }> {
    if (isWailsEnvironment() && this.currentVaultRoot) {
      try {
        await GoApp.DeletePath(this.currentVaultRoot, relativePath);
        this.fileCache.delete(relativePath);
        return { success: true };
      } catch (err: any) {
        console.error('Wails DeletePath error:', err);
        return { success: false, error: err?.toString() || 'Lỗi xóa tệp/thư mục' };
      }
    }
    return { success: false, error: 'Chỉ hỗ trợ trong môi trường Vault thực tế' };
  }

  // Show in explorer
  public async showInFolder(relativePath: string): Promise<void> {
    if (isWailsEnvironment() && this.currentVaultRoot) {
      try {
        await GoApp.ShowInFolder(this.currentVaultRoot, relativePath);
      } catch (err) {
        console.error('Wails ShowInFolder error:', err);
      }
    }
  }

  // Refresh current directory tree
  public async refreshDirectoryTree(): Promise<FileNode[]> {
    if (isWailsEnvironment() && this.currentVaultRoot) {
      try {
        const files = await GoApp.GetDirectoryTree(this.currentVaultRoot);
        return (files as any) || [];
      } catch (err) {
        console.error('Wails refreshDirectoryTree error:', err);
      }
    }
    return [];
  }

  // Fast Vault Search via Go Goroutines
  public async searchVault(query: string): Promise<any[]> {
    if (isWailsEnvironment() && this.currentVaultRoot) {
      try {
        return await GoApp.SearchVault(this.currentVaultRoot, query);
      } catch (err) {
        console.error('Wails SearchVault error:', err);
      }
    }
    return [];
  }

  // Save session state to disk
  public async saveSession(sessionJSON: string): Promise<void> {
    if (isWailsEnvironment()) {
      try {
        await GoApp.SaveSession(sessionJSON);
      } catch (err) {
        console.warn('Wails SaveSession error:', err);
      }
    }
  }

  // Load session state from disk
  public async loadSession(): Promise<string | null> {
    if (isWailsEnvironment()) {
      try {
        const data = await GoApp.LoadSession();
        if (data) return data;
      } catch (err) {
        console.warn('Wails LoadSession error (new session):', err);
      }
    }
    return null;
  }
}

export const vaultService = new VaultService();

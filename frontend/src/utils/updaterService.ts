import * as GoApp from '../../wailsjs/go/main/App';
import { isWailsEnvironment } from './fileSystem';

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  assetUrl: string;
  assetSize: number;
  publishedAt: string;
  htmlUrl: string;
}

export interface DownloadProgress {
  percent: number;
  downloaded: number;
  total: number;
}

class UpdaterService {
  private isChecking: boolean = false;
  private isDownloading: boolean = false;

  public isAutoCheckEnabled(): boolean {
    const saved = localStorage.getItem('tmarkdown_auto_check_updates');
    return saved === null ? true : saved === 'true';
  }

  public setAutoCheckEnabled(enabled: boolean) {
    localStorage.setItem('tmarkdown_auto_check_updates', String(enabled));
  }

  public async checkForUpdates(manual: boolean = false): Promise<UpdateInfo | null> {
    if (this.isChecking) return null;
    this.isChecking = true;

    try {
      if (isWailsEnvironment()) {
        const res = await GoApp.CheckForUpdates(manual);
        return res as UpdateInfo;
      }

      // Browser Mock / Fallback for development
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        hasUpdate: false,
        currentVersion: '1.1.1',
        latestVersion: '1.1.1',
        releaseName: 'TMarkdown v1.1.1',
        releaseNotes: 'Bản phát hành ổn định.',
        assetUrl: '',
        assetSize: 0,
        publishedAt: new Date().toISOString(),
        htmlUrl: 'https://github.com/danghieuthang/TMarkdown/releases'
      };
    } catch (err) {
      if (manual) throw err;
      return null;
    } finally {
      this.isChecking = false;
    }
  }

  public async downloadUpdate(
    assetUrl: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    if (this.isDownloading) return;
    this.isDownloading = true;

    let cleanupProgress: (() => void) | undefined;
    if (onProgress && typeof (window as any).runtime?.EventsOn === 'function') {
      const handler = (data: DownloadProgress) => {
        onProgress(data);
      };
      (window as any).runtime.EventsOn('update:progress', handler);
      cleanupProgress = () => {
        (window as any).runtime.EventsOff('update:progress');
      };
    }

    try {
      if (isWailsEnvironment()) {
        await GoApp.DownloadUpdate(assetUrl);
      } else {
        // Dev mode simulation
        for (let p = 0; p <= 100; p += 15) {
          await new Promise(resolve => setTimeout(resolve, 150));
          onProgress?.({ percent: p, downloaded: p * 1024 * 100, total: 100 * 1024 * 100 });
        }
      }
    } finally {
      cleanupProgress?.();
      this.isDownloading = false;
    }
  }

  public async applyUpdateAndRestart(): Promise<void> {
    if (isWailsEnvironment()) {
      await GoApp.ApplyUpdateAndRestart();
    } else {
      alert('Ứng dụng đang chạy trong môi trường trình duyệt. Trên ứng dụng Windows desktop, app sẽ tự động hoán đổi file và khởi động lại ngay lập tức.');
    }
  }
}

export const updaterService = new UpdaterService();

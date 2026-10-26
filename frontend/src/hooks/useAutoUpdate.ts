import { useState, useEffect, useCallback, useRef } from 'react';
import { updaterService, type UpdateInfo, type DownloadProgress } from '../utils/updaterService';
import type { ToastItem } from '../components/ui/Toast';

export function useAutoUpdate() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [isReadyToRestart, setIsReadyToRestart] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const hasCheckedRef = useRef(false);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const checkForUpdates = useCallback(
    async (manual: boolean = false) => {
      setIsChecking(true);
      setErrorMessage(null);

      try {
        const info = await updaterService.checkForUpdates(manual);
        if (info) {
          setUpdateInfo(info);
          if (info.hasUpdate) {
            // Non-intrusive notification: toast + badge
            addToast({
              type: 'accent',
              title: `Có bản cập nhật mới v${info.latestVersion}!`,
              message: info.releaseName || 'Nhấp vào để xem chi tiết và cập nhật.',
              duration: 8000,
              action: {
                label: 'Xem & Cập nhật',
                onClick: () => setIsModalOpen(true)
              }
            });
          } else if (manual) {
            addToast({
              type: 'success',
              title: 'Bạn đang dùng phiên bản mới nhất',
              message: `TMarkdown v${info.currentVersion} là phiên bản mới nhất.`,
              duration: 4000
            });
          }
        }
      } catch (err: any) {
        const msg = err?.message || 'Không thể kiểm tra bản cập nhật mới';
        setErrorMessage(msg);
        if (manual) {
          addToast({
            type: 'danger',
            title: 'Lỗi kiểm tra cập nhật',
            message: msg,
            duration: 5000
          });
        }
      } finally {
        setIsChecking(false);
      }
    },
    [addToast]
  );

  const startDownload = useCallback(async () => {
    if (!updateInfo || !updateInfo.assetUrl) {
      setErrorMessage('Không tìm thấy đường dẫn tải file cập nhật');
      return;
    }

    setIsDownloading(true);
    setErrorMessage(null);
    setDownloadProgress({ percent: 0, downloaded: 0, total: updateInfo.assetSize || 0 });

    try {
      await updaterService.downloadUpdate(updateInfo.assetUrl, progress => {
        setDownloadProgress(progress);
      });
      setIsReadyToRestart(true);
      addToast({
        type: 'success',
        title: 'Tải bản cập nhật hoàn tất!',
        message: 'Nhấp Khởi động lại để bắt đầu sử dụng phiên bản mới.',
        duration: 0,
        action: {
          label: 'Khởi động lại ngay',
          onClick: async () => {
            await updaterService.applyUpdateAndRestart();
          }
        }
      });
    } catch (err: any) {
      const msg = err?.message || 'Lỗi trong quá trình tải bản cập nhật';
      setErrorMessage(msg);
      addToast({
        type: 'danger',
        title: 'Tải cập nhật thất bại',
        message: msg,
        duration: 6000
      });
    } finally {
      setIsDownloading(false);
    }
  }, [updateInfo, addToast]);

  const applyAndRestart = useCallback(async () => {
    try {
      await updaterService.applyUpdateAndRestart();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể khởi động lại ứng dụng');
    }
  }, []);

  // Background check on startup if enabled
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    if (updaterService.isAutoCheckEnabled()) {
      // Delay slightly (2.5s) so app startup is snappy and render isn't blocked
      const timer = setTimeout(() => {
        checkForUpdates(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [checkForUpdates]);

  return {
    updateInfo,
    isChecking,
    isDownloading,
    downloadProgress,
    isReadyToRestart,
    isModalOpen,
    setIsModalOpen,
    errorMessage,
    toasts,
    dismissToast,
    checkForUpdates,
    startDownload,
    applyAndRestart
  };
}

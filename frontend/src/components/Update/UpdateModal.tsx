import { useMemo } from 'react';
import { Sparkles, Download, RotateCw, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import { renderMarkdown } from '../../utils/markdownParser';
import type { UpdateInfo, DownloadProgress } from '../../utils/updaterService';

export interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: UpdateInfo | null;
  isDownloading: boolean;
  downloadProgress: DownloadProgress | null;
  isReadyToRestart: boolean;
  errorMessage: string | null;
  onStartDownload: () => void;
  onApplyAndRestart: () => void;
}

export function UpdateModal({
  isOpen,
  onClose,
  updateInfo,
  isDownloading,
  downloadProgress,
  isReadyToRestart,
  errorMessage,
  onStartDownload,
  onApplyAndRestart
}: UpdateModalProps) {
  const renderedChangelog = useMemo(() => {
    if (!updateInfo?.releaseNotes) return '';
    return renderMarkdown(updateInfo.releaseNotes);
  }, [updateInfo?.releaseNotes]);

  if (!updateInfo) return null;

  const formattedDate = updateInfo.publishedAt
    ? new Date(updateInfo.publishedAt).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  const formatBytes = (bytes: number) => {
    if (bytes <= 0) return '0 B';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isDownloading ? () => {} : onClose}
      size="md"
      closeOnOverlayClick={!isDownloading}
      closeOnEsc={!isDownloading}
      icon={<Sparkles size={20} color="var(--accent-primary)" />}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Cập nhật TMarkdown</span>
          <Badge variant="accent">v{updateInfo.latestVersion}</Badge>
        </div>
      }
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <a
            href={updateInfo.htmlUrl || 'https://github.com/danghieuthang/TMarkdown/releases'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none'
            }}
          >
            <span>Xem trên GitHub</span>
            <ExternalLink size={12} />
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isReadyToRestart && !isDownloading && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Để sau
              </Button>
            )}

            {!isReadyToRestart && !isDownloading && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Download size={14} />}
                onClick={onStartDownload}
              >
                Cập nhật ngay
              </Button>
            )}

            {isDownloading && (
              <Button variant="primary" size="sm" disabled loading>
                Đang tải xuống...
              </Button>
            )}

            {isReadyToRestart && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<RotateCw size={14} />}
                onClick={onApplyAndRestart}
              >
                Khởi động lại ngay
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Release Summary Header */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
              {updateInfo.releaseName || `Phiên bản v${updateInfo.latestVersion}`}
            </span>
            {formattedDate && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                {formattedDate}
              </span>
            )}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Phiên bản hiện tại: <code style={{ color: 'var(--text-muted)' }}>v{updateInfo.currentVersion}</code> → Phiên bản mới: <strong style={{ color: 'var(--text-accent)' }}>v{updateInfo.latestVersion}</strong>
          </div>
        </div>

        {/* Download Progress State */}
        {isDownloading && downloadProgress && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <ProgressBar
              progress={downloadProgress.percent}
              label="Đang tải bản cập nhật trực tiếp..."
            />
            {downloadProgress.total > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
                {formatBytes(downloadProgress.downloaded)} / {formatBytes(downloadProgress.total)}
              </div>
            )}
          </div>
        )}

        {/* Ready to restart State */}
        {isReadyToRestart && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--color-success-bg)',
              border: '1px solid var(--color-success)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--color-success)'
            }}
          >
            <CheckCircle2 size={18} />
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
              <strong>Tải hoàn tất!</strong> Ứng dụng sẽ tự động hoán đổi phiên bản và khởi động lại ngay khi bạn bấm nút bên dưới.
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--color-danger)',
              fontSize: 'var(--text-xs)'
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Release Notes Changelog */}
        <div>
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}
          >
            Nhật ký thay đổi (Release Notes)
          </div>
          <div
            className="markdown-body"
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              padding: '12px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              lineHeight: 1.6
            }}
            dangerouslySetInnerHTML={{ __html: renderedChangelog || '<p>Không có ghi chú phát hành.</p>' }}
          />
        </div>
      </div>
    </Modal>
  );
}

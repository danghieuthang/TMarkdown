import React from 'react';
import { AlignLeft, Clock, Percent, FileCheck, Type } from 'lucide-react';

interface StatusBarProps {
  currentFilePath: string | null;
  content: string;
  scrollProgress: number;
  fontSize?: number;
  onChangeFontSize?: (newSize: number) => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  currentFilePath,
  content,
  scrollProgress,
  fontSize = 15,
  onChangeFontSize
}) => {
  // Calculate word count with high-performance O(1) memory algorithm
  const wordCount = React.useMemo(() => {
    if (!content) return 0;
    let count = 0;
    let inWord = false;
    for (let i = 0; i < content.length; i++) {
      const c = content.charCodeAt(i);
      if (c <= 32) {
        inWord = false;
      } else if (!inWord) {
        inWord = true;
        count++;
      }
    }
    return count;
  }, [content]);

  // Estimate reading time (~200 words per minute)
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <footer className="status-bar">
      <div className="status-bar-left">
        <span className="status-pill">
          <FileCheck size={13} style={{ color: 'var(--callout-tip)' }} />
          <span>{currentFilePath ? currentFilePath.split('/').pop() : 'Chưa mở file'}</span>
        </span>
        {currentFilePath && (
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
            {currentFilePath}
          </span>
        )}
      </div>

      <div className="status-bar-right">
        {/* Font scaling controls */}
        {onChangeFontSize && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--bg-input)', padding: '1px 6px', borderRadius: 4 }}>
            <Type size={12} style={{ opacity: 0.6, marginRight: 2 }} />
            <button
              className="action-btn"
              style={{ padding: '0 4px', fontSize: 12, height: 18, minWidth: 16 }}
              onClick={() => onChangeFontSize(Math.max(12, fontSize - 1))}
              title="Giảm cỡ chữ"
            >
              -
            </button>
            <span style={{ fontSize: 11, minWidth: 26, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{fontSize}px</span>
            <button
              className="action-btn"
              style={{ padding: '0 4px', fontSize: 12, height: 18, minWidth: 16 }}
              onClick={() => onChangeFontSize(Math.min(24, fontSize + 1))}
              title="Tăng cỡ chữ"
            >
              +
            </button>
          </div>
        )}

        <span className="status-pill" title="Tổng số từ trong tài liệu">
          <AlignLeft size={13} />
          <span>{wordCount.toLocaleString()} từ</span>
        </span>

        <span className="status-pill" title="Thời gian đọc ước tính">
          <Clock size={13} />
          <span>~{readingTimeMinutes} phút đọc</span>
        </span>

        <span className="status-pill" title="Tiến độ cuộn tài liệu">
          <Percent size={13} />
          <span>{scrollProgress}%</span>
        </span>
      </div>
    </footer>
  );
};

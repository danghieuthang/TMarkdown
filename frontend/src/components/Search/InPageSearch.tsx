import React, { useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, X, Search } from 'lucide-react';

interface InPageSearchProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  currentIndex: number;
  totalMatches: number;
  onNext: () => void;
  onPrev: () => void;
}

export const InPageSearch: React.FC<InPageSearchProps> = ({
  isOpen,
  onClose,
  query,
  onQueryChange,
  currentIndex,
  totalMatches,
  onNext,
  onPrev
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrev();
      } else {
        onNext();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="in-page-search-bar" onClick={(e) => e.stopPropagation()}>
      <div className="in-page-search-input-wrapper">
        <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          className="in-page-search-input"
          placeholder="Tìm trong trang (Ctrl+F)..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className="in-page-search-count">
        {totalMatches > 0 ? (
          <span>{currentIndex + 1} / {totalMatches}</span>
        ) : query ? (
          <span style={{ color: 'var(--callout-danger)' }}>0 / 0</span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>0</span>
        )}
      </div>

      <div className="in-page-search-actions">
        <button
          className="search-nav-btn"
          onClick={onPrev}
          disabled={totalMatches === 0}
          title="Kết quả trước (Shift + Enter)"
        >
          <ChevronUp size={15} />
        </button>
        <button
          className="search-nav-btn"
          onClick={onNext}
          disabled={totalMatches === 0}
          title="Kết quả tiếp theo (Enter)"
        >
          <ChevronDown size={15} />
        </button>
        <button
          className="search-nav-btn close"
          onClick={onClose}
          title="Đóng (Esc)"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};

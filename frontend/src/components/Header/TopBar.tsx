import React from 'react';
import { 
  FolderOpen, 
  Search, 
  Sun, 
  Moon, 
  Edit3, 
  Book, 
  PanelLeftClose, 
  PanelLeft, 
  ListTree,
  Maximize2,
  FoldHorizontal,
  UnfoldHorizontal,
  Maximize
} from 'lucide-react';
import logoDark from '../../assets/logo.png';
import logoWhite from '../../assets/logo-white.png';
import type { ViewMode, ContentWidthMode } from '../../types';

interface TopBarProps {
  vaultName: string;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  contentWidth?: ContentWidthMode;
  onChangeContentWidth?: (mode: ContentWidthMode) => void;
  onOpenFolder: () => void;
  onOpenSearch: () => void;
  showLeftSidebar: boolean;
  onToggleLeftSidebar: () => void;
  showRightSidebar: boolean;
  onToggleRightSidebar: () => void;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  vaultName,
  theme,
  onToggleTheme,
  viewMode,
  onChangeViewMode,
  contentWidth = 'wide',
  onChangeContentWidth,
  onOpenFolder,
  onOpenSearch,
  showLeftSidebar,
  onToggleLeftSidebar,
  showRightSidebar,
  onToggleRightSidebar,
  isZenMode = false,
  onToggleZenMode
}) => {
  const handleCycleWidth = () => {
    if (!onChangeContentWidth) return;
    if (contentWidth === 'standard') {
      onChangeContentWidth('wide');
    } else if (contentWidth === 'wide') {
      onChangeContentWidth('full');
    } else {
      onChangeContentWidth('standard');
    }
  };
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button 
          className="action-btn" 
          onClick={onToggleLeftSidebar} 
          title={showLeftSidebar ? "Thu gọn thanh cây file (Ctrl+B)" : "Mở thanh cây file"}
        >
          {showLeftSidebar ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
        </button>

        <div className="brand-badge" title="TMarkdown — Obsidian-Lite Markdown Reader">
          <img 
            src={theme === 'dark' ? logoWhite : logoDark} 
            alt="TMarkdown Logo" 
            className="brand-logo-img" 
          />
          <span className="brand-title">TMarkdown</span>
        </div>

        <button 
          className="vault-selector-btn" 
          onClick={onOpenFolder}
          title="Chọn thư mục chứa tài liệu trên máy tính"
        >
          <FolderOpen size={14} />
          <span>{vaultName}</span>
        </button>
      </div>

      <div className="topbar-center">
        <button 
          className="search-trigger-btn" 
          onClick={onOpenSearch}
          title="Tìm kiếm file hoặc nội dung (Ctrl+P)"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search size={14} />
            <span>Tìm nhanh tài liệu...</span>
          </div>
          <span className="kbd-shortcut">Ctrl P</span>
        </button>
      </div>

      <div className="topbar-right">
        {/* Toggle View Mode */}
        <div style={{ display: 'flex', background: 'var(--bg-input)', padding: 2, borderRadius: 'var(--radius-sm)' }}>
          <button
            className={`action-btn ${viewMode === 'reading' ? 'active' : ''}`}
            onClick={() => onChangeViewMode('reading')}
            title="Chế độ đọc (Reading Mode) - Ctrl+E"
          >
            <Book size={16} />
          </button>
          <button
            className={`action-btn ${viewMode === 'edit' ? 'active' : ''}`}
            onClick={() => onChangeViewMode('edit')}
            title="Chế độ soạn thảo (Edit Mode) - Ctrl+E"
          >
            <Edit3 size={16} />
          </button>
        </div>

        {/* Content Width Toggle */}
        {onChangeContentWidth && (
          <button
            className={`action-btn ${contentWidth === 'full' ? 'active' : ''}`}
            onClick={handleCycleWidth}
            title={
              contentWidth === 'standard'
                ? 'Độ rộng: Chuẩn (840px) • Bấm để mở rộng (Wide 1200px)'
                : contentWidth === 'wide'
                ? 'Độ rộng: Rộng (1200px) • Bấm để bung toàn màn hình (Full 100%)'
                : 'Độ rộng: Toàn màn hình (100%) • Bấm để thu về Chuẩn (840px)'
            }
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 7px' }}
          >
            {contentWidth === 'standard' ? (
              <FoldHorizontal size={15} />
            ) : contentWidth === 'wide' ? (
              <UnfoldHorizontal size={15} />
            ) : (
              <Maximize size={15} />
            )}
            <span style={{ fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
              {contentWidth === 'standard' ? '840' : contentWidth === 'wide' ? '1200' : 'Full'}
            </span>
          </button>
        )}

        {/* Outline Sidebar Toggle */}
        <button
          className={`action-btn ${showRightSidebar ? 'active' : ''}`}
          onClick={onToggleRightSidebar}
          title="Bật/Tắt thanh Mục lục (TOC Outline)"
        >
          <ListTree size={18} />
        </button>

        {/* Zen / Focus Mode Toggle (F10) */}
        {onToggleZenMode && (
          <button 
            className={`action-btn ${isZenMode ? 'active' : ''}`} 
            onClick={onToggleZenMode}
            title="Chế độ tập trung đọc (Zen Mode - F10)"
          >
            <Maximize2 size={16} />
          </button>
        )}

        {/* Theme Toggle */}
        <button 
          className="action-btn" 
          onClick={onToggleTheme}
          title={theme === 'dark' ? "Chuyển sang giao diện sáng (Light Mode)" : "Chuyển sang giao diện tối (Dark Mode)"}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};

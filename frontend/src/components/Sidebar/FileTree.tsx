import React, { useState, useRef, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FolderPlus,
  FileText, 
  FilePlus, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  RotateCw,
  MoreVertical,
  Trash2,
  Edit2,
  ExternalLink,
  Star,
  Clock
} from 'lucide-react';
import type { FileNode, RecentItem } from '../../types';

interface FileTreeProps {
  files: FileNode[];
  activeFilePath: string | null;
  onSelectFile: (file: FileNode) => void;
  onNewFile: (targetFolder?: string, fileName?: string) => Promise<boolean>;
  onNewFolder: (targetFolder?: string, folderName?: string) => Promise<boolean>;
  onRenamePath: (oldPath: string, newPath: string) => Promise<boolean>;
  onDeletePath: (path: string, isDirectory: boolean) => Promise<boolean>;
  onShowInFolder?: (path: string) => void;
  onRefresh?: () => void;
  favorites?: string[];
  onToggleFavorite?: (path: string) => void;
  recentFiles?: RecentItem[];
  onClearRecent?: () => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  node: FileNode | null;
}

interface CreatingState {
  type: 'file' | 'folder';
  targetFolder: string; // empty string for root
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  activeFilePath,
  onSelectFile,
  onNewFile,
  onNewFolder,
  onRenamePath,
  onDeletePath,
  onShowInFolder,
  onRefresh,
  favorites = [],
  onToggleFavorite,
  recentFiles = [],
  onClearRecent
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'favorites' | 'recent'>('files');
  const [filterText, setFilterText] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  // Helper to resolve and select file by path
  const handleSelectByPath = (path: string, name?: string) => {
    const findNode = (nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
        if (!node.isDirectory && (node.path === path || node.path.endsWith('/' + path))) {
          return node;
        }
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const targetNode = findNode(files);
    if (targetNode) {
      onSelectFile(targetNode);
    } else {
      const fallbackName = name || path.split('/').pop() || path;
      onSelectFile({
        id: path,
        path,
        name: fallbackName,
        isDirectory: false
      });
    }
  };

  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diffSec = Math.floor((now - timestamp) / 1000);
    if (diffSec < 60) return 'Vừa xong';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return new Date(timestamp).toLocaleDateString('vi-VN');
  };
  
  // Inline creation state
  const [creating, setCreating] = useState<CreatingState | null>(null);
  const [createName, setCreateName] = useState('');
  const createInputRef = useRef<HTMLInputElement | null>(null);

  // Inline rename state
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement | null>(null);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    node: null
  });

  // Focus inputs when activated
  useEffect(() => {
    if (creating && createInputRef.current) {
      createInputRef.current.focus();
      createInputRef.current.select();
    }
  }, [creating]);

  useEffect(() => {
    if (renamingPath && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingPath]);

  // Close context menu on outside click
  useEffect(() => {
    const handleCloseMenu = () => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, [contextMenu.visible]);

  const toggleFolder = (folderPath: string) => {
    setCollapsedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const handleStartCreate = (type: 'file' | 'folder', targetFolder = '') => {
    setCreating({ type, targetFolder });
    setCreateName(type === 'file' ? 'Ghi_chu_moi.md' : 'Thu_muc_moi');
    if (targetFolder) {
      setCollapsedFolders(prev => ({ ...prev, [targetFolder]: false }));
    }
  };

  const handleConfirmCreate = async () => {
    if (!creating || !createName.trim()) {
      setCreating(null);
      return;
    }

    let finalName = createName.trim();
    if (creating.type === 'file' && !finalName.endsWith('.md') && !finalName.endsWith('.markdown') && !finalName.endsWith('.txt')) {
      finalName += '.md';
    }

    const relPath = creating.targetFolder ? `${creating.targetFolder}/${finalName}` : finalName;
    if (creating.type === 'file') {
      await onNewFile(creating.targetFolder, relPath);
    } else {
      await onNewFolder(creating.targetFolder, relPath);
    }

    setCreating(null);
    setCreateName('');
  };

  const handleStartRename = (node: FileNode) => {
    setRenamingPath(node.path);
    setRenameValue(node.name);
  };

  const handleConfirmRename = async (oldNode: FileNode) => {
    if (!renamingPath || !renameValue.trim() || renameValue.trim() === oldNode.name) {
      setRenamingPath(null);
      return;
    }

    let newName = renameValue.trim();
    if (!oldNode.isDirectory && !newName.endsWith('.md') && !newName.endsWith('.markdown') && !newName.endsWith('.txt')) {
      newName += '.md';
    }

    const parts = oldNode.path.split('/');
    parts.pop();
    const newRelPath = parts.length > 0 ? `${parts.join('/')}/${newName}` : newName;

    await onRenamePath(oldNode.path, newRelPath);
    setRenamingPath(null);
  };

  const handleDelete = async (node: FileNode) => {
    const confirmMsg = node.isDirectory
      ? `Bạn có chắc chắn muốn xóa thư mục "${node.name}" và toàn bộ tệp bên trong không?`
      : `Bạn có chắc chắn muốn xóa tệp "${node.name}" không?`;

    if (window.confirm(confirmMsg)) {
      await onDeletePath(node.path, node.isDirectory);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: Math.min(window.innerWidth - 200, e.clientX),
      y: Math.min(window.innerHeight - 200, e.clientY),
      node
    });
  };

  const renderNode = (node: FileNode, depth = 0) => {
    if (filterText && !node.isDirectory && !node.name.toLowerCase().includes(filterText.toLowerCase())) {
      return null;
    }

    const isRenamingThis = renamingPath === node.path;

    if (node.isDirectory) {
      const isCollapsed = !!collapsedFolders[node.path];
      const hasChildren = node.children && node.children.length > 0;
      const isCreatingInside = creating && creating.targetFolder === node.path;

      return (
        <div key={node.path} style={{ marginLeft: depth * 12 }}>
          <div 
            className="file-item"
            onClick={() => toggleFolder(node.path)}
            onContextMenu={(e) => handleContextMenu(e, node)}
          >
            <span style={{ display: 'inline-flex', opacity: 0.6 }}>
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </span>
            <span className="file-icon">
              {isCollapsed ? <Folder size={15} /> : <FolderOpen size={15} color="var(--accent-hover)" />}
            </span>

            {isRenamingThis ? (
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => handleConfirmRename(node)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmRename(node);
                  if (e.key === 'Escape') setRenamingPath(null);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: 12,
                  padding: '1px 6px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: 3,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  width: '100%'
                }}
              />
            ) : (
              <span className="file-name" style={{ fontWeight: 500, flex: 1 }}>{node.name}</span>
            )}

            {/* Quick action buttons on folder hover */}
            <div className="file-hover-actions" onClick={(e) => e.stopPropagation()}>
              <span 
                className="hover-action-btn" 
                title="Tạo file trong thư mục này"
                onClick={() => handleStartCreate('file', node.path)}
              >
                <FilePlus size={12} />
              </span>
              <span 
                className="hover-action-btn" 
                title="Thao tác khác..."
                onClick={(e) => handleContextMenu(e, node)}
              >
                <MoreVertical size={12} />
              </span>
            </div>
          </div>

          {/* Inline creation input inside this folder */}
          {isCreatingInside && (
            <div style={{ marginLeft: 16, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              {creating.type === 'file' ? <FileText size={14} color="var(--accent-primary)" /> : <Folder size={14} color="var(--accent-primary)" />}
              <input
                ref={createInputRef}
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onBlur={handleConfirmCreate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmCreate();
                  if (e.key === 'Escape') setCreating(null);
                }}
                style={{
                  fontSize: 12,
                  padding: '2px 6px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: 3,
                  color: 'var(--text-primary)',
                  outline: 'none',
                  width: '100%'
                }}
              />
            </div>
          )}

          {!isCollapsed && hasChildren && (
            <div>
              {node.children!.map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    const isActive = activeFilePath === node.path;

    return (
      <div 
        key={node.path} 
        style={{ marginLeft: depth * 12 }}
        className={`file-item ${isActive ? 'active' : ''}`}
        onClick={() => onSelectFile(node)}
        onContextMenu={(e) => handleContextMenu(e, node)}
      >
        <span style={{ width: 14 }} />
        <span className="file-icon">
          <FileText size={15} />
        </span>

        {isRenamingThis ? (
          <input
            ref={renameInputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={() => handleConfirmRename(node)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmRename(node);
              if (e.key === 'Escape') setRenamingPath(null);
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              fontSize: 12,
              padding: '1px 6px',
              background: 'var(--bg-input)',
              border: '1px solid var(--accent-primary)',
              borderRadius: 3,
              color: 'var(--text-primary)',
              outline: 'none',
              width: '100%'
            }}
          />
        ) : (
          <span className="file-name" style={{ flex: 1 }}>{node.name}</span>
        )}

        <div className="file-hover-actions" onClick={(e) => e.stopPropagation()}>
          <span 
            className="hover-action-btn" 
            title="Thao tác..."
            onClick={(e) => handleContextMenu(e, node)}
          >
            <MoreVertical size={12} />
          </span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div className="sidebar-header">
        <span>Files Explorer</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {activeTab === 'files' && (
            <>
              <button 
                className="action-btn" 
                onClick={() => handleStartCreate('file', '')} 
                title="Tạo file Markdown mới (Ctrl+N)"
              >
                <FilePlus size={14} />
              </button>
              <button 
                className="action-btn" 
                onClick={() => handleStartCreate('folder', '')} 
                title="Tạo thư mục mới"
              >
                <FolderPlus size={14} />
              </button>
            </>
          )}
          {activeTab === 'recent' && recentFiles.length > 0 && onClearRecent && (
            <button 
              className="action-btn" 
              onClick={onClearRecent} 
              title="Xóa lịch sử mở tệp"
            >
              <Trash2 size={13} />
            </button>
          )}
          {onRefresh && (
            <button 
              className="action-btn" 
              onClick={onRefresh} 
              title="Làm mới cây thư mục"
            >
              <RotateCw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 3-Tab View Switcher */}
      <div className="sidebar-nav-tabs">
        <button
          className={`sidebar-nav-tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
          title="Tất cả tập tin trong Vault"
        >
          <Folder size={13} />
          <span>Tập tin</span>
        </button>
        <button
          className={`sidebar-nav-tab ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
          title="Tài liệu đã đánh dấu yêu thích"
        >
          <Star size={13} fill={favorites.length > 0 ? "var(--accent-primary)" : "none"} color="var(--accent-primary)" />
          <span>Yêu thích</span>
          {favorites.length > 0 && (
            <span className="sidebar-tab-badge">{favorites.length}</span>
          )}
        </button>
        <button
          className={`sidebar-nav-tab ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
          title="Tài liệu mở gần đây"
        >
          <Clock size={13} />
          <span>Gần đây</span>
          {recentFiles.length > 0 && (
            <span className="sidebar-tab-badge">{recentFiles.length}</span>
          )}
        </button>
      </div>

      {/* View 1: Files Tree Explorer */}
      {activeTab === 'files' && (
        <>
          <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={13} style={{ position: 'absolute', left: 8, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Lọc file..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px 8px 4px 26px',
                  fontSize: '12px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div className="sidebar-content">
            {/* Inline creation at root level */}
            {creating && creating.targetFolder === '' && (
              <div style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                {creating.type === 'file' ? <FileText size={14} color="var(--accent-primary)" /> : <Folder size={14} color="var(--accent-primary)" />}
                <input
                  ref={createInputRef}
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  onBlur={handleConfirmCreate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmCreate();
                    if (e.key === 'Escape') setCreating(null);
                  }}
                  style={{
                    fontSize: 12,
                    padding: '3px 6px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--accent-primary)',
                    borderRadius: 3,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    width: '100%'
                  }}
                />
              </div>
            )}

            {files.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                Chưa có tài liệu nào
              </div>
            ) : (
              files.map(file => renderNode(file))
            )}
          </div>
        </>
      )}

      {/* View 2: Favorites List */}
      {activeTab === 'favorites' && (
        <div className="sidebar-content">
          {favorites.length === 0 ? (
            <div className="sidebar-empty-state">
              <Star size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p style={{ fontWeight: 500, fontSize: 13, margin: '0 0 4px 0' }}>Chưa có tài liệu yêu thích</p>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Nhấp chuột phải vào file bất kỳ và chọn "Thêm vào Yêu thích" để ghim tại đây.
              </span>
            </div>
          ) : (
            favorites.map(favPath => {
              const fileName = favPath.split('/').pop() || favPath;
              const parentDir = favPath.includes('/') ? favPath.substring(0, favPath.lastIndexOf('/')) : '';
              const isActive = activeFilePath === favPath;

              return (
                <div
                  key={favPath}
                  className={`file-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectByPath(favPath, fileName)}
                  style={{ paddingRight: 8 }}
                >
                  <span className="file-icon">
                    <Star size={14} fill="var(--accent-primary)" color="var(--accent-primary)" />
                  </span>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <span className="file-name" style={{ fontSize: 12, fontWeight: 500 }}>{fileName}</span>
                    {parentDir && (
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {parentDir}
                      </span>
                    )}
                  </div>
                  <div className="file-hover-actions">
                    <span
                      className="hover-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite?.(favPath);
                      }}
                      title="Bỏ khỏi yêu thích"
                    >
                      <Trash2 size={12} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* View 3: Recent Files */}
      {activeTab === 'recent' && (
        <div className="sidebar-content">
          {recentFiles.length === 0 ? (
            <div className="sidebar-empty-state">
              <Clock size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p style={{ fontWeight: 500, fontSize: 13, margin: '0 0 4px 0' }}>Chưa có lịch sử mở file</p>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Các tài liệu bạn đọc gần đây sẽ tự động hiển thị tại đây.
              </span>
            </div>
          ) : (
            recentFiles.map(item => {
              const isActive = activeFilePath === item.path;

              return (
                <div
                  key={item.path}
                  className={`file-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectByPath(item.path, item.name)}
                  style={{ paddingRight: 8 }}
                >
                  <span className="file-icon">
                    <Clock size={14} color="var(--accent-primary)" />
                  </span>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <span className="file-name" style={{ fontSize: 12, fontWeight: 500 }}>{item.name}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Floating Context Menu */}
      {contextMenu.visible && contextMenu.node && (
        <div 
          className="tree-context-menu"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.node.isDirectory ? (
            <>
              <div 
                className="context-menu-item" 
                onClick={() => {
                  handleStartCreate('file', contextMenu.node!.path);
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
              >
                <FilePlus size={13} />
                <span>Tạo file mới tại đây</span>
              </div>
              <div 
                className="context-menu-item" 
                onClick={() => {
                  handleStartCreate('folder', contextMenu.node!.path);
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
              >
                <FolderPlus size={13} />
                <span>Tạo thư mục con</span>
              </div>
            </>
          ) : (
            <>
              <div 
                className="context-menu-item" 
                onClick={() => {
                  onSelectFile(contextMenu.node!);
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
              >
                <FileText size={13} />
                <span>Mở tài liệu</span>
              </div>
              {onToggleFavorite && (
                <div 
                  className="context-menu-item" 
                  onClick={() => {
                    onToggleFavorite(contextMenu.node!.path);
                    setContextMenu(prev => ({ ...prev, visible: false }));
                  }}
                >
                  <Star 
                    size={13} 
                    fill={favorites.includes(contextMenu.node.path) ? "var(--accent-primary)" : "none"} 
                    color="var(--accent-primary)" 
                  />
                  <span>{favorites.includes(contextMenu.node.path) ? 'Bỏ khỏi Yêu thích' : 'Thêm vào Yêu thích'}</span>
                </div>
              )}
            </>
          )}

          <div className="context-menu-divider" />

          <div 
            className="context-menu-item" 
            onClick={() => {
              handleStartRename(contextMenu.node!);
              setContextMenu(prev => ({ ...prev, visible: false }));
            }}
          >
            <Edit2 size={13} />
            <span>Đổi tên (Rename)</span>
          </div>

          {onShowInFolder && (
            <div 
              className="context-menu-item" 
              onClick={() => {
                onShowInFolder(contextMenu.node!.path);
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
            >
              <ExternalLink size={13} />
              <span>Hiển thị trong Explorer</span>
            </div>
          )}

          <div className="context-menu-divider" />

          <div 
            className="context-menu-item danger" 
            onClick={() => {
              handleDelete(contextMenu.node!);
              setContextMenu(prev => ({ ...prev, visible: false }));
            }}
          >
            <Trash2 size={13} />
            <span>Xóa (Delete)</span>
          </div>
        </div>
      )}
    </div>
  );
};

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
  ExternalLink
} from 'lucide-react';
import type { FileNode } from '../../types';

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
  onRefresh
}) => {
  const [filterText, setFilterText] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  
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

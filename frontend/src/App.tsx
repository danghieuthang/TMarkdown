import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Sun,
  Moon,
  FolderOpen,
  FilePlus,
  PanelLeft,
  ListTree,
  Search,
  RotateCw,
  XSquare,
  Terminal,
  BookOpen,
  Edit3,
  Minimize2,
  Maximize2,
  FoldHorizontal,
  UnfoldHorizontal,
  Maximize,
  Sparkles
} from 'lucide-react';
import { TopBar } from './components/Header/TopBar';
import { FileTree } from './components/Sidebar/FileTree';
import { TabBar } from './components/Tabs/TabBar';
import { MarkdownViewer } from './components/Viewer/MarkdownViewer';
import { MarkdownEditor } from './components/Viewer/MarkdownEditor';
import { OutlineSidebar } from './components/Outline/OutlineSidebar';
import { SearchModal, type CommandItem } from './components/Search/SearchModal';
import { StatusBar } from './components/StatusBar';
import { UpdateModal } from './components/Update/UpdateModal';
import { ToastContainer } from './components/ui/Toast';
import { useAutoUpdate } from './hooks/useAutoUpdate';
import type { FileNode, TabItem, ViewMode, RecentItem, ContentWidthMode } from './types';
import { SAMPLE_VAULT_FILES } from './data/sampleVault';
import { vaultService } from './utils/fileSystem';
import { parseAndRenderMarkdown } from './utils/markdownParser';
import logoDark from './assets/logo.png';
import logoWhite from './assets/logo-white.png';

export function App() {
  // Auto-update system
  const {
    updateInfo,
    isDownloading,
    downloadProgress,
    isReadyToRestart,
    isModalOpen: isUpdateModalOpen,
    setIsModalOpen: setIsUpdateModalOpen,
    errorMessage: updateErrorMessage,
    toasts,
    dismissToast,
    checkForUpdates,
    startDownload,
    applyAndRestart
  } = useAutoUpdate();

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('tmarkdown_theme') as 'dark' | 'light') || 'dark';
  });

  // Vault state
  const [vaultName, setVaultName] = useState<string>('Sample Vault (TMarkdown)');
  const [files, setFiles] = useState<FileNode[]>(SAMPLE_VAULT_FILES);

  // Tabs state
  const [tabs, setTabs] = useState<TabItem[]>([
    { id: '/01_Kien_Truc_He_Thong.md', name: '01_Kien_Truc_He_Thong.md', path: '/01_Kien_Truc_He_Thong.md' },
    { id: '/02_Ghi_Chu_Ky_Thuat.md', name: '02_Ghi_Chu_Ky_Thuat.md', path: '/02_Ghi_Chu_Ky_Thuat.md' }
  ]);
  const [activeTabId, setActiveTabId] = useState<string | null>('/01_Kien_Truc_He_Thong.md');

  // File content & editor state
  const [currentContent, setCurrentContent] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('reading');
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [targetHeadingId, setTargetHeadingId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Search match navigation state (Jump to line)
  const [targetLineNumber, setTargetLineNumber] = useState<number | null>(null);
  const [targetSnippet, setTargetSnippet] = useState<string | null>(null);

  // Track cursor position & nearest heading from editor for seamless 2-way sync
  const [editorCursorInfo, setEditorCursorInfo] = useState<{
    line: number;
    headingId: string | null;
  } | null>(null);

  // Layout UI state
  const [showLeftSidebar, setShowLeftSidebar] = useState<boolean>(true);
  const [showRightSidebar, setShowRightSidebar] = useState<boolean>(true);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchModalMode, setSearchModalMode] = useState<'files' | 'content' | 'commands'>('files');
  const [searchInitialQuery, setSearchInitialQuery] = useState<string>('');
  const [isInPageSearchOpen, setIsInPageSearchOpen] = useState<boolean>(false);
  const [inPageSearchTrigger, setInPageSearchTrigger] = useState<number>(0);
  const [inPageInitialQuery, setInPageInitialQuery] = useState<string>('');

  const triggerInPageSearch = (prefill?: string) => {
    setIsInPageSearchOpen(true);
    setInPageSearchTrigger(prev => prev + 1);
    if (prefill !== undefined) {
      setInPageInitialQuery(prefill);
    }
  };

  // Advanced features state (Favorites, Recent files, Zen mode)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tmarkdown_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentFiles, setRecentFiles] = useState<RecentItem[]>(() => {
    try {
      const saved = localStorage.getItem('tmarkdown_recent_files');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isZenMode, setIsZenMode] = useState<boolean>(false);

  const openSearchModal = useCallback((mode: 'files' | 'content' | 'commands' = 'files', initialQuery = '') => {
    setSearchModalMode(mode);
    setSearchInitialQuery(initialQuery);
    setIsSearchOpen(true);
  }, []);

  // Resizable sidebar widths & font size
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    return Number(localStorage.getItem('tmarkdown_left_width')) || 250;
  });
  const [rightWidth, setRightWidth] = useState<number>(() => {
    return Number(localStorage.getItem('tmarkdown_right_width')) || 270;
  });
  const [readerFontSize, setReaderFontSize] = useState<number>(() => {
    return Number(localStorage.getItem('tmarkdown_font_size')) || 15;
  });
  const [contentWidth, setContentWidth] = useState<ContentWidthMode>(() => {
    return (localStorage.getItem('tmarkdown_content_width') as ContentWidthMode) || 'wide';
  });

  const handleChangeContentWidth = useCallback((newWidth: ContentWidthMode) => {
    setContentWidth(newWidth);
    localStorage.setItem('tmarkdown_content_width', newWidth);
  }, []);

  // Load previous session on startup (Feature B1: Full Session Persistence)
  useEffect(() => {
    vaultService.loadSession().then(async sessionStr => {
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);

          // Restore vault directory if recorded
          if (session.vaultRootPath) {
            const vaultResult = await vaultService.openVaultPath(session.vaultRootPath);
            if (vaultResult) {
              setVaultName(vaultResult.name);
              setFiles(vaultResult.files);
            }
          } else if (session.vaultName) {
            setVaultName(session.vaultName);
          }

          if (session.tabs && session.tabs.length > 0) {
            setTabs(session.tabs);
          }
          if (session.activeTabId) {
            setActiveTabId(session.activeTabId);
          }
          if (session.favorites && Array.isArray(session.favorites)) {
            setFavorites(session.favorites);
          }
          if (session.recentFiles && Array.isArray(session.recentFiles)) {
            setRecentFiles(session.recentFiles);
          }
        } catch (e) {
          console.warn('Failed to parse previous session:', e);
        }
      }
    });
  }, []);

  // Listen to file system changes via fsnotify watcher (Feature B4)
  useEffect(() => {
    const unsubscribe = vaultService.onVaultFileChanged(async (event) => {
      vaultService.invalidateCache(event.path);

      const updatedFiles = await vaultService.refreshDirectoryTree();
      if (updatedFiles && updatedFiles.length > 0) {
        setFiles(updatedFiles);
      }

      // If active tab was modified externally and isn't dirty, reload it
      if (activeTabId) {
        const cleanActive = activeTabId.replace(/^(\.\/|\/)/, '');
        const cleanEvent = event.path.replace(/^(\.\/|\/)/, '');
        if (cleanActive === cleanEvent || cleanActive.endsWith('/' + cleanEvent)) {
          const activeTab = tabs.find(t => t.id === activeTabId);
          if (activeTab && !activeTab.isDirty) {
            const newContent = await vaultService.readFile(activeTab.path);
            setCurrentContent(newContent);
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeTabId, tabs]);

  // Save session state on tab, vault, favorites, or recentFiles change
  useEffect(() => {
    const sessionObj = {
      vaultRootPath: vaultService.getVaultRoot(),
      vaultName,
      tabs,
      activeTabId,
      favorites,
      recentFiles,
      timestamp: Date.now()
    };
    vaultService.saveSession(JSON.stringify(sessionObj));
    localStorage.setItem('tmarkdown_favorites', JSON.stringify(favorites));
    localStorage.setItem('tmarkdown_recent_files', JSON.stringify(recentFiles));
  }, [vaultName, tabs, activeTabId, favorites, recentFiles]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tmarkdown_theme', theme);
  }, [theme]);

  // Load content whenever active tab changes
  useEffect(() => {
    if (!activeTabId) {
      setCurrentContent('');
      return;
    }

    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab) {
      vaultService.readFile(activeTab.path).then(content => {
        setCurrentContent(content);
      });
    }
  }, [activeTabId, tabs]);

  // Single-pass parse: extracts headings and renders HTML together (Feature A1)
  const { html: renderedHtml, headings } = useMemo(() => {
    return parseAndRenderMarkdown(currentContent);
  }, [currentContent]);

  // Select or open file (with optional jump to line from search - Feature C1)
  const handleSelectFile = useCallback((file: FileNode, lineNumber?: number, snippet?: string) => {
    if (file.isDirectory) return;

    if (lineNumber !== undefined) {
      setTargetLineNumber(lineNumber);
      setTargetSnippet(snippet || null);
    } else {
      setTargetLineNumber(null);
      setTargetSnippet(null);
    }
    setTargetHeadingId(null);
    setEditorCursorInfo(null);

    // Update recent files list
    setRecentFiles(prev => {
      const filtered = prev.filter(item => item.path !== file.path);
      const newRecent: RecentItem = {
        path: file.path,
        name: file.name,
        timestamp: Date.now()
      };
      return [newRecent, ...filtered].slice(0, 30);
    });

    // Check if already open
    const existingIndex = tabs.findIndex(t => t.path === file.path);
    if (existingIndex !== -1) {
      setActiveTabId(tabs[existingIndex].id);
    } else {
      const newTab: TabItem = {
        id: file.path,
        name: file.name,
        path: file.path
      };
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
    }
  }, [tabs]);

  // Feature 1: Toggle Favorites
  const handleToggleFavorite = useCallback((path: string) => {
    setFavorites(prev => {
      if (prev.includes(path)) {
        return prev.filter(p => p !== path);
      } else {
        return [...prev, path];
      }
    });
  }, []);

  // Feature 1: Clear Recent Files History
  const handleClearRecent = useCallback(() => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử tệp mở gần đây?')) {
      setRecentFiles([]);
      localStorage.removeItem('tmarkdown_recent_files');
    }
  }, []);

  // Feature 2: Highlight Text toggle (==text==) and save directly to active file
  const handleHighlightText = useCallback(async (selectedText: string) => {
    if (!activeTabId || !currentContent) return;
    const clean = selectedText.trim();
    if (!clean) return;

    let newContent: string;
    if (currentContent.includes(`==${clean}==`)) {
      newContent = currentContent.replace(`==${clean}==`, clean);
    } else if (currentContent.includes(clean)) {
      newContent = currentContent.replace(clean, `==${clean}==`);
    } else {
      return;
    }

    setCurrentContent(newContent);
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab) {
      await vaultService.writeFile(tab.path, newContent);
    }
  }, [activeTabId, currentContent, tabs]);

  // Feature 2: Global Search pre-populated from Selection Tooltip
  const handleSearchInVault = useCallback((query: string) => {
    openSearchModal('content', query);
  }, [openSearchModal]);

  // Close tab
  const handleCloseTab = useCallback((tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTabs(prev => {
      const nextTabs = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId) {
        if (nextTabs.length > 0) {
          setActiveTabId(nextTabs[nextTabs.length - 1].id);
        } else {
          setActiveTabId(null);
        }
      }
      return nextTabs;
    });
  }, [activeTabId]);

  // Select tab with auto-save for unsaved changes
  const handleSelectTab = useCallback((tabId: string) => {
    if (activeTabId && activeTabId !== tabId) {
      const currentTab = tabs.find(t => t.id === activeTabId);
      if (currentTab?.isDirty) {
        vaultService.writeFile(currentTab.path, currentContent);
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isDirty: false } : t));
      }
    }
    setTargetHeadingId(null);
    setTargetLineNumber(null);
    setTargetSnippet(null);
    setEditorCursorInfo(null);
    setActiveTabId(tabId);
  }, [activeTabId, tabs, currentContent]);

  // Open directory
  const handleOpenFolder = async () => {
    const result = await vaultService.openDirectory();
    if (result) {
      setVaultName(result.name);
      setFiles(result.files);

      // Open first file if any
      const findFirstFile = (nodes: FileNode[]): FileNode | null => {
        for (const n of nodes) {
          if (!n.isDirectory) return n;
          if (n.children) {
            const found = findFirstFile(n.children);
            if (found) return found;
          }
        }
        return null;
      };

      const first = findFirstFile(result.files);
      if (first) {
        setTabs([{ id: first.path, name: first.name, path: first.path }]);
        setActiveTabId(first.path);
      } else {
        setTabs([]);
        setActiveTabId(null);
      }
    }
  };

  const scrollSpyLockedUntilRef = useRef<number>(0);

  // Jump to heading on click with temporary scroll-spy lock and visual pulse (Instant Jump)
  const handleSelectHeading = useCallback((headingId: string) => {
    scrollSpyLockedUntilRef.current = Date.now() + 200;
    setActiveHeadingId(headingId);
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({ behavior: 'auto', block: 'start' });
      element.classList.remove('heading-target-pulse');
      void element.offsetWidth; // trigger reflow for animation restart
      element.classList.add('heading-target-pulse');
      setTimeout(() => {
        element.classList.remove('heading-target-pulse');
      }, 1300);
    }
  }, []);

  // Update active heading from scroll-spy, ignoring intermediate changes during programmatic navigation
  const handleActiveHeadingChange = useCallback((headingId: string) => {
    if (Date.now() < scrollSpyLockedUntilRef.current) return;
    setActiveHeadingId(headingId);
  }, []);

  // Handle mode transitions with bidirectional section/position synchronization
  const handleChangeViewMode = useCallback((newMode: ViewMode) => {
    if (newMode === viewMode) return;
    if (newMode === 'reading') {
      // Switching from Edit -> Reading: Sync to section or line where cursor was
      if (editorCursorInfo) {
        if (editorCursorInfo.headingId) {
          setTargetHeadingId(editorCursorInfo.headingId);
          setActiveHeadingId(editorCursorInfo.headingId);
          setTargetLineNumber(null);
        } else if (typeof editorCursorInfo.line === 'number') {
          setTargetHeadingId(null);
          setTargetLineNumber(editorCursorInfo.line + 1); // 1-indexed line jump
        }
      }
    } else {
      // Switching from Reading -> Edit:
      // activeHeadingId and scrollProgress are passed directly to MarkdownEditor
      setTargetHeadingId(null);
      setTargetLineNumber(null);
    }
    setViewMode(newMode);
  }, [viewMode, editorCursorInfo]);

  const handleToggleViewMode = useCallback(() => {
    handleChangeViewMode(viewMode === 'reading' ? 'edit' : 'reading');
  }, [viewMode, handleChangeViewMode]);

  // Handle internal markdown links and wiki-links clicked inside documents
  const handleNavigateInternalLink = useCallback((targetHref: string, anchor?: string) => {
    if (!targetHref && anchor) {
      handleSelectHeading(anchor);
      return;
    }

    const clean = targetHref.trim().replace(/^(\.\/|\/)/, '');
    const cleanNoExt = clean.replace(/\.(md|markdown|txt)$/i, '');
    const targetName = clean.split('/').pop() || clean;
    const targetNameNoExt = targetName.replace(/\.(md|markdown|txt)$/i, '');

    // Search file recursively in Vault file tree
    const findNode = (nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
        if (!node.isDirectory) {
          const nodePathClean = node.path.replace(/^(\.\/|\/)/, '');
          const nodeNameNoExt = node.name.replace(/\.(md|markdown|txt)$/i, '');

          if (
            nodePathClean === clean ||
            nodePathClean.endsWith('/' + clean) ||
            node.name.toLowerCase() === targetName.toLowerCase() ||
            nodeNameNoExt.toLowerCase() === targetNameNoExt.toLowerCase() ||
            nodePathClean.toLowerCase() === (cleanNoExt + '.md').toLowerCase()
          ) {
            return node;
          }
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
      handleSelectFile(targetNode);
      if (anchor) {
        setTimeout(() => {
          handleSelectHeading(anchor);
        }, 120);
      }
    } else {
      console.warn(`File not found in vault: ${targetHref}`);
      alert(`Không tìm thấy file "${targetHref}" trong Vault hiện tại.`);
    }
  }, [files, handleSelectFile, handleSelectHeading]);

  // Save content
  const handleSaveContent = async () => {
    if (!activeTabId) return;
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;

    await vaultService.writeFile(tab.path, currentContent);
    // Remove dirty indicator
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isDirty: false } : t));
  };

  // Handle content edit
  const handleContentChange = (newContent: string) => {
    setCurrentContent(newContent);
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isDirty: true } : t));
  };

  // Feature B2: CRUD File operations
  const handleNewFile = useCallback(async (_targetFolder?: string, relPath?: string): Promise<boolean> => {
    const finalRel = relPath || `Ghi_chu_${Date.now().toString().slice(-4)}.md`;
    const res = await vaultService.createNewFile(finalRel);
    if (res.success) {
      const updatedFiles = await vaultService.refreshDirectoryTree();
      setFiles(updatedFiles);
      const fileName = finalRel.split('/').pop() || finalRel;
      handleSelectFile({
        id: finalRel,
        name: fileName,
        path: finalRel,
        isDirectory: false
      });
      return true;
    } else {
      alert(res.error || 'Không thể tạo file');
      return false;
    }
  }, [handleSelectFile]);

  const handleNewFolder = useCallback(async (_targetFolder?: string, relPath?: string): Promise<boolean> => {
    const finalRel = relPath || `Thu_muc_${Date.now().toString().slice(-4)}`;
    const res = await vaultService.createNewDirectory(finalRel);
    if (res.success) {
      const updatedFiles = await vaultService.refreshDirectoryTree();
      setFiles(updatedFiles);
      return true;
    } else {
      alert(res.error || 'Không thể tạo thư mục');
      return false;
    }
  }, []);

  const handleRenamePath = useCallback(async (oldPath: string, newPath: string): Promise<boolean> => {
    const res = await vaultService.renamePath(oldPath, newPath);
    if (res.success) {
      const updatedFiles = await vaultService.refreshDirectoryTree();
      setFiles(updatedFiles);
      // Update open tabs
      setTabs(prev => prev.map(t => {
        if (t.path === oldPath) {
          const newName = newPath.split('/').pop() || newPath;
          return { ...t, id: newPath, path: newPath, name: newName };
        }
        if (t.path.startsWith(oldPath + '/')) {
          const replaced = t.path.replace(oldPath, newPath);
          const newName = replaced.split('/').pop() || replaced;
          return { ...t, id: replaced, path: replaced, name: newName };
        }
        return t;
      }));
      if (activeTabId === oldPath) {
        setActiveTabId(newPath);
      }
      return true;
    } else {
      alert(res.error || 'Không thể đổi tên');
      return false;
    }
  }, [activeTabId]);

  const handleDeletePath = useCallback(async (path: string, _isDirectory: boolean): Promise<boolean> => {
    const res = await vaultService.deletePath(path);
    if (res.success) {
      const updatedFiles = await vaultService.refreshDirectoryTree();
      setFiles(updatedFiles);
      // Close tabs if open
      setTabs(prev => {
        const remaining = prev.filter(t => t.path !== path && !t.path.startsWith(path + '/'));
        if (activeTabId && (activeTabId === path || activeTabId.startsWith(path + '/'))) {
          setActiveTabId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
        }
        return remaining;
      });
      return true;
    } else {
      alert(res.error || 'Không thể xóa');
      return false;
    }
  }, [activeTabId]);

  const handleShowInFolder = useCallback((path: string) => {
    vaultService.showInFolder(path);
  }, []);

  const handleRefreshDirectory = useCallback(async () => {
    const updatedFiles = await vaultService.refreshDirectoryTree();
    setFiles(updatedFiles);
  }, []);

  // Handle dragging left splitter
  const handleLeftResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(160, Math.min(550, startWidth + (moveEvent.clientX - startX)));
      setLeftWidth(newWidth);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      localStorage.setItem('tmarkdown_left_width', leftWidth.toString());
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Handle dragging right splitter
  const handleRightResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(180, Math.min(550, startWidth - (moveEvent.clientX - startX)));
      setRightWidth(newWidth);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      localStorage.setItem('tmarkdown_right_width', rightWidth.toString());
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // App Commands definition for Command Palette (Feature C3)
  const appCommands: CommandItem[] = useMemo(() => [
    {
      id: 'toggle-theme',
      title: theme === 'dark' ? 'Chuyển sang giao diện Sáng (Light Theme)' : 'Chuyển sang giao diện Tối (Dark Theme)',
      subtitle: 'Đổi chủ đề màu sắc của ứng dụng',
      shortcut: 'Ctrl+T',
      icon: theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />,
      execute: () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    },
    {
      id: 'new-note',
      title: 'Tạo ghi chú mới (New Note)',
      subtitle: 'Tạo tệp Markdown mới trong Vault',
      shortcut: 'Ctrl+N',
      icon: <FilePlus size={15} />,
      execute: () => handleNewFile()
    },
    {
      id: 'open-vault',
      title: 'Mở thư mục Vault khác (Open Folder)',
      subtitle: 'Chọn thư mục tài liệu trên ổ đĩa',
      shortcut: 'Ctrl+O',
      icon: <FolderOpen size={15} />,
      execute: () => handleOpenFolder()
    },
    {
      id: 'find-in-doc',
      title: 'Tìm kiếm trong tài liệu hiện tại (Find in Page)',
      subtitle: 'Mở thanh tìm kiếm từ khóa trong trang',
      shortcut: 'Ctrl+F',
      icon: <Search size={15} />,
      execute: () => {
        const selection = window.getSelection()?.toString().trim();
        triggerInPageSearch(selection || undefined);
      }
    },
    {
      id: 'toggle-view-mode',
      title: viewMode === 'reading' ? 'Chuyển sang chế độ Biên tập (Edit Mode)' : 'Chuyển sang chế độ Đọc (Reading Mode)',
      subtitle: 'Chuyển đổi giữa xem trước Markdown và soạn thảo trực tiếp',
      shortcut: 'Ctrl+E',
      icon: viewMode === 'reading' ? <Edit3 size={15} /> : <BookOpen size={15} />,
      execute: handleToggleViewMode
    },
    {
      id: 'toggle-sidebar-left',
      title: showLeftSidebar ? 'Ẩn thanh cây thư mục (Hide File Explorer)' : 'Hiện thanh cây thư mục (Show File Explorer)',
      subtitle: 'Bật/tắt thanh bên trái',
      shortcut: 'Ctrl+B',
      icon: <PanelLeft size={15} />,
      execute: () => setShowLeftSidebar(prev => !prev)
    },
    {
      id: 'toggle-sidebar-right',
      title: showRightSidebar ? 'Ẩn mục lục (Hide Outline)' : 'Hiện mục lục (Show Outline)',
      subtitle: 'Bật/tắt thanh mục lục bên phải',
      icon: <ListTree size={15} />,
      execute: () => setShowRightSidebar(prev => !prev)
    },
    {
      id: 'refresh-vault',
      title: 'Tải lại danh sách tệp tin (Refresh File Tree)',
      subtitle: 'Quét lại toàn bộ các thư mục trong Vault',
      icon: <RotateCw size={15} />,
      execute: () => handleRefreshDirectory()
    },
    {
      id: 'close-active-tab',
      title: 'Đóng thẻ tài liệu hiện tại (Close Tab)',
      subtitle: activeTabId ? `Đóng ${activeTabId}` : 'Không có thẻ nào đang mở',
      shortcut: 'Ctrl+W',
      icon: <XSquare size={15} />,
      execute: () => {
        if (activeTabId) {
          handleCloseTab(activeTabId, { stopPropagation: () => {} } as any);
        }
      }
    },
    {
      id: 'close-all-tabs',
      title: 'Đóng tất cả các thẻ (Close All Tabs)',
      subtitle: `Đang mở ${tabs.length} thẻ`,
      icon: <XSquare size={15} />,
      execute: () => {
        setTabs([]);
        setActiveTabId(null);
      }
    },
    {
      id: 'reveal-in-explorer',
      title: 'Hiển thị ghi chú trong Windows File Explorer',
      subtitle: 'Mở thư mục chứa tệp này trên máy tính',
      icon: <FolderOpen size={15} />,
      execute: () => {
        if (activeTabId) {
          handleShowInFolder(activeTabId);
        }
      }
    },
    {
      id: 'toggle-zen-mode',
      title: isZenMode ? 'Thoát chế độ tập trung (Exit Zen Mode)' : 'Bật chế độ tập trung (Zen Mode)',
      subtitle: 'Ẩn toàn bộ thanh công cụ để tập trung đọc tài liệu',
      shortcut: 'F10',
      icon: isZenMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />,
      execute: () => setIsZenMode(prev => !prev)
    },
    {
      id: 'width-standard',
      title: 'Độ rộng hiển thị: Chuẩn (Standard 840px)',
      subtitle: 'Độ rộng tối ưu cho đọc bài viết và văn bản',
      icon: <FoldHorizontal size={15} />,
      execute: () => handleChangeContentWidth('standard')
    },
    {
      id: 'width-wide',
      title: 'Độ rộng hiển thị: Rộng (Wide 1200px)',
      subtitle: 'Độ rộng mở rộng, phù hợp tài liệu kỹ thuật có bảng và code',
      icon: <UnfoldHorizontal size={15} />,
      execute: () => handleChangeContentWidth('wide')
    },
    {
      id: 'width-full',
      title: 'Độ rộng hiển thị: Toàn màn hình (Full 100%)',
      subtitle: 'Bung tối đa toàn bộ diện tích màn hình cho các bảng biểu lớn',
      icon: <Maximize size={15} />,
      execute: () => handleChangeContentWidth('full')
    },
    {
      id: 'reset-zoom',
      title: 'Đặt lại cỡ chữ mặc định (Reset Font Size 15px)',
      subtitle: `Cỡ chữ hiện tại: ${readerFontSize}px`,
      shortcut: 'Ctrl+0',
      icon: <Terminal size={15} />,
      execute: () => {
        setReaderFontSize(15);
        localStorage.setItem('tmarkdown_font_size', '15');
      }
    },
    {
      id: 'check-updates',
      title: 'Kiểm tra bản cập nhật mới (Check for Updates)',
      subtitle: updateInfo?.hasUpdate
        ? `Đã có bản phát hành mới v${updateInfo.latestVersion} sẵn sàng tải!`
        : 'Kiểm tra phiên bản mới nhất từ GitHub Releases',
      icon: <Sparkles size={15} />,
      execute: () => {
        if (updateInfo?.hasUpdate) {
          setIsUpdateModalOpen(true);
        } else {
          checkForUpdates(true);
        }
      }
    }
  ], [
    theme,
    viewMode,
    showLeftSidebar,
    showRightSidebar,
    activeTabId,
    tabs,
    readerFontSize,
    isZenMode,
    updateInfo,
    checkForUpdates,
    handleToggleViewMode,
    setIsUpdateModalOpen,
    handleNewFile,
    handleOpenFolder,
    handleRefreshDirectory,
    handleCloseTab,
    handleShowInFolder,
    handleChangeContentWidth
  ]);

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // F10 or Ctrl+Shift+F: Toggle Zen Mode
      if (e.key === 'F10' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f'))) {
        e.preventDefault();
        setIsZenMode(prev => !prev);
        return;
      }
      // Esc: Exit Zen Mode if active
      if (e.key === 'Escape' && isZenMode) {
        e.preventDefault();
        setIsZenMode(false);
        return;
      }
      // Ctrl+Shift+P or F1: Command Palette
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) || e.key === 'F1') {
        e.preventDefault();
        openSearchModal('commands');
        return;
      }
      // Ctrl+N: New note
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewFile();
        return;
      }
      // Ctrl+P: Quick file switcher
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        openSearchModal('files');
        return;
      }
      // Ctrl+O: Open folder dialog
      if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        handleOpenFolder();
        return;
      }
      // Ctrl+T: Toggle dark/light theme
      if ((e.ctrlKey || e.metaKey) && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
        return;
      }
      // Ctrl+F: In-page search
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        const selection = window.getSelection()?.toString().trim();
        triggerInPageSearch(selection || undefined);
        return;
      }
      // Ctrl+B: Toggle left sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setShowLeftSidebar(prev => !prev);
        return;
      }
      // Ctrl+W: Close active tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w' && activeTabId) {
        e.preventDefault();
        handleCloseTab(activeTabId, { stopPropagation: () => {} } as any);
        return;
      }
      // Ctrl+E: Toggle View/Edit mode
      if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        handleToggleViewMode();
        return;
      }
      // Ctrl+0: Reset font scale
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setReaderFontSize(15);
        localStorage.setItem('tmarkdown_font_size', '15');
        return;
      }
      // Ctrl + Plus / Minus: Font scale
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setReaderFontSize(prev => Math.min(24, prev + 1));
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        setReaderFontSize(prev => Math.max(12, prev - 1));
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeTabId, isZenMode, handleCloseTab, handleNewFile, handleOpenFolder, openSearchModal, handleToggleViewMode]);

  return (
    <div className={`app-container ${isZenMode ? 'zen-mode-active' : ''}`}>
      {/* Floating Zen Mode Exit Button */}
      {isZenMode && (
        <button
          className="zen-exit-btn"
          onClick={() => setIsZenMode(false)}
          title="Thoát chế độ tập trung (Esc / F10)"
        >
          <Minimize2 size={14} />
          <span>Thoát Zen Mode</span>
        </button>
      )}

      {/* Top Navigation */}
      {!isZenMode && (
        <TopBar
          vaultName={vaultName}
          theme={theme}
          onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          viewMode={viewMode}
          onChangeViewMode={handleChangeViewMode}
          contentWidth={contentWidth}
          onChangeContentWidth={handleChangeContentWidth}
          onOpenFolder={handleOpenFolder}
          onOpenSearch={() => openSearchModal('files')}
          showLeftSidebar={showLeftSidebar}
          onToggleLeftSidebar={() => setShowLeftSidebar(prev => !prev)}
          showRightSidebar={showRightSidebar}
          onToggleRightSidebar={() => setShowRightSidebar(prev => !prev)}
          isZenMode={isZenMode}
          onToggleZenMode={() => setIsZenMode(prev => !prev)}
          hasUpdate={Boolean(updateInfo?.hasUpdate)}
          onOpenUpdate={() => setIsUpdateModalOpen(true)}
        />
      )}

      {/* Main 3-Column Workspace */}
      <div className="workspace-body">
        {/* Left Sidebar: File Tree */}
        {!isZenMode && showLeftSidebar && (
          <aside className="sidebar sidebar-left" style={{ width: `${leftWidth}px` }}>
            <FileTree
              files={files}
              activeFilePath={activeTabId}
              onSelectFile={handleSelectFile}
              onNewFile={handleNewFile}
              onNewFolder={handleNewFolder}
              onRenamePath={handleRenamePath}
              onDeletePath={handleDeletePath}
              onShowInFolder={handleShowInFolder}
              onRefresh={handleRefreshDirectory}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              recentFiles={recentFiles}
              onClearRecent={handleClearRecent}
            />
          </aside>
        )}

        {/* Left Resizable Splitter */}
        {!isZenMode && showLeftSidebar && (
          <div
            className="resize-splitter left-splitter"
            onMouseDown={handleLeftResizeStart}
            title="Kéo sang trái/phải để chỉnh độ rộng Explorer"
          />
        )}

        {/* Center Main Viewport */}
        <main className={`main-viewport ${isZenMode ? 'zen-viewport' : ''}`}>
          {!isZenMode && (
            <TabBar
              tabs={tabs}
              activeTabId={activeTabId}
              onSelectTab={handleSelectTab}
              onCloseTab={handleCloseTab}
            />
          )}

          {activeTabId ? (
            viewMode === 'reading' ? (
              <MarkdownViewer
                content={currentContent}
                filePath={activeTabId}
                headings={headings}
                renderedHtml={renderedHtml}
                targetHeadingId={targetHeadingId}
                targetLineNumber={targetLineNumber}
                targetSnippet={targetSnippet}
                fontSize={readerFontSize}
                contentWidth={contentWidth}
                isSearchOpen={isInPageSearchOpen}
                searchTrigger={inPageSearchTrigger}
                initialSearchQuery={inPageInitialQuery}
                onCloseSearch={() => {
                  setIsInPageSearchOpen(false);
                  setInPageInitialQuery('');
                }}
                onActiveHeadingChange={handleActiveHeadingChange}
                onScrollProgressChange={setScrollProgress}
                onNavigateFile={handleNavigateInternalLink}
                onHighlightText={handleHighlightText}
                onSearchInVault={handleSearchInVault}
              />
            ) : (
              <MarkdownEditor
                content={currentContent}
                onChange={handleContentChange}
                onSave={handleSaveContent}
                targetHeadingId={activeHeadingId}
                headings={headings}
                scrollRatio={scrollProgress / 100}
                onCursorChange={(cursorLine, nearestHeadingId) => {
                  setEditorCursorInfo({ line: cursorLine, headingId: nearestHeadingId });
                }}
              />
            )
          ) : (
            <div className="welcome-hero-container">
              <div className="welcome-hero-card">
                <div className="welcome-logo-wrap">
                  <div className="welcome-logo-glow" />
                  <img
                    src={theme === 'dark' ? logoWhite : logoDark}
                    alt="TMarkdown"
                    className="welcome-logo-img"
                  />
                </div>
                <h1 className="welcome-title">
                  TMarkdown
                  <span className="welcome-version-badge">v1.1.1</span>
                </h1>
                <p className="welcome-subtitle">
                  Obsidian-Lite Markdown Reader & Workspace
                </p>

                <div className="welcome-actions-grid">
                  <button
                    className="welcome-action-card"
                    onClick={() => openSearchModal('files')}
                  >
                    <div className="welcome-action-icon">
                      <Search size={18} />
                    </div>
                    <div className="welcome-action-text">
                      <span className="welcome-action-title">Tìm tài liệu</span>
                      <span className="welcome-action-desc">Mở nhanh file trong Vault</span>
                    </div>
                    <kbd className="welcome-kbd">Ctrl P</kbd>
                  </button>

                  <button
                    className="welcome-action-card"
                    onClick={handleOpenFolder}
                  >
                    <div className="welcome-action-icon">
                      <FolderOpen size={18} />
                    </div>
                    <div className="welcome-action-text">
                      <span className="welcome-action-title">Mở thư mục Vault</span>
                      <span className="welcome-action-desc">Đổi vùng làm việc trên máy</span>
                    </div>
                    <kbd className="welcome-kbd">Ctrl O</kbd>
                  </button>

                  <button
                    className="welcome-action-card"
                    onClick={() => handleNewFile()}
                  >
                    <div className="welcome-action-icon">
                      <FilePlus size={18} />
                    </div>
                    <div className="welcome-action-text">
                      <span className="welcome-action-title">Tạo ghi chú mới</span>
                      <span className="welcome-action-desc">Soạn thảo văn bản Markdown</span>
                    </div>
                    <kbd className="welcome-kbd">Ctrl N</kbd>
                  </button>

                  <button
                    className="welcome-action-card"
                    onClick={() => openSearchModal('commands')}
                  >
                    <div className="welcome-action-icon">
                      <Terminal size={18} />
                    </div>
                    <div className="welcome-action-text">
                      <span className="welcome-action-title">Bảng lệnh hệ thống</span>
                      <span className="welcome-action-desc">Mọi tính năng & phím tắt</span>
                    </div>
                    <kbd className="welcome-kbd">Ctrl ⇧ P</kbd>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Resizable Splitter */}
        {!isZenMode && showRightSidebar && (
          <div
            className="resize-splitter right-splitter"
            onMouseDown={handleRightResizeStart}
            title="Kéo sang trái/phải để chỉnh độ rộng Outline"
          />
        )}

        {/* Right Sidebar: Outline (TOC) */}
        {!isZenMode && showRightSidebar && (
          <aside className="sidebar sidebar-right" style={{ width: `${rightWidth}px` }}>
            <OutlineSidebar
              headings={headings}
              activeHeadingId={activeHeadingId}
              onSelectHeading={handleSelectHeading}
            />
          </aside>
        )}
      </div>

      {/* Status Bar */}
      {!isZenMode && (
        <StatusBar
          currentFilePath={activeTabId}
          content={currentContent}
          scrollProgress={scrollProgress}
          fontSize={readerFontSize}
          onChangeFontSize={(size) => {
            setReaderFontSize(size);
            localStorage.setItem('tmarkdown_font_size', size.toString());
          }}
        />
      )}

      {/* Quick Switcher & Command Palette Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        files={files}
        onSelectFile={handleSelectFile}
        commands={appCommands}
        initialMode={searchModalMode}
        initialQuery={searchInitialQuery}
      />

      {/* Auto-Update Modal & Notifications */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        updateInfo={updateInfo}
        isDownloading={isDownloading}
        downloadProgress={downloadProgress}
        isReadyToRestart={isReadyToRestart}
        errorMessage={updateErrorMessage}
        onStartDownload={startDownload}
        onApplyAndRestart={applyAndRestart}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;

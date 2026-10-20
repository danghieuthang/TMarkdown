import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, FileText, ArrowRight, AlignLeft, Terminal } from 'lucide-react';
import type { FileNode } from '../../types';
import { vaultService } from '../../utils/fileSystem';

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  execute: () => void;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileNode[];
  onSelectFile: (file: FileNode, lineNumber?: number, snippet?: string) => void;
  commands?: CommandItem[];
  initialMode?: 'files' | 'content' | 'commands';
  initialQuery?: string;
}

interface ContentSearchResult {
  path: string;
  name: string;
  lineNumber: number;
  snippet: string;
}

// Subsequence fuzzy match scoring
function fuzzyScore(query: string, text: string): number {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (!q) return 1;
  if (t === q) return 1000;
  if (t.startsWith(q)) return 800 - (t.length - q.length);
  const idx = t.indexOf(q);
  if (idx !== -1) return 500 - idx * 2;

  let qIdx = 0;
  let score = 0;
  let consecutive = 0;
  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      score += 15 + consecutive * 5;
      if (i === 0 || t[i - 1] === '/' || t[i - 1] === '_' || t[i - 1] === '-' || t[i - 1] === ' ') {
        score += 30; // bonus for token boundary
      }
      consecutive++;
      qIdx++;
    } else {
      consecutive = 0;
    }
  }
  return qIdx === q.length ? score : -1;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  files,
  onSelectFile,
  commands = [],
  initialMode = 'files',
  initialQuery = ''
}) => {
  const [searchMode, setSearchMode] = useState<'files' | 'content' | 'commands'>(initialMode);
  const [query, setQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [contentResults, setContentResults] = useState<ContentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Flatten files list to get all .md files
  const flatFiles = useMemo(() => {
    const list: FileNode[] = [];
    const traverse = (node: FileNode) => {
      if (!node.isDirectory) {
        list.push(node);
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    files.forEach(traverse);
    return list;
  }, [files]);

  // Filter files using fuzzy score (Feature C4)
  const filteredFiles = useMemo(() => {
    if (!query.trim()) return flatFiles;
    const scored = flatFiles
      .map(file => {
        const nameScore = fuzzyScore(query, file.name);
        const pathScore = fuzzyScore(query, file.path);
        const score = Math.max(nameScore * 1.5, pathScore);
        return { file, score };
      })
      .filter(item => item.score > 0);

    scored.sort((a, b) => b.score - a.score);
    return scored.map(item => item.file);
  }, [flatFiles, query]);

  // Filter commands using fuzzy score (Feature C3)
  const filteredCommands = useMemo(() => {
    const cmdQuery = query.startsWith('>') ? query.slice(1).trim() : query.trim();
    if (!cmdQuery) return commands;
    const scored = commands
      .map(cmd => {
        const titleScore = fuzzyScore(cmdQuery, cmd.title);
        const subScore = cmd.subtitle ? fuzzyScore(cmdQuery, cmd.subtitle) : -1;
        const score = Math.max(titleScore * 1.5, subScore);
        return { cmd, score };
      })
      .filter(item => item.score > 0);

    scored.sort((a, b) => b.score - a.score);
    return scored.map(item => item.cmd);
  }, [commands, query]);

  // Handle content search debounced (Feature A3 with backend query cancellation)
  useEffect(() => {
    if (searchMode !== 'content' || !query.trim() || query.length < 2) {
      setContentResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await vaultService.searchVault(query);
        setContentResults(results || []);
      } catch (err) {
        console.error('Vault search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchMode, query]);

  // Auto-switch to command mode if query starts with '>'
  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSelectedIndex(0);
    if (val.startsWith('>') && searchMode !== 'commands') {
      setSearchMode('commands');
    } else if (!val.startsWith('>') && searchMode === 'commands' && initialMode !== 'commands') {
      // If user deleted '>', switch back to files
      setSearchMode('files');
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSearchMode(initialMode);
      setQuery(initialQuery !== '' ? initialQuery : (initialMode === 'commands' ? '>' : ''));
      setSelectedIndex(0);
      setContentResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialMode, initialQuery]);

  const activeResultsCount = searchMode === 'files'
    ? filteredFiles.length
    : searchMode === 'content'
      ? contentResults.length
      : filteredCommands.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Cycle through modes
      setSearchMode(prev => {
        if (prev === 'files') return 'content';
        if (prev === 'content') return 'commands';
        return 'files';
      });
      setSelectedIndex(0);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, activeResultsCount));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + activeResultsCount) % Math.max(1, activeResultsCount));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchMode === 'files' && filteredFiles[selectedIndex]) {
        onSelectFile(filteredFiles[selectedIndex]);
        onClose();
      } else if (searchMode === 'content' && contentResults[selectedIndex]) {
        const res = contentResults[selectedIndex];
        onSelectFile({
          id: res.path,
          name: res.name,
          path: res.path,
          isDirectory: false
        }, res.lineNumber, res.snippet);
        onClose();
      } else if (searchMode === 'commands' && filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].execute();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Search header & mode switcher */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingRight: 12 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
            {searchMode === 'commands' ? (
              <Terminal size={18} style={{ position: 'absolute', left: 16, color: 'var(--accent-hover)' }} />
            ) : (
              <Search size={18} style={{ position: 'absolute', left: 16, color: 'var(--text-muted)' }} />
            )}
            <input
              ref={inputRef}
              type="text"
              className="modal-search-input"
              style={{ borderBottom: 'none', paddingLeft: 46 }}
              placeholder={
                searchMode === 'files'
                  ? "Tìm kiếm tên tài liệu (Tab đổi chế độ, gõ > để mở Lệnh)..."
                  : searchMode === 'content'
                    ? "Tìm kiếm từ khóa trong nội dung Vault..."
                    : "Nhập lệnh thực thi (Command Palette)..."
              }
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-input)', padding: 3, borderRadius: 'var(--radius-sm)' }}>
            <button
              className={`action-btn ${searchMode === 'files' ? 'active' : ''}`}
              onClick={() => { setSearchMode('files'); setSelectedIndex(0); if (query.startsWith('>')) setQuery(''); }}
              style={{ fontSize: 11, padding: '3px 8px', display: 'flex', gap: 4, alignItems: 'center' }}
              title="Tìm file theo tên"
            >
              <FileText size={12} />
              <span>Tên file</span>
            </button>
            <button
              className={`action-btn ${searchMode === 'content' ? 'active' : ''}`}
              onClick={() => { setSearchMode('content'); setSelectedIndex(0); if (query.startsWith('>')) setQuery(''); }}
              style={{ fontSize: 11, padding: '3px 8px', display: 'flex', gap: 4, alignItems: 'center' }}
              title="Tìm kiếm văn bản trong tài liệu"
            >
              <AlignLeft size={12} />
              <span>Nội dung</span>
            </button>
            <button
              className={`action-btn ${searchMode === 'commands' ? 'active' : ''}`}
              onClick={() => {
                setSearchMode('commands');
                setSelectedIndex(0);
                if (!query.startsWith('>')) setQuery('>');
              }}
              style={{ fontSize: 11, padding: '3px 8px', display: 'flex', gap: 4, alignItems: 'center' }}
              title="Bảng lệnh Command Palette (gõ >)"
            >
              <Terminal size={12} />
              <span>Lệnh (&gt;)</span>
            </button>
          </div>
        </div>

        {/* Results list */}
        <div className="modal-results-list">
          {searchMode === 'files' ? (
            filteredFiles.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                Không tìm thấy file nào khớp với "{query}"
              </div>
            ) : (
              filteredFiles.map((file, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={file.path}
                    className={`modal-result-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onSelectFile(file);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileText size={16} color="var(--accent-hover)" />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13.5 }}>{file.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{file.path}</div>
                      </div>
                    </div>
                    <ArrowRight size={14} style={{ opacity: isSelected ? 1 : 0 }} />
                  </div>
                );
              })
            )
          ) : searchMode === 'content' ? (
            isSearching ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                Đang tìm kiếm qua Goroutines song song...
              </div>
            ) : contentResults.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                {query.length < 2 ? 'Nhập ít nhất 2 ký tự để tìm kiếm nội dung trong Vault' : `Không tìm thấy đoạn văn nào chứa "${query}"`}
              </div>
            ) : (
              contentResults.map((res, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={`${res.path}-${res.lineNumber}-${idx}`}
                    className={`modal-result-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onSelectFile({
                        id: res.path,
                        name: res.name,
                        path: res.path,
                        isDirectory: false
                      }, res.lineNumber, res.snippet);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{res.name}</span>
                        <span style={{ fontSize: 11, background: 'var(--bg-input)', padding: '1px 6px', borderRadius: 4, color: 'var(--accent-hover)' }}>
                          Dòng {res.lineNumber}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        "...{res.snippet}..."
                      </div>
                    </div>
                    <ArrowRight size={14} style={{ opacity: isSelected ? 1 : 0 }} />
                  </div>
                );
              })
            )
          ) : (
            /* Command Palette Results */
            filteredCommands.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                Không tìm thấy lệnh nào khớp
              </div>
            ) : (
              filteredCommands.map((cmd, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={cmd.id}
                    className={`modal-result-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      cmd.execute();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, color: 'var(--accent-hover)' }}>
                        {cmd.icon || <Terminal size={16} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13.5, color: 'var(--text-primary)' }}>{cmd.title}</div>
                        {cmd.subtitle && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cmd.subtitle}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {cmd.shortcut && (
                        <span style={{
                          fontSize: 11,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'var(--bg-input)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border-subtle)',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {cmd.shortcut}
                        </span>
                      )}
                      <ArrowRight size={14} style={{ opacity: isSelected ? 1 : 0 }} />
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
};


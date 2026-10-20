import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ListTree, Hash, ChevronRight, ChevronDown, Search, X, ChevronsDown, ChevronsUp } from 'lucide-react';
import type { HeadingItem } from '../../types';

interface OutlineSidebarProps {
  headings: HeadingItem[];
  activeHeadingId: string | null;
  onSelectHeading: (headingId: string) => void;
}

export const OutlineSidebar: React.FC<OutlineSidebarProps> = ({
  headings,
  activeHeadingId,
  onSelectHeading
}) => {
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [maxDepth, setMaxDepth] = useState<number>(0); // 0 = all levels, 2 = H1-H2, 3 = H1-H3
  const activeItemRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll the active outline item into view in the sidebar
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeHeadingId]);

  // If activeHeadingId is inside a collapsed branch, expand its parents
  useEffect(() => {
    if (!activeHeadingId || headings.length === 0) return;
    const activeIdx = headings.findIndex(h => h.id === activeHeadingId);
    if (activeIdx === -1) return;

    const activeItem = headings[activeIdx];
    let currentLevel = activeItem.level;
    const parentsToExpand: string[] = [];

    for (let i = activeIdx - 1; i >= 0; i--) {
      if (headings[i].level < currentLevel) {
        parentsToExpand.push(headings[i].id);
        currentLevel = headings[i].level;
        if (currentLevel <= 1) break;
      }
    }

    if (parentsToExpand.length > 0) {
      setCollapsedMap(prev => {
        let changed = false;
        const next = { ...prev };
        for (const pid of parentsToExpand) {
          if (next[pid]) {
            delete next[pid];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [activeHeadingId, headings]);

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExpandAll = () => {
    setCollapsedMap({});
  };

  const handleCollapseAll = () => {
    const next: Record<string, boolean> = {};
    for (let i = 0; i < headings.length; i++) {
      const h = headings[i];
      const hasChildren = i + 1 < headings.length && headings[i + 1].level > h.level;
      if (hasChildren) {
        next[h.id] = true;
      }
    }
    setCollapsedMap(next);
  };

  // Determine visibility of each heading based on parent collapses, maxDepth, and text filter
  const visibleHeadings = useMemo(() => {
    const list: Array<{ heading: HeadingItem; hasChildren: boolean }> = [];
    const collapsedLevels: number[] = [];
    const query = filterQuery.toLowerCase().trim();

    for (let i = 0; i < headings.length; i++) {
      const h = headings[i];
      const hasChildren = i + 1 < headings.length && headings[i + 1].level > h.level;

      // Check max depth filter
      if (maxDepth > 0 && h.level > maxDepth) {
        continue;
      }

      // If user typed a search query, show all matches regardless of collapsed parents
      if (query) {
        if (h.text.toLowerCase().includes(query)) {
          list.push({ heading: h, hasChildren });
        }
        continue;
      }

      // Hierarchy collapse tracking
      while (collapsedLevels.length > 0 && collapsedLevels[collapsedLevels.length - 1] >= h.level) {
        collapsedLevels.pop();
      }

      const isHidden = collapsedLevels.length > 0;

      if (!isHidden) {
        list.push({ heading: h, hasChildren });
      }

      if (hasChildren && collapsedMap[h.id]) {
        collapsedLevels.push(h.level);
      }
    }

    return list;
  }, [headings, collapsedMap, filterQuery, maxDepth]);

  // Highlight matched filter text
  const renderHeadingText = (text: string) => {
    const query = filterQuery.trim();
    if (!query) return text;

    const lower = text.toLowerCase();
    const qLower = query.toLowerCase();
    const idx = lower.indexOf(qLower);
    if (idx === -1) return text;

    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + query.length);
    const after = text.slice(idx + query.length);

    return (
      <>
        {before}
        <span style={{ backgroundColor: 'var(--accent-glow)', color: 'var(--text-accent)', fontWeight: 600, borderRadius: 2 }}>
          {match}
        </span>
        {after}
      </>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ListTree size={14} />
          <span>Mục lục (Outline)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            className="header-icon-btn"
            style={{ width: 22, height: 22 }}
            onClick={handleExpandAll}
            title="Mở rộng tất cả các mục"
          >
            <ChevronsDown size={13} />
          </button>
          <button
            className="header-icon-btn"
            style={{ width: 22, height: 22 }}
            onClick={handleCollapseAll}
            title="Thu gọn tất cả các mục"
          >
            <ChevronsUp size={13} />
          </button>
        </div>
      </div>

      {/* Feature C2: Toolbar with Search filter & Max Depth selector */}
      <div className="outline-toolbar">
        <div className="outline-filter-box">
          <Search size={12} style={{ position: 'absolute', left: 7, color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="outline-filter-input"
            placeholder="Lọc tiêu đề..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery('')}
              style={{
                position: 'absolute',
                right: 6,
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                padding: 0
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Level depth selector pills */}
        <div className="outline-depth-selector">
          <button
            className={`outline-depth-btn ${maxDepth === 0 ? 'active' : ''}`}
            onClick={() => setMaxDepth(0)}
            title="Hiển thị tất cả các cấp (H1 - H6)"
          >
            Tất cả
          </button>
          <button
            className={`outline-depth-btn ${maxDepth === 2 ? 'active' : ''}`}
            onClick={() => setMaxDepth(2)}
            title="Chỉ hiển thị cấp H1 - H2"
          >
            H1 - H2
          </button>
          <button
            className={`outline-depth-btn ${maxDepth === 3 ? 'active' : ''}`}
            onClick={() => setMaxDepth(3)}
            title="Chỉ hiển thị cấp H1 - H3"
          >
            H1 - H3
          </button>
        </div>
      </div>

      {/* Headings List Content */}
      <div className="sidebar-content">
        {headings.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            Không có tiêu đề (Heading) nào trong tài liệu
          </div>
        ) : visibleHeadings.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            Không có mục nào khớp bộ lọc
          </div>
        ) : (
          visibleHeadings.map(({ heading: h, hasChildren }) => {
            const isActive = h.id === activeHeadingId;
            const isCollapsed = !!collapsedMap[h.id];

            return (
              <div
                key={h.id}
                ref={isActive ? activeItemRef : undefined}
                className={`outline-item outline-level-${Math.min(h.level, 4)} ${isActive ? 'active' : ''}`}
                onClick={() => onSelectHeading(h.id)}
                title={h.text}
              >
                {hasChildren && !filterQuery ? (
                  <span
                    className="outline-chevron"
                    onClick={(e) => toggleCollapse(h.id, e)}
                    title={isCollapsed ? "Mở rộng" : "Thu gọn"}
                  >
                    {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                  </span>
                ) : (
                  <span style={{ width: 16, display: 'inline-block' }} />
                )}
                <Hash size={12} style={{ opacity: 0.5, marginRight: 4, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {renderHeadingText(h.text)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};


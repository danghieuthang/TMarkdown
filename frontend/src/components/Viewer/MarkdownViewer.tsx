import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { renderMarkdown } from '../../utils/markdownParser';
import { useScrollMemory } from '../../hooks/useScrollMemory';
import { InPageSearch } from '../Search/InPageSearch';
import type { HeadingItem } from '../../types';

interface MarkdownViewerProps {
  content: string;
  filePath: string | null;
  headings: HeadingItem[];
  renderedHtml?: string;
  targetLineNumber?: number | null;
  targetSnippet?: string | null;
  fontSize?: number;
  isSearchOpen?: boolean;
  onCloseSearch?: () => void;
  onActiveHeadingChange?: (headingId: string) => void;
  onScrollProgressChange?: (progressPercent: number) => void;
  onNavigateFile?: (targetPath: string, anchor?: string) => void;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  filePath,
  headings,
  renderedHtml,
  targetLineNumber,
  targetSnippet,
  fontSize = 15,
  isSearchOpen = false,
  onCloseSearch,
  onActiveHeadingChange,
  onScrollProgressChange,
  onNavigateFile
}) => {
  const articleRef = useRef<HTMLElement | null>(null);

  // In-page search state
  const [inPageQuery, setInPageQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  // Parse markdown into HTML (uses pre-rendered single-pass result if provided)
  const displayHtml = useMemo(() => {
    if (renderedHtml !== undefined) return renderedHtml;
    if (!content) return '<p style="color: var(--text-muted); font-style: italic;">Tài liệu trống...</p>';
    return renderMarkdown(content);
  }, [renderedHtml, content]);

  // Hook handles restoring and preserving exact scroll coordinates
  const { containerRef, handleScroll } = useScrollMemory({
    filePath,
    content,
    headings,
    onActiveHeadingChange,
    onScrollProgressChange
  });

  // Remove all search marks and restore original text nodes
  const clearHighlights = useCallback(() => {
    if (!articleRef.current) return;
    const marks = articleRef.current.querySelectorAll('mark.search-highlight');
    marks.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });
    setTotalMatches(0);
    setCurrentMatchIndex(0);
  }, []);

  // Highlight matches using DOM TreeWalker
  useEffect(() => {
    if (!isSearchOpen || !inPageQuery.trim() || !articleRef.current) {
      clearHighlights();
      return;
    }

    clearHighlights();

    const query = inPageQuery.toLowerCase();
    const walker = document.createTreeWalker(articleRef.current, NodeFilter.SHOW_TEXT, null);
    const textNodes: Text[] = [];

    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (node.parentElement && (node.parentElement.tagName === 'SCRIPT' || node.parentElement.tagName === 'STYLE')) {
        continue;
      }
      if (node.textContent && node.textContent.toLowerCase().includes(query)) {
        textNodes.push(node);
      }
    }

    let matchCount = 0;
    textNodes.forEach(node => {
      const text = node.textContent || '';
      const lower = text.toLowerCase();
      let index = lower.indexOf(query);
      if (index === -1) return;

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;

      while (index !== -1) {
        if (index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex, index)));
        }

        const mark = document.createElement('mark');
        mark.className = 'search-highlight';
        mark.dataset.index = matchCount.toString();
        mark.textContent = text.substring(index, index + query.length);
        fragment.appendChild(mark);

        matchCount++;
        lastIndex = index + query.length;
        index = lower.indexOf(query, lastIndex);
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
      }

      node.parentNode?.replaceChild(fragment, node);
    });

    setTotalMatches(matchCount);
    setCurrentMatchIndex(0);

    // Highlight the first match if found
    if (matchCount > 0 && articleRef.current) {
      const firstMark = articleRef.current.querySelector('mark.search-highlight[data-index="0"]');
      if (firstMark) {
        firstMark.classList.add('active');
        firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isSearchOpen, inPageQuery, displayHtml, clearHighlights]);

  // Navigate active match
  const updateActiveMatch = useCallback((index: number) => {
    if (!articleRef.current || totalMatches === 0) return;
    const allMarks = articleRef.current.querySelectorAll('mark.search-highlight');
    allMarks.forEach(m => m.classList.remove('active'));

    const targetMark = articleRef.current.querySelector(`mark.search-highlight[data-index="${index}"]`);
    if (targetMark) {
      targetMark.classList.add('active');
      targetMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [totalMatches]);

  const handleNextMatch = () => {
    if (totalMatches === 0) return;
    const next = (currentMatchIndex + 1) % totalMatches;
    setCurrentMatchIndex(next);
    updateActiveMatch(next);
  };

  const handlePrevMatch = () => {
    if (totalMatches === 0) return;
    const prev = (currentMatchIndex - 1 + totalMatches) % totalMatches;
    setCurrentMatchIndex(prev);
    updateActiveMatch(prev);
  };

  // Clear when search is closed
  useEffect(() => {
    if (!isSearchOpen) {
      clearHighlights();
      setInPageQuery('');
    }
  }, [isSearchOpen, clearHighlights]);

  // Attach copy button to code blocks
  React.useEffect(() => {
    if (!containerRef.current) return;
    const preBlocks = containerRef.current.querySelectorAll('pre');
    preBlocks.forEach((pre) => {
      if (pre.querySelector('.copy-code-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'copy-code-btn';
      btn.textContent = 'Copy';
      btn.onclick = (e) => {
        e.stopPropagation();
        const codeText = pre.querySelector('code')?.innerText || pre.innerText;
        navigator.clipboard.writeText(codeText);
        btn.textContent = '✓ Copied';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 1600);
      };
      pre.appendChild(btn);
    });
  }, [displayHtml]);

  // Jump to specific line from search result (Feature C1)
  useEffect(() => {
    if (!targetLineNumber || !containerRef.current) return;

    const timeout = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const lines = content.split('\n');
      const totalLines = Math.max(1, lines.length);
      const ratio = Math.min(1, Math.max(0, (targetLineNumber - 1) / totalLines));

      const targetScroll = ratio * (container.scrollHeight - container.clientHeight);
      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth'
      });

      // Pulse flash the element containing snippet if found
      if (targetSnippet && articleRef.current) {
        const cleanSnippet = targetSnippet.slice(0, 30).trim().toLowerCase();
        if (cleanSnippet) {
          const walker = document.createTreeWalker(articleRef.current, NodeFilter.SHOW_TEXT, null);
          while (walker.nextNode()) {
            const node = walker.currentNode as Text;
            if (node.textContent && node.textContent.toLowerCase().includes(cleanSnippet)) {
              const el = node.parentElement;
              if (el) {
                el.style.transition = 'background-color 0.3s ease';
                el.style.backgroundColor = 'var(--accent-glow)';
                setTimeout(() => {
                  el.style.backgroundColor = '';
                }, 1400);
                break;
              }
            }
          }
        }
      }
    }, 120);

    return () => clearTimeout(timeout);
  }, [targetLineNumber, targetSnippet, filePath, content]);

  // Handle clicks on links to prevent webview reload and support internal vault navigation
  const handleArticleClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = (e.target as HTMLElement).closest('a');
    if (!target) return;

    const href = target.getAttribute('href');
    if (!href) return;

    // Prevent default browser/webview navigation which causes full page reload
    e.preventDefault();

    // Case 1: In-page anchor link (#section)
    if (href.startsWith('#')) {
      const headingId = href.substring(1);
      const el = document.getElementById(headingId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    // Case 2: External web link (http://, https://)
    if (/^(https?:\/\/|mailto:)/i.test(href)) {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }

    // Case 3: Internal Markdown file link or wiki-link
    if (onNavigateFile) {
      const parts = href.split('#');
      onNavigateFile(parts[0], parts[1]);
    }
  };

  return (
    <div
      ref={containerRef}
      className="doc-scroll-viewport"
      onScroll={handleScroll}
      style={{ position: 'relative' }}
    >
      <InPageSearch
        isOpen={isSearchOpen}
        onClose={onCloseSearch || (() => {})}
        query={inPageQuery}
        onQueryChange={setInPageQuery}
        currentIndex={currentMatchIndex}
        totalMatches={totalMatches}
        onNext={handleNextMatch}
        onPrev={handlePrevMatch}
      />

      <div className="doc-content-wrapper">
        <article
          ref={articleRef}
          className="markdown-body"
          style={{ fontSize: `${fontSize}px` }}
          dangerouslySetInnerHTML={{ __html: displayHtml }}
          onClick={handleArticleClick}
        />
      </div>
    </div>
  );
};

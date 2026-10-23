import React, { useRef, useEffect, useCallback } from 'react';
import type { HeadingItem } from '../../types';

interface MarkdownEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  onSave?: () => void;
  targetHeadingId?: string | null;
  headings?: HeadingItem[];
  scrollRatio?: number;
  onCursorChange?: (cursorLine: number, nearestHeadingId: string | null) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  onSave,
  targetHeadingId,
  headings = [],
  scrollRatio,
  onCursorChange
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isInitialScrollDoneRef = useRef(false);

  // Helper to calculate line index and character offset for a given line number
  const getLineOffsets = useCallback((lines: string[], targetLine: number) => {
    let charOffset = 0;
    const clampedLine = Math.max(0, Math.min(targetLine, lines.length - 1));
    for (let i = 0; i < clampedLine; i++) {
      charOffset += lines[i].length + 1; // +1 for newline '\n'
    }
    return { lineIndex: clampedLine, charOffset };
  }, []);

  // Update parent with current cursor line & nearest heading
  const updateCursorInfo = useCallback((pos?: number) => {
    const textarea = textareaRef.current;
    if (!textarea || !onCursorChange) return;

    const cursor = typeof pos === 'number' ? pos : textarea.selectionStart;
    const textBefore = content.substring(0, cursor);
    const currentLine = textBefore.split('\n').length - 1; // 0-indexed line

    let nearestHeadingId: string | null = null;
    if (headings && headings.length > 0) {
      for (let i = headings.length - 1; i >= 0; i--) {
        const h = headings[i];
        if (typeof h.line === 'number') {
          if (h.line <= currentLine) {
            nearestHeadingId = h.id;
            break;
          }
        }
      }
    }

    onCursorChange(currentLine, nearestHeadingId);
  }, [content, headings, onCursorChange]);

  // Initial scroll and cursor placement when opening Edit mode
  useEffect(() => {
    if (isInitialScrollDoneRef.current) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    isInitialScrollDoneRef.current = true;
    const lines = content.split('\n');

    let targetLineIndex: number = -1;

    // 1. Try to find the section matching targetHeadingId
    if (targetHeadingId && headings.length > 0) {
      const heading = headings.find(h => h.id === targetHeadingId);
      if (heading) {
        if (typeof heading.line === 'number' && heading.line >= 0 && heading.line < lines.length) {
          targetLineIndex = heading.line;
        } else {
          // Fallback matching heading text
          const cleanText = heading.text.toLowerCase().trim();
          targetLineIndex = lines.findIndex(l => {
            const trimmed = l.trim().toLowerCase();
            return trimmed.startsWith('#') && trimmed.includes(cleanText);
          });
        }
      }
    }

    const timer = setTimeout(() => {
      const computed = window.getComputedStyle(textarea);
      const computedLineHeight = parseFloat(computed.lineHeight) || 24.65;
      const paddingTop = parseFloat(computed.paddingTop) || 36;

      if (targetLineIndex >= 0) {
        const { charOffset } = getLineOffsets(lines, targetLineIndex);
        // Scroll so section header is near the top (~60px from top)
        const targetScrollTop = Math.max(0, paddingTop + targetLineIndex * computedLineHeight - 60);

        textarea.scrollTop = targetScrollTop;
        textarea.setSelectionRange(charOffset, charOffset);
        textarea.focus();
        updateCursorInfo(charOffset);
      } else if (typeof scrollRatio === 'number' && scrollRatio > 0) {
        const maxScroll = textarea.scrollHeight - textarea.clientHeight;
        if (maxScroll > 0) {
          textarea.scrollTop = Math.round(scrollRatio * maxScroll);
        }
        const targetChar = Math.min(content.length, Math.max(0, Math.round(scrollRatio * content.length)));
        textarea.setSelectionRange(targetChar, targetChar);
        textarea.focus();
        updateCursorInfo(targetChar);
      } else {
        textarea.focus();
        updateCursorInfo(0);
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [targetHeadingId, headings, scrollRatio, content, getLineOffsets, updateCursorInfo]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl + S to save
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      if (onSave) onSave();
      return;
    }
    // Tab key support
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      onChange(newContent);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
        updateCursorInfo(start + 2);
      });
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', height: '100%', overflow: 'hidden' }}>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          onChange(e.target.value);
          const pos = e.target.selectionStart;
          updateCursorInfo(pos);
        }}
        onKeyDown={handleKeyDown}
        onSelect={() => updateCursorInfo()}
        onClick={() => updateCursorInfo()}
        onKeyUp={() => updateCursorInfo()}
        placeholder="Bắt đầu soạn thảo Markdown tại đây..."
        spellCheck={false}
        style={{
          flex: 1,
          height: '100%',
          padding: '36px 48px',
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          fontSize: '14.5px',
          lineHeight: '1.7',
          border: 'none',
          outline: 'none',
          resize: 'none',
          boxSizing: 'border-box'
        }}
      />
    </div>
  );
};

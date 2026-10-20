import React from 'react';

interface MarkdownEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  onSave?: () => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  content,
  onChange,
  onSave
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (onSave) onSave();
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
      });
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', height: '100%', overflow: 'hidden' }}>
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
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

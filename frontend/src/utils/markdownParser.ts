import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import type { HeadingItem } from '../types';

// Helper to normalize Vietnamese diacritics and strip markdown characters
export function slugify(text: string): string {
  const clean = text
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/[*_`~[\]()]/g, '') // strip markdown markers
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return clean || 'heading';
}

// Slugger to ensure each heading receives a strictly unique HTML ID across the document
export class HeadingSlugger {
  private occurrences = new Map<string, number>();

  public slug(text: string): string {
    const rawSlug = slugify(text);
    let count = this.occurrences.get(rawSlug) || 0;
    let slug = rawSlug;

    if (count > 0) {
      slug = `${rawSlug}-${count}`;
    }

    while (this.occurrences.has(slug)) {
      count++;
      slug = `${rawSlug}-${count}`;
    }

    this.occurrences.set(rawSlug, count + 1);
    this.occurrences.set(slug, 1);

    return slug;
  }

  public reset() {
    this.occurrences.clear();
  }
}

// Initialize markdown-it with syntax highlighting
export const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: false, // Keep technical characters literal (prevents 0..* -> 0…*, --flag -> –flag, (c) -> ©)
  highlight: function (str: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlighted = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
        return `<pre class="hljs"><code>${highlighted}</code></pre>`;
      } catch {
        // Fallback
      }
    }
    return `<pre class="hljs"><code>${mdParser.utils.escapeHtml(str)}</code></pre>`;
  }
});

// Custom heading renderer to add unique id attributes
const defaultHeadingOpen = mdParser.renderer.rules.heading_open || function(tokens, idx, options, _env, self) {
  return self.renderToken(tokens, idx, options);
};

mdParser.renderer.rules.heading_open = function(tokens, idx, options, env, self) {
  // If id is already set (e.g. from single-pass AST traversal), preserve it!
  const existingId = tokens[idx].attrGet('id');
  if (!existingId) {
    const nextToken = tokens[idx + 1];
    if (nextToken && nextToken.type === 'inline') {
      const rawText = nextToken.content;
      const slugger = (env as { slugger?: HeadingSlugger } | undefined)?.slugger;
      const uniqueId = slugger ? slugger.slug(rawText) : slugify(rawText);
      tokens[idx].attrSet('id', uniqueId);
    }
  }
  return defaultHeadingOpen(tokens, idx, options, env, self);
};

// Custom table wrapper for responsive overflow
mdParser.renderer.rules.table_open = () => '<div class="table-wrapper"><table>\n';
mdParser.renderer.rules.table_close = () => '</table></div>\n';

// Custom pre-processor for Obsidian-style Wiki-links [[Note Name]] or [[Note Name|Alias]]
export function parseWikiLinks(markdown: string): string {
  return markdown.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, alias) => {
    const text = (alias || target).trim();
    const link = target.trim();
    return `<a href="${link}" class="internal-link wiki-link">${text}</a>`;
  });
}

// Custom pre-processor for Obsidian-style Highlights ==highlighted text==
export function parseHighlights(markdown: string): string {
  // Protect fenced code blocks and inline code from highlight replacement
  const codeBlocks: string[] = [];
  const placeholder = '___TMD_CODE_BLOCK_';

  const sanitized = markdown.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
    codeBlocks.push(match);
    return `${placeholder}${codeBlocks.length - 1}___`;
  });

  const withHighlights = sanitized.replace(/==([^=\n]+)==/g, '<mark class="md-highlight">$1</mark>');

  return withHighlights.replace(new RegExp(`${placeholder}(\\d+)___`, 'g'), (_, idx) => {
    return codeBlocks[parseInt(idx, 10)] || '';
  });
}

export interface ParseResult {
  html: string;
  headings: HeadingItem[];
}

// Single-pass parser: Parses AST tokens once, extracts headings, and renders HTML without double work
export function parseAndRenderMarkdown(markdown: string): ParseResult {
  if (!markdown) {
    return {
      html: '<p style="color: var(--text-muted); font-style: italic;">Tài liệu trống...</p>',
      headings: []
    };
  }

  const withWikiLinks = parseWikiLinks(markdown);
  const withHighlights = parseHighlights(withWikiLinks);
  const slugger = new HeadingSlugger();
  const headings: HeadingItem[] = [];

  // Parse markdown into tokens (1 time only)
  const env = { slugger };
  const tokens = mdParser.parse(withHighlights, env);

  // Single pass to extract headings and attach unique IDs
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === 'heading_open') {
      const level = parseInt(token.tag.slice(1), 10) || 1;
      const nextToken = tokens[i + 1];
      if (nextToken && nextToken.type === 'inline') {
        const rawText = nextToken.content;
        const id = slugger.slug(rawText);
        token.attrSet('id', id); // assign directly to the AST token

        const text = rawText
          .replace(/<[^>]*>/g, '')
          .replace(/[*_`~[\]()]/g, '')
          .trim();
        const line = token.map ? token.map[0] : undefined;
        headings.push({ id, level, text: text || rawText, line });
      }
    }
  }

  // Render HTML directly from the token stream
  const html = mdParser.renderer.render(tokens, mdParser.options, env);
  return { html, headings };
}

// Render markdown with wiki-links support and unique sequential heading IDs (convenience wrapper)
export function renderMarkdown(markdown: string): string {
  return parseAndRenderMarkdown(markdown).html;
}

// Extract list of headings from raw Markdown text for Outline TOC (convenience wrapper)
export function extractHeadings(markdown: string): HeadingItem[] {
  return parseAndRenderMarkdown(markdown).headings;
}

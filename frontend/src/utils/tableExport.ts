export interface TableData {
  headers: string[];
  rows: string[][];
}

/**
 * Extracts clean structured tabular data from an HTML table element.
 */
export function parseTableElement(table: HTMLTableElement): TableData {
  const headers: string[] = [];
  const rows: string[][] = [];

  // Extract headers from thead th or fallback to first tr
  const theadThs = table.querySelectorAll('thead th');
  if (theadThs.length > 0) {
    theadThs.forEach(th => {
      headers.push((th.textContent || '').trim());
    });
  } else {
    const firstRow = table.querySelector('tr');
    if (firstRow) {
      firstRow.querySelectorAll('th, td').forEach(cell => {
        headers.push((cell.textContent || '').trim());
      });
    }
  }

  // Extract body rows
  const tbodyRows = table.querySelectorAll('tbody tr');
  const trElements = tbodyRows.length > 0 ? tbodyRows : table.querySelectorAll('tr');

  trElements.forEach((tr, index) => {
    // If no thead, skip index 0 since it was parsed as header
    if (theadThs.length === 0 && index === 0) return;

    const rowCells: string[] = [];
    tr.querySelectorAll('td, th').forEach(cell => {
      rowCells.push((cell.textContent || '').trim());
    });

    if (rowCells.length > 0) {
      rows.push(rowCells);
    }
  });

  // Fallback default column names if headers were empty
  if (headers.length === 0 && rows.length > 0) {
    const maxCols = Math.max(...rows.map(r => r.length));
    for (let i = 0; i < maxCols; i++) {
      headers.push(`Cột ${i + 1}`);
    }
  }

  return { headers, rows };
}

/**
 * Escapes a cell for Tab-Separated Values (TSV) format.
 */
function escapeTsvCell(val: string): string {
  if (/[\t\r\n"]/.test(val)) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/**
 * Generates TSV text from table data with column filtering and ordering.
 */
export function generateTsv(
  tableData: TableData,
  columnIndices: number[],
  includeHeaders: boolean = true
): string {
  const lines: string[] = [];

  if (includeHeaders) {
    const headerLine = columnIndices
      .map(colIdx => escapeTsvCell(tableData.headers[colIdx] ?? ''))
      .join('\t');
    lines.push(headerLine);
  }

  tableData.rows.forEach(row => {
    const rowLine = columnIndices
      .map(colIdx => escapeTsvCell(row[colIdx] ?? ''))
      .join('\t');
    lines.push(rowLine);
  });

  return lines.join('\r\n');
}

/**
 * Generates clean HTML Table with inline styling so Excel pastes it with table grid and formatting.
 */
export function generateHtmlTable(
  tableData: TableData,
  columnIndices: number[],
  includeHeaders: boolean = true
): string {
  const thStyles = 'border: 1px solid #d0d7de; padding: 6px 12px; background-color: #f6f8fa; font-weight: bold; text-align: left;';
  const tdStyles = 'border: 1px solid #d0d7de; padding: 6px 12px; text-align: left;';

  let html = '<table style="border-collapse: collapse; font-family: sans-serif; font-size: 11pt;">\n';

  if (includeHeaders) {
    html += '  <thead>\n    <tr>\n';
    columnIndices.forEach(colIdx => {
      const title = tableData.headers[colIdx] ?? '';
      html += `      <th style="${thStyles}">${escapeHtml(title)}</th>\n`;
    });
    html += '    </tr>\n  </thead>\n';
  }

  html += '  <tbody>\n';
  tableData.rows.forEach(row => {
    html += '    <tr>\n';
    columnIndices.forEach(colIdx => {
      const cellText = row[colIdx] ?? '';
      html += `      <td style="${tdStyles}">${escapeHtml(cellText)}</td>\n`;
    });
    html += '    </tr>\n';
  });
  html += '  </tbody>\n</table>';

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Copies table data into clipboard with dual format:
 * - text/html: Native rich table for Excel and Google Sheets
 * - text/plain: Tab-separated values (TSV) fallback
 */
export async function copyTableToClipboard(
  tableData: TableData,
  columnIndices?: number[],
  includeHeaders: boolean = true
): Promise<boolean> {
  const cols = columnIndices ?? tableData.headers.map((_, i) => i);
  const tsv = generateTsv(tableData, cols, includeHeaders);
  const html = generateHtmlTable(tableData, cols, includeHeaders);

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const textBlob = new Blob([tsv], { type: 'text/plain' });
      const htmlBlob = new Blob([html], { type: 'text/html' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': textBlob,
          'text/html': htmlBlob
        })
      ]);
      return true;
    }
  } catch {
    // Fallback if rich clipboard write fails
  }

  try {
    await navigator.clipboard.writeText(tsv);
    return true;
  } catch {
    return false;
  }
}

/**
 * Escapes a cell for CSV format.
 */
function escapeCsvCell(val: string): string {
  if (/[,;\r\n"]/.test(val)) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/**
 * Generates CSV string and triggers a browser file download with UTF-8 BOM so Excel opens Vietnamese characters properly.
 */
export function downloadCsv(
  tableData: TableData,
  columnIndices?: number[],
  includeHeaders: boolean = true,
  filename = 'bang-du-lieu.csv'
): void {
  const cols = columnIndices ?? tableData.headers.map((_, i) => i);
  const lines: string[] = [];

  if (includeHeaders) {
    const headerLine = cols
      .map(colIdx => escapeCsvCell(tableData.headers[colIdx] ?? ''))
      .join(',');
    lines.push(headerLine);
  }

  tableData.rows.forEach(row => {
    const rowLine = cols
      .map(colIdx => escapeCsvCell(row[colIdx] ?? ''))
      .join(',');
    lines.push(rowLine);
  });

  const csvContent = lines.join('\r\n');
  // Prepend UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

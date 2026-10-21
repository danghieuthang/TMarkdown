import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  FileSpreadsheet, 
  Download, 
  RotateCcw, 
  CheckSquare, 
  Square,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import type { TableData } from '../../utils/tableExport';
import { copyTableToClipboard, downloadCsv } from '../../utils/tableExport';

interface TableCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableData: TableData | null;
}

export const TableCustomizerModal: React.FC<TableCustomizerModalProps> = ({
  isOpen,
  onClose,
  tableData
}) => {
  const [columnOrder, setColumnOrder] = useState<number[]>([]);
  const [selectedMap, setSelectedMap] = useState<Record<number, boolean>>({});
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(true);
  const [copiedFeedback, setCopiedFeedback] = useState<boolean>(false);

  // Initialize column list whenever tableData changes
  useEffect(() => {
    if (tableData && tableData.headers.length > 0) {
      const initialOrder = tableData.headers.map((_, i) => i);
      setColumnOrder(initialOrder);
      const initialSelected: Record<number, boolean> = {};
      initialOrder.forEach(i => {
        initialSelected[i] = true;
      });
      setSelectedMap(initialSelected);
      setIncludeHeaders(true);
      setCopiedFeedback(false);
    }
  }, [tableData, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Currently active columns in order
  const activeColumns = useMemo(() => {
    return columnOrder.filter(idx => selectedMap[idx]);
  }, [columnOrder, selectedMap]);

  if (!isOpen || !tableData) return null;

  const moveColumn = (indexInOrder: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? indexInOrder - 1 : indexInOrder + 1;
    if (targetIndex < 0 || targetIndex >= columnOrder.length) return;

    setColumnOrder(prev => {
      const next = [...prev];
      const temp = next[indexInOrder];
      next[indexInOrder] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const toggleColumn = (colIdx: number) => {
    setSelectedMap(prev => ({
      ...prev,
      [colIdx]: !prev[colIdx]
    }));
  };

  const handleSelectAll = () => {
    const next: Record<number, boolean> = {};
    columnOrder.forEach(i => {
      next[i] = true;
    });
    setSelectedMap(next);
  };

  const handleDeselectAll = () => {
    const next: Record<number, boolean> = {};
    columnOrder.forEach(i => {
      next[i] = false;
    });
    setSelectedMap(next);
  };

  const handleResetOrder = () => {
    const resetOrder = tableData.headers.map((_, i) => i);
    setColumnOrder(resetOrder);
    const resetSelected: Record<number, boolean> = {};
    resetOrder.forEach(i => {
      resetSelected[i] = true;
    });
    setSelectedMap(resetSelected);
  };

  const handleCopyExcel = async () => {
    if (activeColumns.length === 0) return;
    const ok = await copyTableToClipboard(tableData, activeColumns, includeHeaders);
    if (ok) {
      setCopiedFeedback(true);
      setTimeout(() => {
        setCopiedFeedback(false);
      }, 1800);
    }
  };

  const handleDownloadCsv = () => {
    if (activeColumns.length === 0) return;
    downloadCsv(tableData, activeColumns, includeHeaders);
  };

  // Preview rows (first 6 rows max)
  const previewRows = tableData.rows.slice(0, 6);

  return (
    <div className="table-modal-backdrop" onClick={onClose}>
      <div 
        className="table-modal-container" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="table-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SlidersHorizontal size={18} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h3 className="table-modal-title">Tùy chỉnh & Sao chép bảng cho Excel</h3>
              <p className="table-modal-subtitle">
                Chọn các cột cần sao chép và đảo thứ tự hiển thị theo ý muốn
              </p>
            </div>
          </div>
          <button className="table-modal-close" onClick={onClose} title="Đóng (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="table-modal-body">
          {/* Top Options Toolbar */}
          <div className="table-modal-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button 
                type="button" 
                className="table-toolbar-btn" 
                onClick={handleSelectAll}
                title="Chọn toàn bộ cột"
              >
                <CheckSquare size={13} />
                <span>Chọn tất cả</span>
              </button>
              <button 
                type="button" 
                className="table-toolbar-btn" 
                onClick={handleDeselectAll}
                title="Bỏ chọn tất cả"
              >
                <Square size={13} />
                <span>Bỏ chọn</span>
              </button>
              <button 
                type="button" 
                className="table-toolbar-btn" 
                onClick={handleResetOrder}
                title="Khôi phục thứ tự gốc"
              >
                <RotateCcw size={13} />
                <span>Thứ tự gốc</span>
              </button>
            </div>

            <label className="table-checkbox-label">
              <input
                type="checkbox"
                checked={includeHeaders}
                onChange={(e) => setIncludeHeaders(e.target.checked)}
              />
              <span>Bao gồm hàng tiêu đề (Header row)</span>
            </label>
          </div>

          <div className="table-modal-columns-grid">
            {/* Left: Column order items */}
            <div className="table-columns-panel">
              <div className="table-panel-title">
                <span>Thứ tự & Chọn lọc cột ({activeColumns.length}/{columnOrder.length})</span>
              </div>
              <div className="table-columns-list">
                {columnOrder.map((colIdx, orderIdx) => {
                  const isChecked = !!selectedMap[colIdx];
                  const colName = tableData.headers[colIdx] || `Cột ${colIdx + 1}`;
                  return (
                    <div 
                      key={colIdx} 
                      className={`table-column-item ${isChecked ? 'selected' : 'unselected'}`}
                    >
                      <label className="table-col-check">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleColumn(colIdx)}
                        />
                        <span className="table-col-index">{orderIdx + 1}.</span>
                        <span className="table-col-name" title={colName}>{colName}</span>
                      </label>

                      <div className="table-col-order-btns">
                        <button
                          type="button"
                          className="table-order-btn"
                          disabled={orderIdx === 0}
                          onClick={() => moveColumn(orderIdx, 'up')}
                          title="Chuyển lên trước"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          className="table-order-btn"
                          disabled={orderIdx === columnOrder.length - 1}
                          onClick={() => moveColumn(orderIdx, 'down')}
                          title="Chuyển xuống sau"
                        >
                          <ArrowDown size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Live Preview */}
            <div className="table-preview-panel">
              <div className="table-panel-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Eye size={13} />
                  <span>Xem trước kết quả (Live Preview - {tableData.rows.length} dòng)</span>
                </div>
              </div>
              <div className="table-preview-scroll">
                {activeColumns.length === 0 ? (
                  <div className="table-preview-empty">
                    Vui lòng chọn ít nhất 1 cột để xem trước và sao chép
                  </div>
                ) : (
                  <table className="table-preview-table">
                    {includeHeaders && (
                      <thead>
                        <tr>
                          {activeColumns.map(colIdx => (
                            <th key={colIdx}>
                              {tableData.headers[colIdx] || `Cột ${colIdx + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {previewRows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {activeColumns.map(colIdx => (
                            <td key={colIdx}>
                              {row[colIdx] ?? ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="table-modal-footer">
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Đã chọn {activeColumns.length} cột • Dán trực tiếp vào Excel bằng Ctrl + V
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="table-secondary-btn"
              onClick={handleDownloadCsv}
              disabled={activeColumns.length === 0}
              title="Tải bảng dữ liệu về máy dưới dạng file .csv"
            >
              <Download size={14} />
              <span>Tải file CSV</span>
            </button>

            <button
              type="button"
              className={`table-primary-btn ${copiedFeedback ? 'success' : ''}`}
              onClick={handleCopyExcel}
              disabled={activeColumns.length === 0}
            >
              {copiedFeedback ? <Check size={14} /> : <FileSpreadsheet size={14} />}
              <span>{copiedFeedback ? '✓ Đã sao chép vào Clipboard!' : 'Sao chép cho Excel'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

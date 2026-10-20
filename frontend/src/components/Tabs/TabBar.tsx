import React from 'react';
import { X, FileText } from 'lucide-react';
import type { TabItem } from '../../types';

interface TabBarProps {
  tabs: TabItem[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string, e: React.MouseEvent) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab
}) => {
  if (tabs.length === 0) return null;

  return (
    <div className="tab-bar">
      {tabs.map(tab => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            className={`tab-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
            onAuxClick={(e) => {
              if (e.button === 1) {
                e.preventDefault();
                onCloseTab(tab.id, e);
              }
            }}
            title={tab.path}
          >
            <FileText size={13} style={{ opacity: isActive ? 1 : 0.6 }} />
            <span className="tab-title">
              {tab.name}
              {tab.isDirty && <span style={{ color: 'var(--accent-hover)', marginLeft: 3 }}>*</span>}
            </span>
            <span
              className="tab-close-btn"
              onClick={(e) => onCloseTab(tab.id, e)}
              title="Đóng tab (Ctrl+W)"
            >
              <X size={12} />
            </span>
          </div>
        );
      })}
    </div>
  );
};

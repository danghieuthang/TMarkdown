import { useEffect } from 'react';
import { X, Info, CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from './Button';

export type ToastType = 'info' | 'success' | 'warning' | 'danger' | 'accent';

export interface ToastItem {
  id: string;
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = no auto dismiss
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const { id, type = 'info', title, message, duration = 6000, action } = toast;

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} color="var(--color-success)" />;
      case 'warning':
        return <AlertTriangle size={16} color="var(--color-warning)" />;
      case 'danger':
        return <AlertCircle size={16} color="var(--color-danger)" />;
      case 'accent':
        return <Sparkles size={16} color="var(--text-accent)" />;
      default:
        return <Info size={16} color="var(--color-info)" />;
    }
  };

  return (
    <div className={`ui-toast ui-toast--${type}`}>
      <span className="ui-toast-icon">{renderIcon()}</span>
      <div className="ui-toast-content">
        <div className="ui-toast-title">{title}</div>
        {message && <div className="ui-toast-message">{message}</div>}
        {action && (
          <div className="ui-toast-action">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                action.onClick();
                onDismiss(id);
              }}
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        onClick={() => onDismiss(id)}
        aria-label="Đóng thông báo"
      >
        <X size={14} />
      </Button>
    </div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="ui-toast-region">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

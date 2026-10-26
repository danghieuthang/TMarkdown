import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  footer?: ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  icon,
  size = 'md',
  children,
  footer,
  closeOnOverlayClick = true,
  closeOnEsc = true
}: ModalProps) {
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="ui-modal-overlay"
      onClick={e => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={`ui-modal-container ui-modal-container--${size}`}>
        {(title || icon) && (
          <div className="ui-modal-header">
            <div className="ui-modal-header-left">
              {icon && <span className="ui-modal-icon">{icon}</span>}
              {title && <h3 className="ui-modal-title">{title}</h3>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={onClose}
              title="Đóng (ESC)"
              aria-label="Đóng"
            >
              <X size={16} />
            </Button>
          </div>
        )}

        <div className="ui-modal-body">{children}</div>

        {footer && <div className="ui-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

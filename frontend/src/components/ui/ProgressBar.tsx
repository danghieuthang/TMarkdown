export interface ProgressBarProps {
  progress?: number; // 0 to 100
  indeterminate?: boolean;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({
  progress = 0,
  indeterminate = false,
  label,
  showPercentage = true,
  className = ''
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className={`ui-progress-wrapper ${className}`}>
      {(label || (showPercentage && !indeterminate)) && (
        <div className="ui-progress-meta">
          <span>{label}</span>
          {showPercentage && !indeterminate && (
            <span className="ui-progress-percent">{Math.round(clamped)}%</span>
          )}
        </div>
      )}
      <div className="ui-progress-track">
        <div
          className={`ui-progress-fill ${indeterminate ? 'ui-progress-fill--indeterminate' : ''}`}
          style={indeterminate ? undefined : { width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

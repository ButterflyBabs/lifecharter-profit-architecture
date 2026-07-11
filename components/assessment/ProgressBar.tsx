/**
 * Progress Bar Component
 */

interface ProgressBarProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  progress,
  size = 'md',
  className = '',
  showLabel = false
}: ProgressBarProps) {
  const heightClass = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }[size];
  
  // Determine color based on progress
  const getColorClass = (p: number) => {
    if (p >= 80) return 'bg-green-500';
    if (p >= 50) return 'bg-yellow-500';
    if (p >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex-1 bg-gray-200 rounded-full ${heightClass}`}>
        <div
          className={`${getColorClass(progress)} ${heightClass} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm text-gray-600 min-w-[3rem]">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
}

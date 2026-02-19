import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  status: 'active' | 'idle' | 'processing' | 'error' | 'success';
  label?: string;
  pulse?: boolean;
}

export function StatusIndicator({ 
  status, 
  label, 
  pulse = false,
  className,
  ...props 
}: StatusIndicatorProps) {
  const statusConfig = {
    active: { color: 'bg-success', label: 'Active' },
    idle: { color: 'bg-foreground/30', label: 'Idle' },
    processing: { color: 'bg-primary', label: 'Processing' },
    error: { color: 'bg-error', label: 'Error' },
    success: { color: 'bg-success', label: 'Success' },
  };

  const config = statusConfig[status];

  return (
    <div className={cn('glass px-3 py-2 flex items-center gap-2', className)} {...props}>
      <div className="relative">
        <span className={cn('w-2 h-2 rounded-full block', config.color)} />
        {pulse && (
          <span className={cn('absolute inset-0 w-2 h-2 rounded-full animate-ping', config.color)} />
        )}
      </div>
      <span className="text-xs font-mono uppercase tracking-widest opacity-80">
        {label || config.label}
      </span>
    </div>
  );
}

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  status: 'active' | 'idle' | 'processing' | 'error' | 'success';
  label?: string;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusIndicator({ 
  status, 
  label, 
  pulse = false,
  size = 'md',
  className,
  ...props 
}: StatusIndicatorProps) {
  const statusConfig = {
    active: { color: 'bg-success', ringColor: 'ring-success/30', label: 'Active' },
    idle: { color: 'bg-foreground/20', ringColor: 'ring-foreground/10', label: 'Idle' },
    processing: { color: 'bg-primary', ringColor: 'ring-primary/30', label: 'Processing' },
    error: { color: 'bg-error', ringColor: 'ring-error/30', label: 'Error' },
    success: { color: 'bg-success', ringColor: 'ring-success/30', label: 'Success' },
  };

  const sizes = {
    sm: { dot: 'w-1.5 h-1.5', text: 'text-[10px]', padding: 'px-2.5 py-1.5' },
    md: { dot: 'w-2 h-2', text: 'text-xs', padding: 'px-3 py-2' },
    lg: { dot: 'w-2.5 h-2.5', text: 'text-sm', padding: 'px-4 py-2.5' },
  };

  const config = statusConfig[status];
  const sizeConfig = sizes[size];

  return (
    <div className={cn('glass-subtle flex items-center gap-2.5 rounded-full backdrop-blur-md', sizeConfig.padding, className)} {...props}>
      <div className="relative flex items-center justify-center">
        <span className={cn('rounded-full block', sizeConfig.dot, config.color)} />
        {pulse && (
          <>
            <span className={cn('absolute inset-0 rounded-full animate-ping', sizeConfig.dot, config.color, 'opacity-75')} />
            <span className={cn('absolute inset-[-4px] rounded-full ring-2', config.ringColor, 'animate-pulse')} />
          </>
        )}
      </div>
      <span className={cn('font-mono uppercase tracking-widest text-foreground/70 font-semibold', sizeConfig.text)}>
        {label || config.label}
      </span>
    </div>
  );
}

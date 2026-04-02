import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'neutral' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  children: ReactNode;
}

export function Badge({ 
  className, 
  variant = 'primary', 
  size = 'md',
  glow = false,
  children, 
  ...props 
}: BadgeProps) {
  const variants = {
    primary: 'bg-primary/15 text-primary-light border-primary/30',
    secondary: 'bg-secondary/15 text-secondary border-secondary/30',
    accent: 'bg-accent/15 text-accent-glow border-accent/30',
    success: 'bg-success/15 text-success border-success/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    neutral: 'bg-white/5 text-foreground/70 border-white/10',
    gradient: 'bg-gradient-to-br from-primary/20 to-secondary/20 text-primary-light border-primary/20',
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-[10px]',
    md: 'px-3.5 py-1.5 text-xs',
    lg: 'px-5 py-2 text-sm',
  };

  const glowStyles = glow ? {
    primary: 'shadow-glow-primary',
    secondary: 'shadow-glow-secondary',
    accent: 'shadow-glow-accent',
    success: 'shadow-glow-success',
    warning: 'shadow-lg',
    neutral: '',
    gradient: 'shadow-glow-primary',
  }[variant] : '';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 font-bold uppercase tracking-widest rounded-full border backdrop-blur-sm transition-all duration-300 hover:scale-105',
        variants[variant],
        sizes[size],
        glowStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

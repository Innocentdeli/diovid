import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'glass-intense' | 'solid' | 'bordered' | 'elevated' | 'aurora';
  hoverable?: boolean;
  glow?: boolean;
  children: ReactNode;
}

export function Card({ 
  className, 
  variant = 'glass', 
  hoverable = false,
  glow = false,
  children, 
  ...props 
}: CardProps) {
  const variants = {
    glass: 'glass',
    'glass-intense': 'glass-intense',
    solid: 'bg-surface border border-border/30',
    bordered: 'border-2 border-border/50 bg-background',
    elevated: 'bg-surface-elevated border border-border-light/40 shadow-xl',
    aurora: 'aurora-bg glass-intense',
  };

  const hoverStyles = hoverable 
    ? 'hover:bg-white/[0.08] hover:border-white/15 hover:-translate-y-1 hover:shadow-xl cursor-pointer' 
    : '';

  const glowStyles = glow ? 'glow-primary' : '';

  return (
    <div
      className={cn(
        'rounded-2xl p-6 transition-all duration-500 ease-out',
        variants[variant],
        hoverStyles,
        glowStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('mb-5', className)} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3 className={cn('text-xl font-bold tracking-tight text-foreground', className)} {...props}>
      {children}
    </h3>
  );
}

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function CardDescription({ className, children, ...props }: CardDescriptionProps) {
  return (
    <p className={cn('text-sm text-foreground-muted leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {children}
    </div>
  );
}

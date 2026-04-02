import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-background relative overflow-hidden group';
    
    const variants = {
      primary: 'button-premium text-white shadow-glow-primary',
      secondary: 'bg-gradient-to-br from-secondary to-secondary-dark hover:brightness-110 text-white rounded-lg shadow-glow-secondary border border-white/10',
      ghost: 'hover:bg-white/[0.08] text-foreground/80 hover:text-foreground rounded-lg border border-transparent hover:border-white/10',
      outline: 'border border-border-light hover:border-primary/50 hover:bg-primary/5 text-foreground rounded-lg backdrop-blur-sm',
      danger: 'bg-gradient-to-br from-error to-red-600 hover:brightness-110 text-white rounded-lg shadow-lg border border-white/10',
      success: 'bg-gradient-to-br from-success to-success-dark hover:brightness-110 text-black rounded-lg shadow-glow-success border border-white/10',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-lg gap-2',
      md: 'px-6 py-2.5 text-base rounded-xl gap-2.5',
      lg: 'px-8 py-4 text-lg rounded-xl gap-3',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : null}
        {children}
        {variant === 'primary' && !isLoading && (
          <span className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

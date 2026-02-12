import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em]',
          {
            'bg-[var(--foreground)] text-[var(--background)]': variant === 'default',
            'border border-[var(--card-border)] text-[var(--foreground-muted)]': variant === 'secondary',
            'border border-[var(--secondary)] text-[var(--secondary)]': variant === 'success',
            'border border-[var(--warning)] text-[var(--warning)]': variant === 'warning',
            'border border-[var(--error)] text-[var(--error)]': variant === 'destructive',
          },
          className
        )}
        style={{ borderRadius: '2px' }}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };

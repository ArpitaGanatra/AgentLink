import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center font-semibold uppercase tracking-[0.08em] transition-all cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-[var(--foreground)] text-[var(--background)] hover:shadow-[4px_4px_0_0_var(--accent)]': variant === 'default',
            'border-2 border-[var(--foreground)] text-[var(--foreground)] bg-transparent hover:bg-[var(--foreground)] hover:text-[var(--background)]': variant === 'outline',
            'hover:bg-[var(--background-secondary)] text-[var(--foreground)]': variant === 'ghost',
            'text-[var(--accent)] underline-offset-4 hover:underline': variant === 'link',
          },
          {
            'h-10 px-5 py-2 text-xs': size === 'default',
            'h-8 px-3 text-[11px]': size === 'sm',
            'h-12 px-8 text-sm': size === 'lg',
          },
          className
        )}
        style={{ borderRadius: '2px' }}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };

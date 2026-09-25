import * as React from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-9 w-full rounded-md',
      'border border-[var(--border)] bg-[var(--surface)]',
      'px-3 text-[13px] text-[var(--text-primary)]',
      'transition-colors duration-100',
      'placeholder:text-[var(--text-placeholder)]',
      'hover:border-[var(--border-2)]',
      'focus:border-[var(--ring)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/20',
      'disabled:bg-[var(--surface-2)] disabled:text-[var(--text-placeholder)] disabled:cursor-not-allowed disabled:border-[var(--border)]',
      className,
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }

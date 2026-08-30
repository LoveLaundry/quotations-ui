import * as React from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-10 w-full rounded-lg',
      'border border-[var(--border)] bg-[var(--surface)]',
      'px-3 py-2 text-[14px] text-[var(--text-primary)]',
      'shadow-sm',
      'outline-none transition-all duration-200',
      'placeholder:text-[var(--text-placeholder)]',
      'hover:border-[var(--border-2)]',
      'focus:border-[var(--red-600)] focus:ring-3 focus:ring-red-500/10',
      'disabled:bg-[var(--surface-2)] disabled:text-[var(--text-placeholder)] disabled:cursor-not-allowed disabled:border-[var(--border)]',
      className,
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }

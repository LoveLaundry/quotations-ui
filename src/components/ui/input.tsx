import * as React from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        // Matches the clean deedlink-style input: white bg, light border, inner shadow, red focus ring
        'flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-900',
        'shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]',
        'outline-none transition-all duration-150',
        'placeholder:text-slate-400',
        'hover:border-slate-300',
        'focus:border-red-500 focus:shadow-[inset_0_1px_2px_rgba(15,23,42,0.04),0_0_0_3px_rgba(220,38,38,0.10)]',
        'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }

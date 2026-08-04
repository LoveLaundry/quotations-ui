import * as React from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-2xl border border-stone-200/80 bg-white/90 px-3 py-2 text-sm shadow-[0_10px_24px_-18px_rgba(15,23,42,0.35)] outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-200 dark:border-slate-700 dark:bg-slate-900/80',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }

import * as React from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-9 w-full rounded-lg',
      'border border-[#E4E7EC] bg-white',
      'px-3 text-[13px] text-[#101828]',
      'shadow-[0_1px_2px_rgba(16,24,40,0.05)]',
      'outline-none transition-all duration-150',
      'placeholder:text-[#98A2B3]',
      'hover:border-[#D1D5DB]',
      'focus:border-[#DC2626] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.10),0_1px_2px_rgba(16,24,40,0.05)]',
      'disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed',
      className,
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }

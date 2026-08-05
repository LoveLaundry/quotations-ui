import * as React from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-10 w-full rounded-lg',
      'border border-[#E5E7EB] bg-white',
      'px-3 py-2 text-[14px] text-[#111827]',
      'shadow-sm',
      'outline-none transition-all duration-200',
      'placeholder:text-[#9CA3AF]',
      'hover:border-[#D1D5DB]',
      'focus:border-[#DC2626] focus:ring-3 focus:ring-red-500/10',
      'disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed disabled:border-[#E5E7EB]',
      className,
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }

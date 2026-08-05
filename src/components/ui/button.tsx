import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-1.5 shrink-0',
    'rounded-lg text-[13px] font-medium leading-none',
    'border transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:ring-offset-1',
    'disabled:pointer-events-none disabled:opacity-40',
    'cursor-pointer select-none active:scale-[0.98]',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'bg-[#DC2626] border-[#DC2626] text-white',
          'shadow-[0_1px_2px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.12)]',
          'hover:bg-[#B91C1C] hover:border-[#B91C1C]',
        ].join(' '),
        secondary: [
          'bg-white border-[#E4E7EC] text-[#374151]',
          'shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
          'hover:bg-[#F9FAFB] hover:border-[#D1D5DB] hover:text-[#111827]',
        ].join(' '),
        outline: [
          'bg-transparent border-[#FECACA] text-[#DC2626]',
          'hover:bg-[#FFF1F1] hover:border-[#FCA5A5]',
        ].join(' '),
        ghost: [
          'bg-transparent border-transparent text-[#6B7280]',
          'hover:bg-[#F3F4F6] hover:text-[#111827]',
        ].join(' '),
        destructive: [
          'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]',
          'hover:bg-[#FEE2E2] hover:border-[#FCA5A5]',
        ].join(' '),
      },
      size: {
        default: 'h-9 px-3.5',
        sm:      'h-7 px-2.5 text-[12px]',
        lg:      'h-10 px-4 text-[14px]',
        icon:    'h-8 w-8 p-0 rounded-lg border-transparent',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Slot>
      )
    }
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 shrink-0',
    'rounded-lg text-[13px] font-medium leading-none',
    'border transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-red-500/20 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
    'cursor-pointer select-none',
    'active:scale-[0.97] hover:shadow-sm',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'bg-gradient-to-b from-[#DC2626] to-[#B91C1C]',
          'border-[#B91C1C] text-white',
          'shadow-sm shadow-red-600/20',
          'hover:from-[#B91C1C] hover:to-[#991B1B]',
          'hover:shadow-md hover:shadow-red-600/30',
        ].join(' '),
        secondary: [
          'bg-white border-[#E5E7EB] text-[#374151]',
          'shadow-sm',
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
        default: 'h-9 px-4',
        sm: 'h-8 px-3 text-[12px]',
        lg: 'h-11 px-5 text-[14px] font-semibold',
        icon: 'h-9 w-9 p-0 rounded-lg border-transparent',
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

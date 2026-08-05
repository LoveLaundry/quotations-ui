import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-1.5',
    'rounded-lg font-semibold text-[13px] leading-none',
    'transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:ring-offset-1',
    'disabled:pointer-events-none disabled:opacity-40',
    'cursor-pointer select-none',
    'active:scale-[0.97]',
  ].join(' '),
  {
    variants: {
      variant: {
        // Primary — solid brand red, like the deedlink "Connect Wallet" button
        default: [
          'bg-red-600 text-white',
          'shadow-[0_1px_3px_rgba(220,38,38,0.35),inset_0_1px_0_rgba(255,255,255,0.15)]',
          'hover:bg-red-700 hover:shadow-[0_2px_6px_rgba(220,38,38,0.40)]',
        ].join(' '),
        // Secondary — muted, like the deedlink "Login" button
        secondary: [
          'bg-slate-100 text-slate-600 border border-slate-200',
          'hover:bg-slate-200 hover:text-slate-800',
        ].join(' '),
        // Outline
        outline: 'border border-red-300 bg-transparent text-red-600 hover:bg-red-50',
        // Ghost
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        // Destructive
        destructive: 'bg-red-700 text-white shadow-sm hover:bg-red-800',
      },
      size: {
        default: 'h-9 px-4',
        sm:      'h-7 px-3 text-[12px]',
        lg:      'h-10 px-5 text-[14px]',
        icon:    'h-8 w-8 p-0 shrink-0 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
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

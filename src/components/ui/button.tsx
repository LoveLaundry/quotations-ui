import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 shrink-0 select-none',
    'rounded-md text-[13px] font-medium leading-none',
    'border border-transparent',
    'transition-colors duration-100',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
    'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
    'cursor-pointer',
  ].join(' '),
  {
    variants: {
      variant: {
        /* Solid near-black. The accent colour is reserved for status and
           destructive states, so the brand red stops appearing everywhere. */
        default: 'bg-[var(--text-primary)] text-[var(--surface)] hover:opacity-90',
        /* Opt-in brand-coloured call to action, for the few places that
           genuinely want the red. */
        brand:
          'bg-[var(--red-600)] text-white hover:bg-[var(--red-700)]',
        secondary:
          'bg-[var(--surface)] border-[var(--border-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
        outline:
          'bg-transparent border-[var(--border-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
        ghost:
          'bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
        destructive:
          'bg-transparent border-[var(--red-100)] text-[var(--red-600)] hover:bg-[var(--red-50)] hover:border-[var(--red-600)]',
        link: 'bg-transparent text-[var(--red-600)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-3.5',
        sm: 'h-8 px-3 text-[12px]',
        lg: 'h-10 px-4 text-[14px]',
        icon: 'h-9 w-9 p-0',
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

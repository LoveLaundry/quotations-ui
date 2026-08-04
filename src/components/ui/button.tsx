import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-2xl text-sm font-semibold tracking-[0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-rose-600 text-white hover:bg-rose-700 shadow-[0_8px_20px_-10px_rgba(225,29,72,0.38)]',
        secondary: 'border border-stone-200/80 bg-white/90 text-slate-700 hover:bg-white shadow-[0_6px_16px_-12px_rgba(15,23,42,0.18)] backdrop-blur',
        outline: 'border border-stone-200 bg-transparent text-slate-700 hover:bg-stone-50/80 dark:text-slate-100',
        ghost: 'bg-transparent text-slate-700 hover:bg-rose-50/70 dark:text-slate-100',
      },
      size: {
        default: 'h-11 px-4 py-2',
        sm: 'h-9 rounded-xl px-3',
        lg: 'h-12 rounded-2xl px-6',
        icon: 'h-10 w-10',
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
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { Button }

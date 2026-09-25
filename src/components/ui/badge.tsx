import type * as React from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' | 'default' | 'secondary'
}

const variantMap: Record<string, string> = {
  default: 'border-[var(--red-100)] bg-[var(--red-50)] text-[var(--red-600)]',
  secondary: 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)]',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  neutral: 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]',
  purple: 'border-violet-200 bg-violet-50 text-violet-700',
}

export function Badge({ children, className, variant = 'neutral' }: BadgeProps) {
  return (
    <span className={cn(
      // Squared-off and quiet. A row of saturated pills reads as a generated
      // dashboard; these sit back until the state actually matters.
      'inline-flex items-center rounded border px-1.5 py-0.5',
      'text-[11px] font-medium leading-4',
      variantMap[variant],
      className,
    )}>
      {children}
    </span>
  )
}

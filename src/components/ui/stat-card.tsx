import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: number | string
  trendLabel?: string
  description?: string
  color?: 'red' | 'green' | 'blue' | 'amber' | 'purple' | 'gray'
  className?: string
  /** Navigate on click */
  to?: string
  onClick?: () => void
}

const colorMap = {
  red: { iconBg: 'bg-red-50 text-red-600 border border-red-200', trend: 'text-red-600' },
  green: { iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200', trend: 'text-emerald-600' },
  blue: { iconBg: 'bg-blue-50 text-blue-600 border border-blue-200', trend: 'text-blue-600' },
  amber: { iconBg: 'bg-amber-50 text-amber-600 border border-amber-200', trend: 'text-amber-600' },
  purple: { iconBg: 'bg-purple-50 text-purple-600 border border-purple-200', trend: 'text-purple-600' },
  gray: { iconBg: 'bg-gray-100 text-gray-600 border border-gray-200', trend: 'text-gray-600' },
}

export function StatCard({ label, value, icon, trend, trendLabel, description, color = 'gray', className, to, onClick }: StatCardProps) {
  const navigate = useNavigate()
  const c = colorMap[color]
  const trendNum = typeof trend === 'number' ? trend : undefined
  const trendStr = typeof trend === 'string' ? trend : undefined
  const isPositive = trendNum !== undefined && trendNum > 0
  const isNegative = trendNum !== undefined && trendNum < 0
  const displayLabel = description || trendLabel
  const clickable = Boolean(to || onClick)

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={() => {
        if (onClick) onClick()
        else if (to) navigate(to)
      }}
      onKeyDown={clickable ? e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          if (onClick) onClick()
          else if (to) navigate(to)
        }
      } : undefined}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5',
        'transition-colors duration-100 hover:border-[var(--border-2)]',
        clickable && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
        className,
      )}
    >
      <div className="flex items-start justify-between relative">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
          <p className="mt-1.5 text-[28px] font-bold text-[var(--text-primary)] leading-none tracking-tight truncate">{value}</p>
          {(trendNum !== undefined || trendStr || displayLabel) && (
            <div className="flex items-center gap-2 mt-2">
              {trendNum !== undefined && (
                <span className={cn(
                  'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold border',
                  isPositive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                  isNegative ? 'bg-red-50 border-red-200 text-red-700' :
                  'bg-gray-50 border-gray-200 text-gray-600',
                )}>
                  {isPositive ? <TrendingUp size={11} /> : isNegative ? <TrendingDown size={11} /> : null}
                  {isPositive ? '+' : ''}{trendNum.toFixed(1)}%
                </span>
              )}
              {trendStr && (
                <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold bg-gray-50 border border-gray-200 text-gray-600">
                  {trendStr}
                </span>
              )}
              {displayLabel && !trendStr && (
                <span className="text-[12px] text-[var(--text-muted)]">{displayLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            c.iconBg,
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

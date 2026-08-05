import React from 'react'
import { cn } from '../../lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  description?: string
  trend?: string
  icon: React.ReactNode
  className?: string
}

export function StatCard({ label, value, description, trend, icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'group rounded-xl border border-slate-200 bg-white p-4',
        'shadow-[0_1px_3px_0_rgba(15,23,42,0.06)]',
        'transition-all duration-150',
        'hover:shadow-[0_4px_12px_-2px_rgba(220,38,38,0.10)] hover:border-red-200',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-[24px] font-bold text-slate-900 leading-none tracking-tight">{value}</p>
          {description && (
            <div className="flex items-center gap-1.5 pt-1">
              {trend && (
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  {trend}
                </span>
              )}
              <span className="text-[12px] text-slate-500">{description}</span>
            </div>
          )}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-red-600 group-hover:text-white transition-all duration-200">
          {icon}
        </div>
      </div>
    </div>
  )
}

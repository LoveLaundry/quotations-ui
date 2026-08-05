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
    <div className={cn(
      'group relative overflow-hidden',
      'rounded-xl border border-[#E4E7EC] bg-white p-5',
      'shadow-[0_1px_2px_rgba(16,24,40,0.05)]',
      'transition-all duration-200',
      'hover:shadow-[0_4px_16px_rgba(16,24,40,0.08)] hover:border-[#D1D5DB]',
      className,
    )}>
      {/* Subtle top-right glow on hover */}
      <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-red-500/0 group-hover:bg-red-500/6 blur-xl transition-colors duration-300 pointer-events-none" />

      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#98A2B3]">{label}</p>
          <p className="mt-1.5 text-[26px] font-bold text-[#101828] leading-none tracking-tight">{value}</p>
          {description && (
            <div className="flex items-center gap-1.5 mt-2">
              {trend && (
                <span className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  {trend}
                </span>
              )}
              <span className="text-[12px] text-[#98A2B3]">{description}</span>
            </div>
          )}
        </div>
        <div className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          'bg-[#F3F4F6] text-[#6B7280] border border-[#E4E7EC]',
          'group-hover:bg-[#DC2626] group-hover:text-white group-hover:border-[#DC2626]',
          'transition-all duration-200',
        )}>
          {icon}
        </div>
      </div>
    </div>
  )
}

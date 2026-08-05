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
        'group relative overflow-hidden',
        'rounded-xl border border-[#E5E7EB] bg-white p-6',
        'shadow-sm',
        'transition-all duration-300',
        'hover:shadow-md hover:border-[#FCA5A5] hover:-translate-y-1',
        className,
      )}
    >
      <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-red-500/0 group-hover:bg-red-500/5 blur-2xl transition-all duration-500 pointer-events-none" />

      <div className="flex items-start justify-between relative">
        <div className="flex-1">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[#6B7280]">
            {label}
          </p>
          <p className="mt-2 text-[32px] font-bold text-[#111827] leading-none tracking-tight">
            {value}
          </p>
          {description && (
            <div className="flex items-center gap-2 mt-3">
              {trend && (
                <span className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                  {trend}
                </span>
              )}
              <span className="text-[13px] text-[#6B7280]">{description}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
            'bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] text-[#6B7280] border border-[#E5E7EB]',
            'group-hover:from-[#DC2626] group-hover:to-[#B91C1C] group-hover:text-white group-hover:border-[#B91C1C]',
            'group-hover:shadow-lg group-hover:shadow-red-600/30',
            'transition-all duration-300',
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

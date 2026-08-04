import React from 'react'
import { motion } from 'framer-motion'
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
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'luxury-card rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition-all duration-300 relative overflow-hidden group',
        className,
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors pointer-events-none" />
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-2">
          <p className="text-[20px] font-semibold text-slate-500 tracking-wide uppercase">{label}</p>
          <p className="text-[34px] font-bold text-slate-900 tracking-tight leading-none pt-1">{value}</p>
          {description ? (
            <div className="flex items-center gap-2 pt-2">
              {trend ? (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[16px] font-semibold text-emerald-700">
                  {trend}
                </span>
              ) : null}
              <span className="text-[18px] text-slate-500">{description}</span>
            </div>
          ) : null}
        </div>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100 group-hover:bg-red-600 group-hover:text-white transition-colors duration-300 shadow-sm">
          {icon}
        </div>
      </div>
    </motion.div>
  )
}

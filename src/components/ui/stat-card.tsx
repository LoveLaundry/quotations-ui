import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  description?: string
  icon: React.ReactNode
  className?: string
}

export function StatCard({ label, value, description, icon, className }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'rounded-xl border border-surface-border bg-white p-6 shadow-card',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-body text-slate-500">{label}</p>
          <p className="text-section text-slate-900">{value}</p>
          {description ? <p className="text-body text-slate-400">{description}</p> : null}
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          {icon}
        </div>
      </div>
    </motion.div>
  )
}

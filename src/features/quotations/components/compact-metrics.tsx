import type { ReactNode } from 'react'
import { cn } from '../../../lib/utils'

export interface MetricItem {
    id: string
    label: string
    value: number
    icon?: ReactNode
    tone?: 'blue' | 'green' | 'amber' | 'red' | 'gray'
    money?: boolean
}

const toneMap = {
    blue: { iconBg: 'border-[blue-200] bg-[blue-50] text-[blue-600]', valueText: 'text-[blue-700]' },
    green: { iconBg: 'border-[emerald-200] bg-[emerald-50] text-[emerald-600]', valueText: 'text-[emerald-700]' },
    amber: { iconBg: 'border-[amber-200] bg-[amber-50] text-[amber-600]', valueText: 'text-[amber-700]' },
    red: { iconBg: 'border-[var(--red-100)] bg-[var(--red-50)] text-[var(--red-600)]', valueText: 'text-[var(--red-700)]' },
    gray: { iconBg: 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]', valueText: 'text-[var(--text-secondary)]' },
}

export function CompactMetrics({ items, className }: { items: MetricItem[]; className?: string }) {
    return (
        <div className={cn('grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6', className)}>
            {items.map(metric => {
                const tone = toneMap[metric.tone ?? 'gray']
                return (
                    <div
                        key={metric.id}
                        className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3"
                    >
                        {metric.icon && (
                            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border', tone.iconBg)}>
                                {metric.icon}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className={cn('text-[18px] font-bold leading-none tracking-tight', metric.money && 'text-[14px]', tone.valueText)} title={metric.money ? `LKR ${metric.value.toLocaleString()}` : undefined}>
                                {metric.money ? `LKR ${metric.value.toLocaleString()}` : metric.value}
                            </p>
                            <p className="mt-1 truncate text-[11px] font-medium text-[var(--text-faint)]">{metric.label}</p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
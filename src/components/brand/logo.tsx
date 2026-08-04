import { cn } from '../../lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizes = {
  sm: { icon: 32, text: 'text-lg' },
  md: { icon: 40, text: 'text-xl' },
  lg: { icon: 48, text: 'text-2xl' },
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const { icon, text } = sizes[size]

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <svg width={icon} height={icon} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="22" fill="#FEF2F2" stroke="#FECACA" strokeWidth="1.5" />
        <path
          d="M24 38C24 38 10 28 10 18.5C10 14.36 13.36 11 17.5 11C20.24 11 22.68 12.44 24 14.6C25.32 12.44 27.76 11 30.5 11C34.64 11 38 14.36 38 18.5C38 28 24 38 24 38Z"
          fill="#DC2626"
        />
        <text
          x="24"
          y="27"
          textAnchor="middle"
          fill="white"
          fontFamily="Georgia, serif"
          fontSize="16"
          fontWeight="700"
        >
          L
        </text>
      </svg>
      {showText ? (
        <div className="min-w-0">
          <p className={cn('font-semibold leading-tight text-brand-600', text)} style={{ fontFamily: 'Georgia, serif' }}>
            Love Laundry
          </p>
          <p className="truncate text-sm font-medium text-slate-500">Guest Accounts</p>
        </div>
      ) : null}
    </div>
  )
}

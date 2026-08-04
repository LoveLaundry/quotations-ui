import { cn } from '../../lib/utils'
import iconPng from '../../assets/icon.png'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const iconSizes = { sm: 36, md: 44, lg: 56 }

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const px = iconSizes[size]

  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      <img
        src={iconPng}
        alt="Love Laundry"
        width={px}
        height={px}
        className="shrink-0 object-contain drop-shadow-sm"
        style={{ width: px, height: px }}
      />
      {showText ? (
        <div className="min-w-0 leading-none">
          <p className="font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Spectral, Georgia, serif', fontSize: size === 'sm' ? 16 : size === 'md' ? 19 : 23 }}>
            Love Laundry
          </p>
          <p className="text-slate-500 font-medium truncate" style={{ fontSize: size === 'sm' ? 11 : 12 }}>
            Guest Accounts
          </p>
        </div>
      ) : null}
    </div>
  )
}

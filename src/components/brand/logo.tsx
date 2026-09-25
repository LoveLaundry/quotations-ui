import { cn } from '../../lib/utils'


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
        src="/icon.png"
        alt="Love Laundry"
        width={px}
        height={px}
        className="shrink-0 object-contain drop-shadow-sm"
        style={{ width: px, height: px }}
      />
      {showText ? (
        <div className="min-w-0 leading-none">
          <p className="font-semibold text-slate-900 tracking-tight" style={{ fontSize: size === 'sm' ? 15 : size === 'md' ? 18 : 21 }}>
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

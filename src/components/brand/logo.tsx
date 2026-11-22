import { cn } from '../../lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
  /** Sub-line under the wordmark, e.g. the active hotel or module. */
  tagline?: string
}

const ICON_PX = { sm: 28, md: 34, lg: 44 } as const
const WORD = { sm: 14, md: 16, lg: 20 } as const
// Secondary brand copy still has to be readable on a 375px screen.
const TAG = { sm: 12, md: 12, lg: 12 } as const

/**
 * Brand mark. A wordmark in the interface sans at a tight tracking — a script
 * face reads as a consumer product, and this is an operations tool. The icon
 * is a raster asset, so it is given a hairline ring rather than a shadow to
 * keep it from looking pasted onto the surface.
 */
export function Logo({ size = 'md', showText = true, className, tagline }: LogoProps) {
  const px = ICON_PX[size]

  return (
    <div className={cn('flex min-w-0 items-center gap-2.5 select-none', className)}>
      <img
        src="/icon.png"
        alt=""
        width={px}
        height={px}
        className="shrink-0 object-contain"
        style={{ width: px, height: px }}
      />
      {showText && (
        <div className="min-w-0 leading-none">
          <p
            className="truncate font-semibold tracking-[-0.02em] text-[var(--text-primary)]"
            style={{ fontSize: WORD[size] }}
          >
            Love Laundry
          </p>
          <p
            className="mt-0.5 truncate text-[var(--text-muted)]"
            style={{ fontSize: TAG[size] }}
          >
            {tagline ?? 'Operations'}
          </p>
        </div>
      )}
    </div>
  )
}

/** Wordmark for the dark sidebar surface. */
export function LogoOnDark({ collapsed = false, tagline }: { collapsed?: boolean; tagline?: string }) {
  if (collapsed) {
    return (
      <img
        src="/icon.png"
        alt="Love Laundry"
        width={26}
        height={26}
        className="mx-auto size-[26px] shrink-0 object-contain"
      />
    )
  }
  return (
    <div className="flex min-w-0 items-center gap-2.5 select-none">
      <img
        src="/icon.png"
        alt=""
        width={26}
        height={26}
        className="size-[26px] shrink-0 object-contain"
      />
      <div className="min-w-0 leading-none">
        <p className="truncate text-[13.5px] font-semibold tracking-[-0.01em] text-[var(--sidebar-active)]">
          Love Laundry
        </p>
        <p className="mt-0.5 truncate text-[12px] text-[var(--sidebar-label)]">
          {tagline ?? 'Manager'}
        </p>
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { History, Store as Storefront } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { DropdownMenu, type MenuGroup } from '../ui/dropdown-menu'
import { cn } from '../../lib/utils'
import {
  useNotify,
} from '../../features/feature-pack/hooks'
import { ScopeLockNote } from '../../features/feature-pack/components'
import {
  cacheKeyFor, isActiveAssociation, normalizeError, roleLabel,
} from '../../features/feature-pack/utils'

/**
 * LaundrySwitcher — swap the active laundry for multi-laundry tenant users.
 *
 * Only shown when the session has multiple active laundries; platform admins and
 * support sessions do not use this control. Suspended/archived memberships are
 * listed but cannot be entered, and the last manual choice is remembered per
 * signed-in user so the menu can offer it again after a reload.
 */
export function LaundrySwitcher() {
  const { user, support, switchLaundry } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const notify = useNotify()
  const [switching, setSwitching] = useState(false)

  const lastKey = cacheKeyFor(user?.id, 'last-laundry')
  const [lastUsed, setLastUsed] = useState<string | null>(() => {
    try { return localStorage.getItem(lastKey) } catch { return null }
  })

  useEffect(() => {
    try { setLastUsed(localStorage.getItem(lastKey)) } catch { setLastUsed(null) }
  }, [lastKey])

  const memberships = useMemo(() => user?.laundries ?? [], [user?.laundries])

  if (
    !user ||
    support ||
    user.role_id === 'PLATFORM_ADMIN' ||
    memberships.length < 2
  ) {
    return null
  }

  const humanize = (slug: string) => slug.replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

  const switchTo = async (id: string) => {
    if (switching || id === user?.laundry_id) return
    setSwitching(true)
    try {
      // The token and user update inside AuthContext; the in-memory cache and
      // landing route follow without a full document reload.
      await switchLaundry(id)
      try { localStorage.setItem(lastKey, id) } catch { /* storage unavailable */ }
      setLastUsed(id)
      notify.success('Laundry switched')
      queryClient.clear()
      navigate('/', { replace: true })
    } catch (error) {
      notify.error(normalizeError(error, 'Failed to switch laundry'))
    } finally {
      setSwitching(false)
    }
  }

  const available = memberships.filter((entry) => isActiveAssociation(entry.status))
  const unavailable = memberships.filter((entry) => !isActiveAssociation(entry.status))
  const ordered = [
    ...available.filter((entry) => entry.id === lastUsed),
    ...available.filter((entry) => entry.id !== lastUsed),
    ...unavailable,
  ]

  const groups: MenuGroup[] = [
    {
      label: 'Laundries',
      items: ordered.map((entry) => {
        const canEnter = isActiveAssociation(entry.status)
        return {
          id: entry.id,
          label: humanize(entry.id),
          hint: !canEnter
            ? 'Unavailable'
            : entry.id === lastUsed && lastUsed !== user?.laundry_id
              ? 'Last used'
              : roleLabel(entry.role),
          selected: entry.id === user?.laundry_id,
          disabled: !canEnter || switching,
          onSelect: () => { void switchTo(entry.id) },
        }
      }),
    },
  ]

  if (lastUsed && available.some((entry) => entry.id === lastUsed) && lastUsed !== user?.laundry_id) {
    groups.unshift({
      label: 'Recent',
      items: [{
        id: `recent-${lastUsed}`,
        label: `Return to ${humanize(lastUsed)}`,
        icon: <History size={15} aria-hidden />,
        hint: 'Last used',
        onSelect: () => { void switchTo(lastUsed) },
      }],
    })
  }

  const activeLabel = user.laundry_id ? humanize(user.laundry_id) : 'Switch laundry'

  return (
    <DropdownMenu
      label="Laundry switcher"
      menuClassName="max-w-[min(300px,calc(100vw-16px))]"
      groups={groups}
      footer={unavailable.length > 0
        ? <ScopeLockNote label="Suspended laundries cannot be entered." />
        : undefined}
      trigger={(p) => (
        <button
          {...p}
          type="button"
          title={lastUsed ? `Switch active laundry · last used ${humanize(lastUsed)}` : 'Switch active laundry'}
          aria-label={`Switch active laundry, currently ${activeLabel}`}
          disabled={switching}
          className={cn(
            'flex h-8 max-w-[184px] items-center gap-1.5 rounded border px-2',
            'text-[12.5px] transition-colors duration-100 sm:max-w-[240px]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
            'border-[var(--border-2)] bg-[var(--surface)] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)]',
            switching && 'cursor-not-allowed opacity-60',
          )}
        >
          <Storefront size={15} aria-hidden className="shrink-0" />
          <span className="hidden shrink-0 text-[11px] font-semibold tracking-[0.03em] uppercase lg:inline">
            Laundry
          </span>
          <span className="min-w-0 truncate font-medium">{activeLabel}</span>
        </button>
      )}
    />
  )
}

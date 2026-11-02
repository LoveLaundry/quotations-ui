import type { LinenCustody, LinenTransition } from '../../../types/linen'

/**
 * Presentation for the custody groups the linen service reports.
 *
 * The server owns which actions exist and which side performs them; this file
 * only says what that looks like in this design system. Keeping it here rather
 * than in each page is what stops three screens from drifting apart, and it is
 * deliberately keyed by `custody` and not by action name — a new action needs
 * no frontend change.
 */
export const CUSTODY_TINT: Record<LinenCustody, string> = {
  hotel: '#2563EB',
  laundry: '#EA580C',
  exception: '#DC2626',
}

export const CUSTODY_LABEL: Record<LinenCustody, string> = {
  hotel: 'Hotel Hands',
  laundry: 'Laundry Hands',
  exception: 'Exceptions',
}

/** Group order for pickers and section headings. */
export const CUSTODY_ORDER: LinenCustody[] = ['hotel', 'laundry', 'exception']

export function flattenTransitions(groups: { transitions: LinenTransition[] }[] = []): LinenTransition[] {
  return groups.flatMap(group => group.transitions)
}

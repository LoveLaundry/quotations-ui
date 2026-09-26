/**
 * Reasons for a balance adjustment.
 *
 * A correction is always attributable, so the reason is mandatory. These are
 * the operational ways a recorded delivery turns out to be wrong — the list is
 * deliberately short so people pick the real cause rather than typing a novel.
 */
export const BALANCE_ADJUSTMENT_REASONS = [
    'PIECES_MISSING_IN_TRANSIT',
    'PIECES_DAMAGED_OR_SOILED',
    'OVER_RECORDED_DELIVERY',
    'UNDER_RECORDED_DELIVERY',
    'RETURNED_TO_GATE_PASS',
    'COUNTING_ERROR',
    'OTHER',
] as const

export type BalanceAdjustmentReason = (typeof BALANCE_ADJUSTMENT_REASONS)[number]

export function balanceAdjustmentReasonLabel(value: string): string {
    return value.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())
}

/**
 * Which way the balance moves, and why. The sign is never left to the user to
 * work out: picking a reason sets it, so a correction cannot be posted against
 * the client by accident.
 */
export function balanceAdjustmentDirection(
    reason: BalanceAdjustmentReason | '',
): 'credit' | 'debit' | null {
    switch (reason) {
        case 'PIECES_MISSING_IN_TRANSIT':
        case 'PIECES_DAMAGED_OR_SOILED':
        case 'UNDER_RECORDED_DELIVERY':
            return 'credit'
        case 'OVER_RECORDED_DELIVERY':
        case 'RETURNED_TO_GATE_PASS':
        case 'COUNTING_ERROR':
            return 'debit'
        default:
            return null
    }
}

export const BALANCE_ADJUSTMENT_DIRECTION_HINT: Record<string, string> = {
    credit: 'Client is owed these pieces — the balance goes up.',
    debit: 'These pieces are no longer outstanding — the balance goes down.',
}

/**
 * Reasons for voiding a correction.
 *
 * Voiding is not deleting: the original stays on record and stops counting.
 * That makes it the reversal path for a correction that was itself wrong, so
 * it needs its own reason.
 */
export const BALANCE_ADJUSTMENT_VOID_REASONS = [
    'RECORDING_ERROR',
    'WRONG_GATE_PASS',
    'WRONG_ITEM',
    'DUPLICATE',
    'OTHER',
] as const

export type BalanceAdjustmentVoidReason = (typeof BALANCE_ADJUSTMENT_VOID_REASONS)[number]

/**
 * Canonical per-item key, matching the backend's `name||spec` exactly.
 *
 * This must stay byte-identical to the service's `item_key`, or every balance
 * figure silently fails to line up with its row and the columns print blank.
 * Defined once here so the format has a single home.
 */
export function balanceItemKey(name: string, spec?: string | null): string {
    return `${name}||${spec ?? ''}`
}

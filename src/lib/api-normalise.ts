/**
 * Response-shape guards for list endpoints.
 *
 * The API is free to omit collections: a list endpoint can answer `null`
 * instead of `[]`, and an individual row can come back without its `items`
 * array. The declared types claim both are always present, so a missing
 * array reaches a render as `null.items` and takes the whole page down with
 * it rather than degrading to an empty list.
 *
 * Normalising here keeps those types honest for every consumer, instead of
 * relying on each page to remember a `?? []` at every single access.
 */

/** Coerces a list response to a real array, dropping any null rows. */
export function asList<T>(data: readonly (T | null | undefined)[] | null | undefined): T[] {
    return Array.isArray(data) ? data.filter((row): row is T => row != null) : []
}

/** As `asList`, and guarantees `items` is an array on every row. */
export function withItems<T extends { items?: unknown }>(data: T[] | null | undefined): T[] {
    return asList(data).map((row) => ({
        ...row,
        items: Array.isArray(row.items) ? row.items : [],
    }))
}

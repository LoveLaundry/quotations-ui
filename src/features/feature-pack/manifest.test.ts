import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  FEATURES, FEATURE_AREAS, FEATURE_COUNT, featureById, featuresByArea,
  searchFeatures,
} from './manifest'

const doc = readFileSync(new URL('../../../FEATURE_PACK.md', import.meta.url), 'utf8')
const entries = [...doc.matchAll(/^(\d+)\. \*\*(.+?)\*\* — (.+?) · `([^`]+)`$/gm)]

describe('feature manifest', () => {
  it('declares exactly 100 unique features with ids 1–100', () => {
    expect(FEATURE_COUNT).toBe(100)
    expect(FEATURES).toHaveLength(100)
    expect(FEATURES.map((feature) => feature.id)).toEqual(
      Array.from({ length: 100 }, (_, index) => index + 1),
    )
    expect(new Set(FEATURES.map((feature) => feature.title)).size).toBe(100)
    expect(FEATURES.every((feature) => feature.title.trim() && feature.description.trim() && feature.primaryFile.trim())).toBe(true)
    expect(FEATURES.every((feature) => FEATURE_AREAS.includes(feature.area))).toBe(true)
  })

  it('finds features by id, area and free-text query', () => {
    expect(featureById(1)?.title).toBe(FEATURES[0].title)
    expect(featureById(101)).toBeUndefined()
    expect(featuresByArea('table').length).toBeGreaterThan(0)
    expect(searchFeatures('').length).toBe(100)
    expect(searchFeatures('CSV export').map((feature) => feature.id)).toContain(22)
    expect(searchFeatures('quotation.service.ts').map((feature) => feature.id)).toEqual([95, 96])
    expect(searchFeatures('nothing-matches-this')).toEqual([])
  })

  it('keeps FEATURE_PACK.md in lockstep with the manifest', () => {
    expect(entries).toHaveLength(100)
    FEATURES.forEach((feature, index) => {
      const entry = entries[index]
      expect(entry[1]).toBe(String(feature.id))
      expect(entry[2]).toBe(feature.title)
      expect(entry[3]).toBe(feature.description)
      expect(entry[4]).toBe(feature.primaryFile)
    })
  })
})

import { describe, expect, it } from 'vitest'
import type { User } from '../types/auth'
import { accessSpecForPath } from '../config/route-meta'
import { canAccess, hasPermission, landingPathFor, type AccessSpec } from './access'

function user(role: string, overrides: Partial<User> = {}): User {
  return {
    id: `u-${role}`,
    user_name: role,
    auth_id: role.toLowerCase(),
    role_id: role,
    status: 'ACTIVE',
    ...overrides,
  }
}

function allowed(u: User, path: string, extra: AccessSpec = {}): boolean {
  return canAccess(u, { ...accessSpecForPath(path), ...extra })
}

describe('role capabilities', () => {
  it('gives full operations access to admins, managers and platform admins', () => {
    for (const role of ['ADMIN', 'MANAGER', 'PLATFORM_ADMIN']) {
      const u = user(role)
      expect(allowed(u, '/today')).toBe(true)
      expect(allowed(u, '/bills/new')).toBe(true)
      expect(allowed(u, '/linen/tags')).toBe(true)
    }
  })

  it('lets staff run the daily flow but not write bills or linen inventory', () => {
    const staff = user('STAFF')
    expect(allowed(staff, '/today')).toBe(true)
    expect(allowed(staff, '/gate-passes/new')).toBe(true)
    expect(allowed(staff, '/deliveries/new')).toBe(true)
    expect(allowed(staff, '/returns/new')).toBe(true)
    expect(allowed(staff, '/bills')).toBe(true)
    expect(allowed(staff, '/bills/:id')).toBe(true)
    expect(allowed(staff, '/today-sheet')).toBe(true)
    expect(allowed(staff, '/bills/new')).toBe(false)
    expect(allowed(staff, '/linen/tags')).toBe(false)
    expect(hasPermission(staff, 'manage_payments')).toBe(false)
  })

  it('keeps hotel and shop accounts out of tenant operations', () => {
    for (const role of ['HOTEL_ADMIN', 'HOTEL_MANAGER', 'SHOP_ADMIN', 'SHOP_STAFF']) {
      const u = user(role)
      expect(allowed(u, '/today')).toBe(false)
      expect(allowed(u, '/gate-passes')).toBe(false)
      expect(allowed(u, '/bills')).toBe(false)
      expect(allowed(u, '/profile')).toBe(true)
    }
  })

  it('accepts backend capability strings from explicit permissions', () => {
    const custom = user('CUSTOM', { permissions: JSON.stringify(['bill:read']) })
    expect(hasPermission(custom, 'view_bills')).toBe(true)
    expect(allowed(custom, '/bills')).toBe(true)
    expect(allowed(custom, '/bills/new')).toBe(false)
  })
})

describe('landing routes', () => {
  it('sends tenant operators to the daily hub', () => {
    for (const role of ['ADMIN', 'MANAGER', 'STAFF', 'PLATFORM_ADMIN']) {
      expect(landingPathFor(user(role))).toBe('/today')
    }
  })

  it('sends client account roles to the profile, not tenant operations', () => {
    expect(landingPathFor(user('HOTEL_ADMIN'))).toBe('/profile')
    expect(landingPathFor(user('SHOP_STAFF'))).toBe('/profile')
    expect(landingPathFor(null)).toBe('/login')
  })
})

describe('route metadata', () => {
  it('resolves detail and static paths to the right spec', () => {
    expect(accessSpecForPath('/bills/123').permissions).toEqual(['view_bills'])
    expect(accessSpecForPath('/bills/new').permissions).toEqual(['manage_bills'])
    expect(accessSpecForPath('/linen/scanner').permissions).toEqual(['scan_linen'])
    expect(accessSpecForPath('/profile')).toEqual({})
  })

  it('routes unauthenticated sessions to login', () => {
    expect(landingPathFor(null)).toBe('/login')
  })
})

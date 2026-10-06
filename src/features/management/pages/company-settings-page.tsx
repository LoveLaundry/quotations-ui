import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companySettingsApi } from '../api/management-api'
import { toast } from 'sonner'
import { Save, Settings, Zap } from 'lucide-react'
import { invalidateResource } from '../../../cache/invalidation'
import { useAuth } from '../../../context/AuthContext'
import { formatTimestamp, fromSriLankaDateTimeInput, toSriLankaDateTimeInput } from '../../../lib/time'

// Order follows JS Date.getDay(): 0=Sunday ... 6=Saturday.
const DOW_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Backend uses Python weekday(): 0=Monday ... 6=Sunday.
const pyToJs = (py: number) => (py + 1) % 7
const jsToPy = (js: number) => (js + 6) % 7

export default function CompanySettingsPage() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const isAdmin = user?.role_id?.toUpperCase() === 'ADMIN'
  const [form, setForm] = useState<any>(null)
  const [readingAt, setReadingAt] = useState(() => toSriLankaDateTimeInput())
  const [readingValues, setReadingValues] = useState<Record<string, string>>({
    meter_1: '',
    meter_2: '',
  })

  const { data: settings, isLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: () => companySettingsApi.get().then(r => r.data),
  })

  useEffect(() => {
    if (settings && !form) {
      setForm({
        company_name: settings.company_name || 'Love Laundry',
        salary_basis_days: settings.salary_basis_days ?? 30,
        working_days_per_week: settings.working_days_per_week ?? 6,
        working_days_pattern: (settings.working_days_pattern || [0, 1, 2, 3, 4, 5]).map(pyToJs),
        default_overtime_rate: settings.default_overtime_rate ?? 0,
        electricity_meter_1_name: settings.electricity_meter_1_name || 'Meter 1',
        electricity_meter_2_name: settings.electricity_meter_2_name || 'Meter 2',
      })
    }
  }, [settings, form])

  const saveMut = useMutation({
    mutationFn: (data: any) => companySettingsApi.update(data),
    onSuccess: () => {
      toast.success('Company settings saved')
      invalidateResource(qc, 'settings')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to save settings'),
  })

  const {
    data: meterReadings = [],
    isLoading: readingsLoading,
    isError: readingsError,
    refetch: refetchReadings,
  } = useQuery({
    queryKey: ['electricity-meter-readings'],
    queryFn: () => companySettingsApi.meterReadings().then(r => r.data),
  })

  const addReadingMut = useMutation({
    mutationFn: (data: {
      meter_id: 'meter_1' | 'meter_2'
      reading_value: number
      recorded_at: string
    }) => companySettingsApi.addMeterReading(data),
    onSuccess: (_response, variables) => {
      toast.success('Electricity reading saved')
      setReadingValues(current => ({ ...current, [variables.meter_id]: '' }))
      qc.invalidateQueries({ queryKey: ['electricity-meter-readings'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to save electricity reading'),
  })

  const toggleDow = (i: number) => {
    if (!form) return
    const pattern = form.working_days_pattern.includes(i)
      ? form.working_days_pattern.filter((x: number) => x !== i)
      : [...form.working_days_pattern, i].sort((a: number, b: number) => a - b)
    setForm({ ...form, working_days_pattern: pattern, working_days_per_week: pattern.length })
  }

  const handleSave = () => {
    const data = {
      ...form,
      working_days_pattern: (form.working_days_pattern || []).map(jsToPy),
    }
    if (!isAdmin) {
      delete data.electricity_meter_1_name
      delete data.electricity_meter_2_name
    }
    saveMut.mutate(data)
  }
  const meterNamesSaved =
    !!form &&
    !!settings &&
    form.electricity_meter_1_name === (settings.electricity_meter_1_name || 'Meter 1') &&
    form.electricity_meter_2_name === (settings.electricity_meter_2_name || 'Meter 2')

  if (isLoading || !form || !settings) {
    return <div className="text-center py-12 text-gray-400">Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Company Settings</h1>
        <button
          onClick={handleSave}
          disabled={saveMut.isPending}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50"
        >
          <Save size={16} /> {saveMut.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>

      <section className="bg-white dark:bg-gray-800 rounded-xl border p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap size={20} /> Electricity Meter Readings
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Record each meter reading with Sri Lanka date and time (LKT). Readings are retained for future electricity-cost calculations.
          </p>
        </div>

        {isAdmin ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['electricity_meter_1_name', 'electricity_meter_2_name'] as const).map((key, index) => (
              <label key={key} className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Meter {index + 1} name
                <input
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  maxLength={60}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                />
              </label>
            ))}
            <p className="md:col-span-2 text-xs text-gray-400">
              Save meter names with the main Save button. Only admins can configure meters or submit readings.
            </p>
          </div>
        ) : (
          <p className="rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
            Meter readings are visible here. An admin must add or configure readings.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['meter_1', 'meter_2'] as const).map((meterId, index) => {
            const name = form[index === 0 ? 'electricity_meter_1_name' : 'electricity_meter_2_name']
            return (
              <form
                key={meterId}
                onSubmit={e => {
                  e.preventDefault()
                  if (!isAdmin) return
                  const value = Number(readingValues[meterId])
                  if (!Number.isFinite(value) || value < 0) {
                    toast.error('Enter a valid non-negative meter reading')
                    return
                  }
                  try {
                    if (!readingAt) {
                      toast.error('Enter a Sri Lanka date and time')
                      return
                    }
                    addReadingMut.mutate({
                      meter_id: meterId,
                      reading_value: value,
                      recorded_at: fromSriLankaDateTimeInput(readingAt),
                    })
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Enter a valid date and time')
                  }
                }}
                className="rounded-lg border p-4 space-y-3"
              >
                <h3 className="font-medium">{name || `Meter ${index + 1}`}</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    disabled={!isAdmin}
                    value={readingValues[meterId]}
                    onChange={e => setReadingValues(current => ({ ...current, [meterId]: e.target.value }))}
                    placeholder="Meter reading"
                    aria-label={`${name || `Meter ${index + 1}`} reading`}
                    className="min-w-0 flex-1 px-3 py-2 border rounded-lg text-sm disabled:bg-gray-100 dark:disabled:bg-gray-700"
                  />
                  <button
                    type="submit"
                    disabled={!isAdmin || addReadingMut.isPending || !meterNamesSaved}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    {!isAdmin ? 'Admin required' : addReadingMut.isPending ? 'Saving…' : 'Save reading'}
                  </button>
                </div>
              </form>
            )
          })}
        </div>

        {isAdmin && (
          <>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Reading date and time (Sri Lanka)
              <input
                type="datetime-local"
                value={readingAt}
                onChange={e => setReadingAt(e.target.value)}
                className="block mt-1 px-3 py-2 border rounded-lg text-sm"
              />
            </label>
            {!meterNamesSaved && (
              <p className="text-xs text-amber-700">
                Save the meter names first before recording readings.
              </p>
            )}
          </>
        )}

        <div className="overflow-x-auto">
          <h3 className="font-medium mb-2">Recent readings</h3>
          {readingsLoading ? (
            <p className="text-sm text-gray-500 py-3">Loading readings…</p>
          ) : readingsError ? (
            <button type="button" onClick={() => refetchReadings()} className="text-sm text-red-600 py-3">
              Could not load readings — retry
            </button>
          ) : meterReadings.length === 0 ? (
            <p className="text-sm text-gray-500 py-3">No meter readings recorded yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">Meter</th>
                  <th className="py-2 pr-4">Reading (kWh)</th>
                  <th className="py-2">Date and time (LKT)</th>
                </tr>
              </thead>
              <tbody>
                {meterReadings.map((reading: any) => (
                  <tr key={reading.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{reading.meter_name}</td>
                    <td className="py-2 pr-4">{Number(reading.reading_value).toLocaleString()}</td>
                    <td className="py-2">{formatTimestamp(reading.recorded_at)} LKT</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <div className="bg-white dark:bg-gray-800 rounded-xl border p-6 space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Settings size={20} /> Payroll Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Company Name</label>
            <input
              value={form.company_name}
              onChange={e => setForm({ ...form, company_name: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Salary Basis Days (per month)</label>
            <input
              type="number"
              min="1"
              value={form.salary_basis_days}
              onChange={e => setForm({ ...form, salary_basis_days: Number(e.target.value) || 30 })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Monthly salary is divided by this to get the per-day rate.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Default Overtime Rate (LKR/hr)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.default_overtime_rate}
              onChange={e => setForm({ ...form, default_overtime_rate: Number(e.target.value) || 0 })}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Working Days ({form.working_days_per_week} of 7)
          </label>
          <div className="flex flex-wrap gap-2 mt-2">
            {DOW_LABELS.map((label, i) => {
              const active = form.working_days_pattern.includes(i)
              return (
                <button
                  key={i}
                  onClick={() => toggleDow(i)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                    active
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white dark:bg-gray-700 text-gray-500 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-1">Non-working days are skipped in salary calculation. Sundays and Saturdays follow your selection.</p>
        </div>
      </div>
    </div>
  )
}
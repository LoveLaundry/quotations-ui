import { useEffect, useState } from 'react'
import { TableEmptyRow } from '../../../components/ui/empty-state'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { reportsApi, customersApi } from '../api/management-api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Filter, Save, Pencil, Trash2, X } from 'lucide-react'
import { currentMonth, currentYear, todayISO } from '../../../lib/time'
import { useQuotations } from '../../quotations/hooks/useQuotations'
import { reports as operationsReports } from '../../quotations/services/reports.service'
import { toast } from 'sonner'

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
const LIST_LIMIT = 500

function PayrollBreakdown({ rows = [] }: { rows?: any[] }) {
  if (!rows.length) {
    return <p className="px-4 py-6 text-center text-sm text-gray-500">No payroll records for this period.</p>
  }

  const columns: [string, (row: any) => string | number][] = [
    ['Employee', row => row.employee_name || '—'],
    ['Pay type', row => row.salary_type || '—'],
    ['Calculation', row => row.calculation_method || '—'],
    ['Attendance', row => row.attendance_required ? 'Required' : 'Fixed'],
    ['Worked days', row => row.worked_days ?? 0],
    ['Absent days', row => row.absent_days ?? 0],
    ['Base pay', row => fmtMoney(row.base_salary_for_period)],
    ['Allowance', row => fmtMoney(row.allowance_for_period)],
    ['Overtime', row => fmtMoney(row.overtime_pay)],
    ['Extra work', row => fmtMoney(row.extra_work_total)],
    ['Bonus', row => fmtMoney(row.bonus)],
    ['Other pay', row => fmtMoney(row.other_payments)],
    ['Employee EPF', row => fmtMoney(row.epf_employee)],
    ['Employer EPF', row => fmtMoney(row.epf_employer)],
    ['Employer ETF', row => fmtMoney(row.etf_employer)],
    ['Deductions', row => fmtMoney(row.total_deductions)],
    ['Net salary', row => fmtMoney(row.net_salary)],
    ['Total salary expense', row => fmtMoney(row.salary_expense)],
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-375 text-sm">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>{columns.map(([label]) => <th key={label} className="px-3 py-2 text-left whitespace-nowrap">{label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.employee_id}-${row.period_start}-${index}`} className="border-t">
              {columns.map(([label, value]) => <td key={label} className="px-3 py-2 whitespace-nowrap">{value(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function fmtMoney(value: unknown): string {
  return `LKR ${Number(value || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function payrollRows(data: any): any[] {
  if (Array.isArray(data?.salary_period_details)) return data.salary_period_details
  return (data?.salary_expenses || []).flatMap((employee: any) => employee.periods || [])
}

export default function ManagementReports() {
  const [report, setReport] = useState('master')
  const [startDate, setStartDate] = useState(() => `${todayISO().slice(0, 7)}-01`)
  const [endDate, setEndDate] = useState(() => todayISO())
  const [dailyDate, setDailyDate] = useState(() => todayISO())
  const [selectedQuotations, setSelectedQuotations] = useState<Record<string, string | null>>({})
  const [savedReportTitle, setSavedReportTitle] = useState('')
  const [editingSavedReportId, setEditingSavedReportId] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState('')
  const [year, setYear] = useState(currentYear())
  const [month, setMonth] = useState(currentMonth())

  const { data: customersData = { items: [] } } = useQuery({
    queryKey: ['mgmt-customers-list'],
    queryFn: () => customersApi.list('', LIST_LIMIT, 0).then(r => r.data),
  })

  const customers = customersData.items
  const { data: quotations = [] } = useQuotations()
  const queryClient = useQueryClient()

  const { data: plData } = useQuery({
    queryKey: ['mgmt-pl-report', startDate, endDate, customerId],
    queryFn: () => reportsApi.profitLoss({ start_date: startDate, end_date: endDate, customer_id: customerId }).then(r => r.data),
    enabled: report === 'profit-loss',
  })

  const { data: dailyData } = useQuery({
    queryKey: ['mgmt-daily-report', dailyDate],
    queryFn: () => reportsApi.daily(dailyDate).then(r => r.data),
    enabled: report === 'daily',
  })

  const { data: monthlyData } = useQuery({
    queryKey: ['mgmt-monthly-report', year, month],
    queryFn: () => reportsApi.monthly(year, month).then(r => r.data),
    enabled: report === 'monthly',
  })

  const { data: masterData, isLoading: masterLoading, isError: masterError } = useQuery({
    queryKey: ['mgmt-master-report', startDate, endDate],
    queryFn: () => reportsApi.master({ start_date: startDate, end_date: endDate }).then(r => r.data),
    enabled: report === 'master' && Boolean(startDate && endDate),
  })

  const { data: operationsData, isLoading: operationsLoading, isError: operationsError } = useQuery({
    queryKey: ['monthly-operations-report', startDate, endDate, selectedQuotations],
    queryFn: () => operationsReports.monthlyOperations({
      start_date: startDate,
      end_date: endDate,
      selected_quotations: selectedQuotations,
    }),
    enabled: report === 'master' && Boolean(startDate && endDate),
  })

  const { data: savedReports = [] } = useQuery({
    queryKey: ['saved-master-reports'],
    queryFn: () => reportsApi.saved().then(r => r.data),
    enabled: report === 'master',
  })

  useEffect(() => {
    if (!operationsData?.hotels?.length) return
    setSelectedQuotations(current => {
      let changed = false
      const next = { ...current }
      for (const hotel of operationsData.hotels) {
        if (!(hotel.client_name in next)) {
          next[hotel.client_name] = hotel.suggested_quotation_id || null
          changed = true
        }
      }
      return changed ? next : current
    })
  }, [operationsData?.hotels])

  const { data: outstandingData = [] } = useQuery({
    queryKey: ['mgmt-outstanding'],
    queryFn: () => reportsApi.outstanding().then(r => r.data),
    enabled: report === 'outstanding',
  })

  const fmt = (n: number) => `LKR ${(n || 0).toLocaleString()}`

  const masterReportData = masterData && operationsData ? {
    ...masterData,
    ...operationsData,
    salary_expense_total: masterData.salary_expense_total,
    other_expense_total: masterData.other_expense_total,
    total_expenses: masterData.total_expenses,
    net_profit: Number(operationsData.total_income || 0) - Number(masterData.total_expenses || 0),
    salary_expenses: masterData.salary_expenses,
    salary_period_details: masterData.salary_period_details,
    other_expense_details: masterData.other_expense_details,
  } : null

  const saveCurrentReport = async () => {
    if (!masterReportData || !startDate || !endDate) return
    const payload = {
      title: savedReportTitle.trim() || `Operations report ${startDate} to ${endDate}`,
      start_date: startDate,
      end_date: endDate,
      selected_quotations: selectedQuotations,
      report_data: masterReportData,
    }
    try {
      if (editingSavedReportId) {
        await reportsApi.updateSaved(editingSavedReportId, payload)
        toast.success('Saved report updated')
      } else {
        await reportsApi.save(payload)
        toast.success('Report saved')
      }
      await queryClient.invalidateQueries({ queryKey: ['saved-master-reports'] })
    } catch {
      toast.error('Could not save report')
    }
  }

  const editSavedReport = (saved: any) => {
    setEditingSavedReportId(saved.id)
    setSavedReportTitle(saved.title || '')
    setStartDate(saved.start_date)
    setEndDate(saved.end_date)
    setSelectedQuotations(saved.selected_quotations || {})
    setReport('master')
  }

  const deleteSavedReport = async (id: string) => {
    try {
      await reportsApi.deleteSaved(id)
      await queryClient.invalidateQueries({ queryKey: ['saved-master-reports'] })
      if (editingSavedReportId === id) setEditingSavedReportId(null)
      toast.success('Saved report deleted')
    } catch {
      toast.error('Could not delete report')
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>

      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'master', label: 'Master Report' },
          { id: 'profit-loss', label: 'Profit & Loss' },
          { id: 'daily', label: 'Daily Report' },
          { id: 'monthly', label: 'Monthly Report' },
          { id: 'outstanding', label: 'Outstanding Payments' },
        ].map(r => (
          <button key={r.id} onClick={() => setReport(r.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${report === r.id ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200'}`}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-end bg-white dark:bg-gray-800 rounded-xl border p-4">
        <Filter size={16} className="text-gray-400" />
        {(report === 'profit-loss' || report === 'master') && <>
          <div>
            <label className="text-xs text-gray-500">From</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="block px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">To</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="block px-3 py-2 border rounded-lg text-sm" />
          </div>
        </>}
        {report === 'profit-loss' && <div>
          <label className="text-xs text-gray-500">Customer</label>
          <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="block px-3 py-2 border rounded-lg text-sm">
            <option value="">All Customers</option>
            {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>}
        {report === 'daily' && <div>
          <label className="text-xs text-gray-500">Report date</label>
          <input type="date" value={dailyDate} onChange={e => setDailyDate(e.target.value)} className="block px-3 py-2 border rounded-lg text-sm" />
        </div>}
        {report === 'monthly' && (
          <>
            <div>
              <label className="text-xs text-gray-500">Month</label>
              <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="block px-3 py-2 border rounded-lg text-sm">
                {Array.from({length:12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0,i).toLocaleString('default',{month:'long'})}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Year</label>
              <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} className="block px-3 py-2 border rounded-lg text-sm w-24" />
            </div>
          </>
        )}
      </div>

      {/* Profit & Loss */}
      {report === 'profit-loss' && plData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-xl font-bold text-green-600">{fmt(plData.total_revenue)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
              <p className="text-sm text-gray-500">Cost of Goods</p>
              <p className="text-xl font-bold text-orange-600">{fmt(plData.total_cogs)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
              <p className="text-sm text-gray-500">Gross Profit</p>
              <p className="text-xl font-bold">{fmt(plData.gross_profit)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
              <p className="text-sm text-gray-500">Net Profit</p>
              <p className={`text-xl font-bold ${plData.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(plData.net_profit)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border p-5">
              <h3 className="font-semibold mb-3">Revenue by Customer</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={plData.revenue_by_customer || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip formatter={(v: number) => `LKR ${v.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border p-5">
              <h3 className="font-semibold mb-3">Revenue by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={plData.revenue_by_category || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {(plData.revenue_by_category || []).map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `LKR ${v.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border p-5">
            <h3 className="font-semibold mb-3">Expense Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(plData.expenses_by_category || []).map((e: any, i: number) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-sm text-gray-500">{e.name}</p>
                  <p className="font-semibold">{fmt(e.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Daily Report */}
      {report === 'daily' && dailyData && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Daily Report - {dailyData.date}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-sm text-gray-500">Transactions</p><p className="text-xl font-bold">{dailyData.transactions}</p></div>
              <div><p className="text-sm text-gray-500">Total Quantity</p><p className="text-xl font-bold">{dailyData.total_quantity}</p></div>
              <div><p className="text-sm text-gray-500">Revenue</p><p className="text-xl font-bold text-green-600">{fmt(dailyData.total_revenue)}</p></div>
              <div><p className="text-sm text-gray-500">Gross Profit</p><p className="text-xl font-bold">{fmt(dailyData.gross_profit)}</p></div>
              <div><p className="text-sm text-gray-500">Salary Expense</p><p className="text-xl font-bold">{fmt(dailyData.salary_expense_total)}</p></div>
              <div><p className="text-sm text-gray-500">Other Expenses</p><p className="text-xl font-bold">{fmt(dailyData.other_expense_total)}</p></div>
              <div><p className="text-sm text-gray-500">Total Expenses</p><p className="text-xl font-bold">{fmt(dailyData.total_expenses)}</p></div>
              <div><p className="text-sm text-gray-500">Net Profit</p><p className={`text-xl font-bold ${dailyData.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(dailyData.net_profit)}</p></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-5 space-y-3">
            <h3 className="font-semibold">Employee salary details</h3>
            <PayrollBreakdown rows={payrollRows(dailyData)} />
          </div>
        </div>
      )}

      {/* Monthly Report */}
      {report === 'monthly' && monthlyData && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Monthly Report - {monthlyData.year}-{String(monthlyData.month).padStart(2, '0')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-sm text-gray-500">Transactions</p><p className="text-xl font-bold">{monthlyData.transactions}</p></div>
              <div><p className="text-sm text-gray-500">Total Quantity</p><p className="text-xl font-bold">{monthlyData.total_quantity}</p></div>
              <div><p className="text-sm text-gray-500">Revenue</p><p className="text-xl font-bold text-green-600">{fmt(monthlyData.total_revenue)}</p></div>
              <div><p className="text-sm text-gray-500">Gross Profit</p><p className="text-xl font-bold">{fmt(monthlyData.gross_profit)}</p></div>
              <div><p className="text-sm text-gray-500">Salary Expense</p><p className="text-xl font-bold">{fmt(monthlyData.salary_expense_total)}</p></div>
              <div><p className="text-sm text-gray-500">Other Expenses</p><p className="text-xl font-bold">{fmt(monthlyData.other_expense_total)}</p></div>
              <div><p className="text-sm text-gray-500">Total Expenses</p><p className="text-xl font-bold">{fmt(monthlyData.total_expenses)}</p></div>
              <div><p className="text-sm text-gray-500">Net Profit</p><p className={`text-xl font-bold ${monthlyData.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(monthlyData.net_profit)}</p></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-5 space-y-3">
            <h3 className="font-semibold">Employee salary details</h3>
            <PayrollBreakdown rows={payrollRows(monthlyData)} />
          </div>
          {monthlyData.revenue_by_customer?.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Revenue by Customer</h3>
              <div className="overflow-x-auto">
              <table className="w-full min-w-90 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr><th className="px-3 py-2 text-left">Customer</th><th className="px-3 py-2 text-right">Revenue</th></tr>
                </thead>
                <tbody>
                  {monthlyData.revenue_by_customer.map((c: any, i: number) => (
                    <tr key={i} className="border-t"><td className="px-3 py-2">{c.name}</td><td className="px-3 py-2 text-right">{fmt(c.value)}</td></tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      )}

      {report === 'master' && (
        !startDate || !endDate ? (
          <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500 dark:bg-gray-800">
            Select a start and end date to load the master report.
          </div>
        ) : masterLoading ? (
          <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500 dark:bg-gray-800">Loading report…</div>
        ) : operationsLoading ? (
          <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500 dark:bg-gray-800">Loading confirmed receiving records…</div>
        ) : masterError || operationsError ? (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center text-sm text-red-600 dark:bg-gray-800" role="alert">
            Unable to load the report. Check the date range and management and bill services.
          </div>
        ) : masterReportData && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-white p-4 dark:bg-gray-800">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Quotation pricing by hotel</h2>
                  <p className="mt-1 text-xs text-gray-500">Choose the contract used to price confirmed receiving items for each hotel.</p>
                </div>
              </div>
              {operationsData.hotels?.length ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {operationsData.hotels.map((hotel: any) => {
                    const hotelQuotations = quotations.filter((quotation: any) =>
                      String(quotation.client_name || '').trim().toLocaleLowerCase()
                        === String(hotel.client_name || '').trim().toLocaleLowerCase(),
                    )
                    return (
                      <label key={hotel.client_name} className="min-w-0">
                        <span className="mb-1 block truncate text-xs font-medium text-gray-600 dark:text-gray-300" title={hotel.client_name}>{hotel.client_name}</span>
                        <select
                          value={selectedQuotations[hotel.client_name] || ''}
                          onChange={event => setSelectedQuotations(current => ({
                            ...current,
                            [hotel.client_name]: event.target.value || null,
                          }))}
                          className="block h-10 w-full rounded-lg border bg-white px-3 text-sm dark:bg-gray-900"
                        >
                          <option value="">No quotation selected</option>
                          {hotelQuotations.map((quotation: any) => (
                            <option key={String(quotation.id)} value={String(quotation.id)}>
                              {quotation.quotation_title || `Quotation ${quotation.id}`}
                            </option>
                          ))}
                        </select>
                        {!hotelQuotations.length && <span className="mt-1 block text-xs text-amber-700">No quotation found for this hotel.</span>}
                      </label>
                    )
                  })}
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-gray-500">No confirmed receiving entries in this period.</p>
              )}
            </div>

            <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4 dark:bg-gray-800">
              <label className="min-w-55 flex-1">
                <span className="mb-1 block text-xs text-gray-500">Saved report name</span>
                <input value={savedReportTitle} onChange={event => setSavedReportTitle(event.target.value)} maxLength={120}
                  placeholder={`Operations report ${startDate} to ${endDate}`}
                  className="h-10 w-full rounded-lg border bg-white px-3 text-sm dark:bg-gray-900" />
              </label>
              <button type="button" onClick={saveCurrentReport} disabled={!masterReportData}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
                <Save size={15} />{editingSavedReportId ? 'Update saved report' : 'Save report'}
              </button>
              {editingSavedReportId && <button type="button" title="Stop editing this saved report" onClick={() => setEditingSavedReportId(null)} className="inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm"><X size={15} />Cancel edit</button>}
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ['Gate pass income', masterReportData.total_income, 'text-green-600'],
                ['Salary expense', masterReportData.salary_expense_total, ''],
                ['Other expenses', masterReportData.other_expense_total, ''],
                ['Total expenses', masterReportData.total_expenses, ''],
                ['Net profit', masterReportData.net_profit, masterReportData.net_profit >= 0 ? 'text-green-600' : 'text-red-600'],
              ].map(([label, amount, color]) => (
                <div key={String(label)} className="rounded-xl border bg-white p-4 dark:bg-gray-800">
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{fmt(Number(amount))}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="overflow-hidden rounded-xl border bg-white dark:bg-gray-800">
                <h3 className="border-b px-4 py-3 font-semibold">Income by hotel</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-130 text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-3 py-2 text-left">Hotel</th><th className="px-3 py-2 text-right">Receiving days</th><th className="px-3 py-2 text-right">Quantity</th><th className="px-3 py-2 text-right">Income</th></tr></thead>
                    <tbody>{(masterReportData.hotel_summary || []).map((row: any) => <tr key={row.client_name} className="border-t"><td className="px-3 py-2">{row.client_name}</td><td className="px-3 py-2 text-right">{row.confirmed_days}</td><td className="px-3 py-2 text-right">{row.quantity}</td><td className="px-3 py-2 text-right">{fmt(row.income)}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border bg-white dark:bg-gray-800">
                <h3 className="border-b px-4 py-3 font-semibold">Income by item</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-115 text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-right">Quantity</th><th className="px-3 py-2 text-right">Hotels</th><th className="px-3 py-2 text-right">Income</th></tr></thead>
                    <tbody>{(masterReportData.item_summary || []).map((row: any) => <tr key={`${row.item_name}-${row.specification}`} className="border-t"><td className="px-3 py-2">{row.item_name}{row.specification ? ` · ${row.specification}` : ''}</td><td className="px-3 py-2 text-right">{row.quantity}</td><td className="px-3 py-2 text-right">{row.hotel_count}</td><td className="px-3 py-2 text-right">{fmt(row.income)}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border bg-white dark:bg-gray-800">
              <h3 className="border-b px-4 py-3 font-semibold">Employee salary detail</h3>
              <PayrollBreakdown rows={payrollRows(masterReportData)} />
            </div>

            {masterReportData.unpriced_count > 0 && <div className="overflow-hidden rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30">
              <h3 className="border-b border-amber-200 px-4 py-3 font-semibold text-amber-900 dark:text-amber-200">Unpriced receiving items ({masterReportData.unpriced_count})</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-620 text-sm">
                  <thead><tr><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Hotel</th><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-right">Quantity</th></tr></thead>
                  <tbody>{masterReportData.unpriced_items.map((row: any, index: number) => <tr key={`${row.date}-${row.client_name}-${row.item_name}-${index}`} className="border-t border-amber-200"><td className="px-3 py-2">{row.date}</td><td className="px-3 py-2">{row.client_name}</td><td className="px-3 py-2">{row.item_name}{row.specification ? ` · ${row.specification}` : ''}</td><td className="px-3 py-2 text-right">{row.quantity}</td></tr>)}</tbody>
                </table>
              </div>
            </div>}

            <div className="overflow-hidden rounded-xl border bg-white dark:bg-gray-800">
              <h3 className="border-b px-4 py-3 font-semibold">Daily receiving linen detail</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-620 text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Hotel</th><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-left">Specification</th><th className="px-3 py-2 text-right">Received</th><th className="px-3 py-2 text-left">Unit</th><th className="px-3 py-2 text-right">Pieces</th><th className="px-3 py-2 text-right">Unit price</th><th className="px-3 py-2 text-right">Income</th></tr></thead>
                  <tbody>{(masterReportData.daily_details || []).flatMap((day: any) => day.items.map((item: any, index: number) => <tr key={`${day.date}-${day.client_name}-${item.item_name}-${item.specification}-${index}`} className="border-t"><td className="px-3 py-2 whitespace-nowrap">{day.date}</td><td className="px-3 py-2">{day.client_name}</td><td className="px-3 py-2">{item.item_name}</td><td className="px-3 py-2">{item.specification || '—'}</td><td className="px-3 py-2 text-right">{item.quantity}</td><td className="px-3 py-2">{item.unit}</td><td className="px-3 py-2 text-right">{item.piece_count}</td><td className="px-3 py-2 text-right">{fmt(item.unit_price)}</td><td className="px-3 py-2 text-right">{fmt(item.income)}</td></tr>))}</tbody>
                </table>
                {!masterReportData.daily_details?.some((day: any) => day.items.length > 0) && <p className="px-4 py-5 text-center text-sm text-gray-500">No confirmed receiving quantities in this period.</p>}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border bg-white dark:bg-gray-800">
              <h3 className="border-b px-4 py-3 font-semibold">Other expense detail</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-155 text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Category</th><th className="px-3 py-2 text-left">Description</th><th className="px-3 py-2 text-left">Payment</th><th className="px-3 py-2 text-right">Amount</th></tr></thead>
                  <tbody>{(masterReportData.other_expense_details || []).map((row: any, index: number) => <tr key={row.id || index} className="border-t"><td className="px-3 py-2">{row.date || '—'}</td><td className="px-3 py-2">{row.category_name || row.category_id || 'Uncategorized'}</td><td className="px-3 py-2">{row.description || '—'}</td><td className="px-3 py-2">{row.payment_method || '—'}</td><td className="px-3 py-2 text-right">{fmt(row.amount)}</td></tr>)}</tbody>
                </table>
                {!masterReportData.other_expense_details?.length && <p className="px-4 py-5 text-center text-sm text-gray-500">No other expenses in this period.</p>}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border bg-white dark:bg-gray-800">
              <h3 className="border-b px-4 py-3 font-semibold">Saved reports</h3>
              {savedReports.length ? <div className="divide-y">
                {savedReports.map((saved: any) => (
                  <div key={saved.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{saved.title}</p>
                      <p className="text-xs text-gray-500">{saved.start_date} to {saved.end_date} · {fmt(saved.report_data?.total_income || 0)} income</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" title="Load and edit this report" onClick={() => editSavedReport(saved)} className="rounded-md border p-2 hover:bg-gray-50 dark:hover:bg-gray-700"><Pencil size={14} /></button>
                      <button type="button" title="Delete saved report" onClick={() => deleteSavedReport(saved.id)} className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div> : <p className="px-4 py-5 text-center text-sm text-gray-500">No saved reports.</p>}
            </div>
          </div>
        )
      )}

      {/* Outstanding */}
      {report === 'outstanding' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Outstanding Payments</h2>
          <div className="overflow-x-auto">
          <table className="w-full min-w-140 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left">Customer</th>
                <th className="px-3 py-2 text-right">Total Billed</th>
                <th className="px-3 py-2 text-right">Total Paid</th>
                <th className="px-3 py-2 text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {outstandingData.map((o: any, i: number) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2 font-medium">{o.customer_name}</td>
                  <td className="px-3 py-2 text-right">{fmt(o.total_billed)}</td>
                  <td className="px-3 py-2 text-right">{fmt(o.total_paid)}</td>
                  <td className="px-3 py-2 text-right font-bold text-red-600">{fmt(o.outstanding)}</td>
                </tr>
              ))}
              {outstandingData.length === 0 && (
                <TableEmptyRow colSpan={4} title="No outstanding payments" description="Every client is settled up." />
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}

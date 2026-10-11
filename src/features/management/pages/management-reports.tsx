import { useState } from 'react'
import { TableEmptyRow } from '../../../components/ui/empty-state'
import { useQuery } from '@tanstack/react-query'
import { reportsApi, customersApi } from '../api/management-api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Filter } from 'lucide-react'
import { currentMonth, currentYear, todayISO } from '../../../lib/time'

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
  const [report, setReport] = useState('profit-loss')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dailyDate, setDailyDate] = useState(() => todayISO())
  const [customerId, setCustomerId] = useState('')
  const [year, setYear] = useState(currentYear())
  const [month, setMonth] = useState(currentMonth())

  const { data: customersData = { items: [] } } = useQuery({
    queryKey: ['mgmt-customers-list'],
    queryFn: () => customersApi.list('', LIST_LIMIT, 0).then(r => r.data),
  })

  const customers = customersData.items

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

  const { data: outstandingData = [] } = useQuery({
    queryKey: ['mgmt-outstanding'],
    queryFn: () => reportsApi.outstanding().then(r => r.data),
    enabled: report === 'outstanding',
  })

  const fmt = (n: number) => `LKR ${(n || 0).toLocaleString()}`

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
        ) : masterError ? (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center text-sm text-red-600 dark:bg-gray-800" role="alert">
            Unable to load the master report. Check the date range and management service connection.
          </div>
        ) : masterData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ['Gate pass income', masterData.total_income, 'text-green-600'],
                ['Salary expense', masterData.salary_expense_total, ''],
                ['Other expenses', masterData.other_expense_total, ''],
                ['Total expenses', masterData.total_expenses, ''],
                ['Net profit', masterData.net_profit, masterData.net_profit >= 0 ? 'text-green-600' : 'text-red-600'],
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
                    <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-3 py-2 text-left">Hotel</th><th className="px-3 py-2 text-right">Gate passes</th><th className="px-3 py-2 text-right">Quantity</th><th className="px-3 py-2 text-right">Income</th></tr></thead>
                    <tbody>{(masterData.hotel_summary || []).map((row: any) => <tr key={row.client_name} className="border-t"><td className="px-3 py-2">{row.client_name}</td><td className="px-3 py-2 text-right">{row.gate_pass_count}</td><td className="px-3 py-2 text-right">{row.quantity}</td><td className="px-3 py-2 text-right">{fmt(row.income)}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border bg-white dark:bg-gray-800">
                <h3 className="border-b px-4 py-3 font-semibold">Income by item</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-115 text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-3 py-2 text-left">Item</th><th className="px-3 py-2 text-right">Quantity</th><th className="px-3 py-2 text-right">Hotels</th><th className="px-3 py-2 text-right">Income</th></tr></thead>
                    <tbody>{(masterData.item_summary || []).map((row: any) => <tr key={row.item_name} className="border-t"><td className="px-3 py-2">{row.item_name}</td><td className="px-3 py-2 text-right">{row.quantity}</td><td className="px-3 py-2 text-right">{row.hotel_count}</td><td className="px-3 py-2 text-right">{fmt(row.income)}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border bg-white dark:bg-gray-800">
              <h3 className="border-b px-4 py-3 font-semibold">Employee salary detail</h3>
              <PayrollBreakdown rows={payrollRows(masterData)} />
            </div>

            <div className="overflow-hidden rounded-xl border bg-white dark:bg-gray-800">
              <h3 className="border-b px-4 py-3 font-semibold">Other expense detail</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-155 text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700"><tr><th className="px-3 py-2 text-left">Date</th><th className="px-3 py-2 text-left">Category</th><th className="px-3 py-2 text-left">Description</th><th className="px-3 py-2 text-left">Payment</th><th className="px-3 py-2 text-right">Amount</th></tr></thead>
                  <tbody>{(masterData.other_expense_details || []).map((row: any, index: number) => <tr key={row.id || index} className="border-t"><td className="px-3 py-2">{row.date || '—'}</td><td className="px-3 py-2">{row.category_name || row.category_id || 'Uncategorized'}</td><td className="px-3 py-2">{row.description || '—'}</td><td className="px-3 py-2">{row.payment_method || '—'}</td><td className="px-3 py-2 text-right">{fmt(row.amount)}</td></tr>)}</tbody>
                </table>
                {!masterData.other_expense_details?.length && <p className="px-4 py-5 text-center text-sm text-gray-500">No other expenses in this period.</p>}
              </div>
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

import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/management-api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Users, Package, Wallet, AlertCircle, DollarSign, ShoppingCart } from 'lucide-react'

function StatCard({ title, value, icon: Icon, color, sub }: { title: string; value: string; icon: any; color: string; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border p-5 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export default function ManagementDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['mgmt-dashboard'],
    queryFn: () => dashboardApi.get().then(r => r.data),
  })

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>

  const d = data || {}
  const fmt = (n: number) => `Rs. ${(n || 0).toLocaleString()}`

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Management Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Revenue" value={fmt(d.today_revenue)} icon={DollarSign} color="bg-green-500" />
        <StatCard title="Monthly Revenue" value={fmt(d.month_revenue)} icon={TrendingUp} color="bg-blue-500" />
        <StatCard title="6-Month Revenue" value={fmt(d.six_month_revenue)} icon={ShoppingCart} color="bg-purple-500" />
        <StatCard title="Net Profit" value={fmt(d.net_profit)} icon={Wallet} color={d.net_profit >= 0 ? 'bg-emerald-500' : 'bg-red-500'} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Pieces" value={(d.total_pieces || 0).toLocaleString()} icon={Package} color="bg-amber-500" />
        <StatCard title="Customers" value={String(d.total_customers || 0)} icon={Users} color="bg-indigo-500" />
        <StatCard title="Total Expenses" value={fmt(d.total_expenses)} icon={TrendingDown} color="bg-orange-500" />
        <StatCard title="Outstanding" value={fmt(d.outstanding_payments)} icon={AlertCircle} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-5">
          <h3 className="font-semibold mb-4">Revenue & Expenses (6 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={d.monthly_revenue || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v: number) => `Rs. ${v.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="revenue" fill="#22c55e" name="Revenue" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border p-5">
          <h3 className="font-semibold mb-4">Profit Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={d.monthly_profit || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v: number) => `Rs. ${v.toLocaleString()}`} />
              <Line type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-5">
          <h3 className="font-semibold mb-4">Top Customers</h3>
          <div className="space-y-3">
            {(d.top_customers || []).map((c: any, i: number) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm">{c.name}</span>
                <span className="text-sm font-medium">{fmt(c.revenue)}</span>
              </div>
            ))}
            {(!d.top_customers || d.top_customers.length === 0) && <p className="text-sm text-gray-400">No data yet</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border p-5">
          <h3 className="font-semibold mb-4">Top Items</h3>
          <div className="space-y-3">
            {(d.top_items || []).map((c: any, i: number) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm">{c.name}</span>
                <span className="text-sm font-medium">{fmt(c.revenue)}</span>
              </div>
            ))}
            {(!d.top_items || d.top_items.length === 0) && <p className="text-sm text-gray-400">No data yet</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border p-5">
          <h3 className="font-semibold mb-4">Expense Breakdown</h3>
          <div className="space-y-3">
            {(d.expense_breakdown || []).map((e: any, i: number) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm">{e.category}</span>
                <span className="text-sm font-medium">{fmt(e.amount)}</span>
              </div>
            ))}
            {(!d.expense_breakdown || d.expense_breakdown.length === 0) && <p className="text-sm text-gray-400">No expenses yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

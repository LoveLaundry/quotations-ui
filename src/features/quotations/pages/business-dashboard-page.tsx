import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface DashboardData {
  period: string
  generated_at: string
  financial: {
    total_revenue: number
    total_paid: number
    total_outstanding: number
    collection_rate: number
    avg_bill_value: number
    total_bills: number
    paid_bills: number
    pending_bills: number
  }
  operations: {
    gate_passes_processed: number
    total_items_received: number
    total_items_delivered: number
    pending_items: number
    avg_turnaround_hours: number
    delivery_fulfillment_rate: number
    inventory_turnover: number
  }
  quality: {
    mismatch_count: number
    mismatch_rate: number
    total_items_checked: number
  }
  clients: {
    active_clients: number
    total_clients: number
    client_retention_rate: number
    new_clients_this_period: number
  }
  trends: {
    revenue_by_date: Array<{ date: string; revenue: number }>
    top_clients: Array<{ client_name: string; revenue: number }>
  }
  alerts: {
    count: number
    items: Array<{
      type: string
      severity: 'high' | 'medium' | 'low'
      message: string
      value: number
    }>
  }
}

export default function BusinessDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    fetchDashboardData()
  }, [period])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${import.meta.env.VITE_BILL_SERVICE_URL || 'http://localhost:8001'}/dashboard/overview?period=${period}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-LK').format(value)
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-5 pb-8">
        <div>
          <h1 className="text-dashboard-title">Business Dashboard</h1>
          <p className="text-page-subtitle">Loading comprehensive business metrics...</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  const getStatusColor = (value: number, threshold: number, inverse = false) => {
    const isGood = inverse ? value < threshold : value > threshold
    return isGood ? 'text-green-600' : 'text-red-600'
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  return (
    <div className="space-y-5 pb-8 select-none">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 mb-1.5">
            <Activity className="h-4 w-4 text-green-500" />
            <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-wide text-[#6B7280]">
              Live Business Intelligence
            </p>
          </div>
          <h1 className="text-dashboard-title">Business Dashboard</h1>
          <p className="text-page-subtitle">
            Comprehensive metrics and KPIs for data-driven decisions
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {(['day', 'week', 'month', 'quarter', 'year'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                period === p
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {data.alerts.count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {data.alerts.items.map((alert, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-4 rounded-lg border ${getAlertColor(alert.severity)}`}
            >
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold">{alert.message}</p>
                <p className="text-xs mt-1 opacity-80">
                  {alert.severity.toUpperCase()} · Action recommended
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Financial Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Financial Performance
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(data.financial.total_revenue)}
            icon={<DollarSign className="h-5 w-5 text-green-600" />}
            trend={data.financial.total_revenue > 0 ? 'up' : 'neutral'}
          />
          <MetricCard
            title="Collection Rate"
            value={`${data.financial.collection_rate.toFixed(1)}%`}
            subtitle="of revenue collected"
            icon={<CheckCircle className="h-5 w-5 text-blue-600" />}
            trend={data.financial.collection_rate > 70 ? 'up' : 'down'}
            status={getStatusColor(data.financial.collection_rate, 70)}
          />
          <MetricCard
            title="Outstanding"
            value={formatCurrency(data.financial.total_outstanding)}
            subtitle={`${data.financial.pending_bills} pending bills`}
            icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
            trend={data.financial.total_outstanding > 0 ? 'down' : 'neutral'}
          />
          <MetricCard
            title="Avg Bill Value"
            value={formatCurrency(data.financial.avg_bill_value)}
            subtitle={`${data.financial.total_bills} total bills`}
            icon={<BarChart3 className="h-5 w-5 text-purple-600" />}
            trend="neutral"
          />
        </div>
      </div>

      {/* Operational Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          Operations & Efficiency
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Items Processed"
            value={formatNumber(data.operations.total_items_received)}
            subtitle={`${formatNumber(data.operations.total_items_delivered)} delivered`}
            icon={<Package className="h-5 w-5 text-blue-600" />}
            trend="up"
          />
          <MetricCard
            title="Turnaround Time"
            value={`${data.operations.avg_turnaround_hours.toFixed(1)}h`}
            subtitle="receiving to delivery"
            icon={<Clock className="h-5 w-5 text-indigo-600" />}
            trend={data.operations.avg_turnaround_hours < 72 ? 'up' : 'down'}
            status={getStatusColor(data.operations.avg_turnaround_hours, 72, true)}
          />
          <MetricCard
            title="Fulfillment Rate"
            value={`${data.operations.delivery_fulfillment_rate.toFixed(1)}%`}
            subtitle={`${data.operations.pending_items} items pending`}
            icon={<TrendingUp className="h-5 w-5 text-green-600" />}
            trend={data.operations.delivery_fulfillment_rate > 90 ? 'up' : 'down'}
            status={getStatusColor(data.operations.delivery_fulfillment_rate, 90)}
          />
          <MetricCard
            title="Inventory Turnover"
            value={data.operations.inventory_turnover.toFixed(2)}
            subtitle={`${data.operations.gate_passes_processed} gate passes`}
            icon={<Activity className="h-5 w-5 text-teal-600" />}
            trend={data.operations.inventory_turnover > 5 ? 'up' : 'neutral'}
          />
        </div>
      </div>

      {/* Quality & Client Metrics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Quality Metrics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              title="Mismatch Rate"
              value={`${data.quality.mismatch_rate.toFixed(2)}%`}
              subtitle={`${data.quality.mismatch_count} errors`}
              icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
              trend={data.quality.mismatch_rate < 5 ? 'up' : 'down'}
              status={getStatusColor(data.quality.mismatch_rate, 5, true)}
            />
            <MetricCard
              title="Items Checked"
              value={formatNumber(data.quality.total_items_checked)}
              subtitle="quality inspections"
              icon={<CheckCircle className="h-5 w-5 text-green-600" />}
              trend="up"
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Client Metrics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              title="Active Clients"
              value={formatNumber(data.clients.active_clients)}
              subtitle={`of ${data.clients.total_clients} total`}
              icon={<Users className="h-5 w-5 text-purple-600" />}
              trend="up"
            />
            <MetricCard
              title="Retention Rate"
              value={`${data.clients.client_retention_rate.toFixed(1)}%`}
              subtitle="last 90 days"
              icon={<TrendingUp className="h-5 w-5 text-green-600" />}
              trend={data.clients.client_retention_rate > 80 ? 'up' : 'down'}
              status={getStatusColor(data.clients.client_retention_rate, 80)}
            />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.trends.revenue_by_date}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  stroke="#888"
                  fontSize={12}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${date.getMonth() + 1}/${date.getDate()}`
                  }}
                />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#DC2626"
                  strokeWidth={2}
                  dot={{ fill: '#DC2626', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Clients by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.trends.top_clients} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#888" fontSize={12} />
                <YAxis
                  dataKey="client_name"
                  type="category"
                  stroke="#888"
                  fontSize={11}
                  width={120}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="revenue" fill="#DC2626" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  trend: 'up' | 'down' | 'neutral'
  status?: string
}

function MetricCard({ title, value, subtitle, icon, trend, status }: MetricCardProps) {
  const trendIcon =
    trend === 'up' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : trend === 'down' ? (
      <TrendingDown className="h-4 w-4 text-red-600" />
    ) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
        {trendIcon && <div className="p-1">{trendIcon}</div>}
      </div>
      <p className="text-xs text-gray-600 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${status || 'text-gray-900'}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </motion.div>
  )
}

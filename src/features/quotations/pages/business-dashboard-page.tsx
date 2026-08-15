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
} from 'recharts'
import billsApi from '../../../api/bills-api'

interface Bill {
  _id: string
  bill_number: string
  client_id: string
  client_name: string
  total_amount: number
  paid_amount: number
  payment_status: string
  created_at: string
}

interface GatePass {
  _id: string
  pass_number: string
  client_name: string
  items: Array<{ item_name: string; quantity: number }>
  type: string
  created_at: string
}

interface Delivery {
  _id: string
  delivery_number: string
  gate_pass_id: string
  items: Array<{
    item_name: string
    quantity_delivered: number
    quantity_ordered: number
    mismatch: boolean
  }>
  delivered_at: string
  created_at: string
}

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
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    fetchDashboardData()
  }, [period])

  const getDateRange = () => {
    const now = new Date()
    const start = new Date()

    switch (period) {
      case 'day':
        start.setDate(now.getDate() - 1)
        break
      case 'week':
        start.setDate(now.getDate() - 7)
        break
      case 'month':
        start.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        start.setMonth(now.getMonth() - 3)
        break
      case 'year':
        start.setFullYear(now.getFullYear() - 1)
        break
    }

    return { start: start.toISOString(), end: now.toISOString() }
  }

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { start, end } = getDateRange()

      // Fetch all data in parallel from existing lightweight endpoints
      const [billsRes, gatepassesRes, deliveriesRes] = await Promise.all([
        billsApi.get<Bill[]>('/bills'),
        billsApi.get<GatePass[]>('/gatepasses'),
        billsApi.get<Delivery[]>('/deliveries'),
      ])

      const bills = billsRes.data
      const gatepasses = gatepassesRes.data
      const deliveries = deliveriesRes.data

      // Filter data by period
      const filterByDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date >= new Date(start) && date <= new Date(end)
      }

      const periodBills = bills.filter((b) => filterByDate(b.created_at))
      const periodGatepasses = gatepasses.filter((g) => filterByDate(g.created_at))
      const periodDeliveries = deliveries.filter((d) => filterByDate(d.created_at))

      // Calculate Financial Metrics
      const total_revenue = periodBills.reduce((sum, b) => sum + b.total_amount, 0)
      const total_paid = periodBills.reduce((sum, b) => sum + (b.paid_amount || 0), 0)
      const total_outstanding = total_revenue - total_paid
      const collection_rate = total_revenue > 0 ? (total_paid / total_revenue) * 100 : 0
      const avg_bill_value = periodBills.length > 0 ? total_revenue / periodBills.length : 0
      const paid_bills = periodBills.filter((b) => b.payment_status === 'paid').length
      const pending_bills = periodBills.length - paid_bills

      // Calculate Operational Metrics
      const total_items_received = periodGatepasses.reduce((sum, gp) => {
        return sum + gp.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
      }, 0)

      const total_items_delivered = periodDeliveries.reduce((sum, d) => {
        return sum + d.items.reduce((itemSum, item) => itemSum + item.quantity_delivered, 0)
      }, 0)

      const pending_items = total_items_received - total_items_delivered

      // Calculate turnaround time (gate pass creation to delivery)
      let totalTurnaroundHours = 0
      let deliveryCount = 0

      periodDeliveries.forEach((delivery) => {
        const gatepass = gatepasses.find((gp) => gp._id === delivery.gate_pass_id)
        if (gatepass) {
          const gpDate = new Date(gatepass.created_at)
          const delDate = new Date(delivery.delivered_at || delivery.created_at)
          const hours = (delDate.getTime() - gpDate.getTime()) / (1000 * 60 * 60)
          totalTurnaroundHours += hours
          deliveryCount++
        }
      })

      const avg_turnaround_hours = deliveryCount > 0 ? totalTurnaroundHours / deliveryCount : 0

      const delivery_fulfillment_rate =
        total_items_received > 0 ? (total_items_delivered / total_items_received) * 100 : 0

      const inventory_turnover =
        total_items_received > 0 ? total_items_delivered / total_items_received : 0

      // Calculate Quality Metrics
      let mismatch_count = 0
      let total_items_checked = 0

      periodDeliveries.forEach((d) => {
        d.items.forEach((item) => {
          total_items_checked++
          if (item.mismatch) {
            mismatch_count++
          }
        })
      })

      const mismatch_rate = total_items_checked > 0 ? (mismatch_count / total_items_checked) * 100 : 0

      // Calculate Client Metrics
      const allClients = new Set(bills.map((b) => b.client_name))
      const periodClients = new Set(periodBills.map((b) => b.client_name))
      const active_clients = periodClients.size
      const total_clients = allClients.size

      // Simplified retention (clients who had bills in previous period and this period)
      const prevPeriodStart = new Date(start)
      prevPeriodStart.setTime(prevPeriodStart.getTime() - (new Date(end).getTime() - new Date(start).getTime()))
      const prevPeriodBills = bills.filter(
        (b) => new Date(b.created_at) >= prevPeriodStart && new Date(b.created_at) < new Date(start)
      )
      const prevClients = new Set(prevPeriodBills.map((b) => b.client_name))
      const retainedClients = [...prevClients].filter((c) => periodClients.has(c)).length
      const client_retention_rate = prevClients.size > 0 ? (retainedClients / prevClients.size) * 100 : 100

      // Calculate Revenue Trend by Date
      const revenueByDate = new Map<string, number>()
      periodBills.forEach((bill) => {
        const dateKey = new Date(bill.created_at).toISOString().split('T')[0]
        revenueByDate.set(dateKey, (revenueByDate.get(dateKey) || 0) + bill.total_amount)
      })

      const revenue_by_date = Array.from(revenueByDate.entries())
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Calculate Top Clients by Revenue
      const clientRevenue = new Map<string, number>()
      periodBills.forEach((bill) => {
        clientRevenue.set(
          bill.client_name,
          (clientRevenue.get(bill.client_name) || 0) + bill.total_amount
        )
      })

      const top_clients = Array.from(clientRevenue.entries())
        .map(([client_name, revenue]) => ({ client_name, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Generate Alerts
      const alerts: DashboardData['alerts']['items'] = []

      if (collection_rate < 70) {
        alerts.push({
          type: 'financial',
          severity: 'high',
          message: `Low collection rate: ${collection_rate.toFixed(1)}%. Focus on payment follow-ups.`,
          value: collection_rate,
        })
      }

      if (pending_bills > 10) {
        alerts.push({
          type: 'financial',
          severity: 'medium',
          message: `${pending_bills} pending bills. Consider sending payment reminders.`,
          value: pending_bills,
        })
      }

      if (mismatch_rate > 5) {
        alerts.push({
          type: 'quality',
          severity: 'high',
          message: `High mismatch rate: ${mismatch_rate.toFixed(1)}%. Review quality control processes.`,
          value: mismatch_rate,
        })
      }

      if (avg_turnaround_hours > 72) {
        alerts.push({
          type: 'operations',
          severity: 'medium',
          message: `Average turnaround time is ${avg_turnaround_hours.toFixed(1)} hours. Optimize workflow.`,
          value: avg_turnaround_hours,
        })
      }

      if (pending_items > 50) {
        alerts.push({
          type: 'operations',
          severity: 'medium',
          message: `${pending_items} items pending delivery. Prioritize fulfillment.`,
          value: pending_items,
        })
      }

      // Build Dashboard Data
      const dashboardData: DashboardData = {
        period,
        generated_at: new Date().toISOString(),
        financial: {
          total_revenue,
          total_paid,
          total_outstanding,
          collection_rate,
          avg_bill_value,
          total_bills: periodBills.length,
          paid_bills,
          pending_bills,
        },
        operations: {
          gate_passes_processed: periodGatepasses.length,
          total_items_received,
          total_items_delivered,
          pending_items,
          avg_turnaround_hours,
          delivery_fulfillment_rate,
          inventory_turnover,
        },
        quality: {
          mismatch_count,
          mismatch_rate,
          total_items_checked,
        },
        clients: {
          active_clients,
          total_clients,
          client_retention_rate,
          new_clients_this_period: periodClients.size - retainedClients,
        },
        trends: {
          revenue_by_date,
          top_clients,
        },
        alerts: {
          count: alerts.length,
          items: alerts,
        },
      }

      setData(dashboardData)
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Failed to connect to the server. Please check if the bill service is running.')
      }
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
          <p className="text-page-subtitle">
            {error || 'Loading comprehensive business metrics...'}
          </p>
        </div>
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to Load Dashboard</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => fetchDashboardData()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        )}
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
            trend={data.operations.inventory_turnover > 0.5 ? 'up' : 'neutral'}
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
              subtitle="vs previous period"
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
            {data.trends.revenue_by_date.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.trends.revenue_by_date}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    stroke="#888"
                    fontSize={12}
                    tickFormatter={(value: string) => {
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
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No revenue data for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Clients by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {data.trends.top_clients.length > 0 ? (
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
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No client data for this period
              </div>
            )}
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

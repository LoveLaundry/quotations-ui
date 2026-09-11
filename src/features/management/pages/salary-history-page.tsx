import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeesApi, salaryApi } from '../api/management-api'
import { toast } from 'sonner'
import { Eye, Printer, XCircle, CheckCircle, Wallet, PlayCircle } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { SalarySlipPrint } from '../components/salary-slip-print'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  FINALIZED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  PAID: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export default function SalaryHistoryPage() {
  const qc = useQueryClient()
  const slipRef = useRef<HTMLDivElement>(null)
  const [selectedEmp, setSelectedEmp] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear())
  const [viewSlip, setViewSlip] = useState<any>(null)
  const [payYear, setPayYear] = useState(new Date().getFullYear())
  const [payMonth, setPayMonth] = useState(new Date().getMonth() + 1)
  const [preview, setPreview] = useState<any>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [payrollLoading, setPayrollLoading] = useState(false)

  const { data: employees = [] } = useQuery({
    queryKey: ['mgmt-employees'],
    queryFn: () => employeesApi.list('').then(r => r.data),
  })

  const { data: slips = [], isLoading } = useQuery({
    queryKey: ['salary-slips', selectedEmp, statusFilter, yearFilter],
    queryFn: () => salaryApi.listSlips({
      employee_id: selectedEmp || undefined,
      status: statusFilter || undefined,
      year: yearFilter,
    }).then(r => r.data),
  })

  const finalizeMut = useMutation({
    mutationFn: (slipId: string) => salaryApi.finalizeSlip(slipId),
    onSuccess: () => { toast.success('Salary slip finalized'); qc.invalidateQueries({ queryKey: ['salary-slips'] }) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const cancelMut = useMutation({
    mutationFn: (slipId: string) => salaryApi.cancelSlip(slipId),
    onSuccess: () => { toast.success('Salary slip cancelled'); qc.invalidateQueries({ queryKey: ['salary-slips'] }); setViewSlip(null) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const payMut = useMutation({
    mutationFn: ({ slipId, amount }: { slipId: string; amount: number }) => salaryApi.paySlip(slipId, amount),
    onSuccess: () => { toast.success('Marked as paid'); qc.invalidateQueries({ queryKey: ['salary-slips'] }); setViewSlip(null) },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed'),
  })

  const handleMarkPaid = (slip: any) => {
    const amount = prompt('Payment amount (Rs.):', String(slip.net_salary ?? slip.total_earnings ?? 0))
    if (amount === null) return
    const n = Number(amount)
    if (!n || n <= 0) { toast.error('Enter a valid amount'); return }
    payMut.mutate({ slipId: slip.id, amount: n })
  }

  const loadPreview = async () => {
    setPreviewLoading(true)
    try {
      const r = await salaryApi.payrollPreview(payYear, payMonth)
      setPreview(r.data)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Preview failed')
    } finally {
      setPreviewLoading(false)
    }
  }

  const runPayroll = async () => {
    if (!confirm(`Create salary slips for ${payYear}-${payMonth} for all active employees?`)) return
    setPayrollLoading(true)
    try {
      const r = await salaryApi.payrollRun(payYear, payMonth)
      toast.success(`${r.data.created?.length ?? 0} slip(s) created, ${r.data.skipped?.length ?? 0} skipped`)
      setPreview(null)
      qc.invalidateQueries({ queryKey: ['salary-slips'] })
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Payroll run failed')
    } finally {
      setPayrollLoading(false)
    }
  }

  const handlePrint = useReactToPrint({
    contentRef: slipRef,
    documentTitle: viewSlip ? `SalarySlip-${viewSlip.slip_number}` : 'SalarySlip',
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Salary History</h1>
      </div>

      {/* Payroll Run card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-3">
          <PlayCircle size={18} /> Run Payroll
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Year</label>
            <input type="number" value={payYear} onChange={e => setPayYear(Number(e.target.value))}
              className="w-28 mt-1 px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Month</label>
            <select value={payMonth} onChange={e => setPayMonth(Number(e.target.value))}
              className="w-40 mt-1 px-3 py-2 border rounded-lg text-sm">
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <button onClick={loadPreview} disabled={previewLoading || payrollLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {previewLoading ? 'Previewing...' : 'Preview Month'}
          </button>
          <button onClick={runPayroll} disabled={payrollLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
            {payrollLoading ? 'Running...' : 'Run Payroll (DRAFT all missing)'}
          </button>
        </div>

        {preview && (
          <div className="mt-4 border-t pt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div><div className="text-2xl font-bold">{preview.count}</div><div className="text-xs text-gray-400">Employees</div></div>
            <div><div className="text-2xl font-bold text-red-600">Rs. {(preview.total_gross || 0).toLocaleString()}</div><div className="text-xs text-gray-400">Gross Total</div></div>
            <div><div className="text-2xl font-bold text-red-600">Rs. {(preview.total_deductions || 0).toLocaleString()}</div><div className="text-xs text-gray-400">Deductions</div></div>
            <div><div className="text-2xl font-bold text-green-600">Rs. {(preview.total_net || 0).toLocaleString()}</div><div className="text-xs text-gray-400">Net Payroll</div></div>
            <div className="text-xs text-gray-400 col-span-2 md:col-span-1">Missing slips will be created on Run Payroll. Existing slips are skipped.</div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee</label>
            <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
              <option value="">All Employees</option>
              {employees.map((e: any) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="FINALIZED">Finalized</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Year</label>
            <input type="number" value={yearFilter} onChange={e => setYearFilter(Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-500 py-2">{slips.length} slip{slips.length !== 1 ? 's' : ''} found</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left px-4 py-3 font-medium">Slip #</th>
                <th className="text-left px-4 py-3 font-medium">Employee</th>
                <th className="text-left px-4 py-3 font-medium">Period</th>
                <th className="text-right px-4 py-3 font-medium">Earnings</th>
                <th className="text-right px-4 py-3 font-medium">Deductions</th>
                <th className="text-right px-4 py-3 font-medium">Net Salary</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : slips.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No salary slips found</td></tr>
              ) : (
                slips.map((slip: any) => (
                  <tr key={slip.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-mono text-xs">{slip.slip_number}</td>
                    <td className="px-4 py-3">{slip.employee_name}</td>
                    <td className="px-4 py-3">{slip.period_start}</td>
                    <td className="px-4 py-3 text-right">Rs. {(slip.total_earnings || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-red-600">Rs. {(slip.total_deductions || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold">Rs. {(slip.net_salary || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[slip.status] || ''}`}>
                          {slip.status}
                        </span>
                        {slip.paid && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" title={`Paid ${slip.paid_date} — Rs. ${slip.amount_paid}`}>
                            Paid Rs. {(slip.amount_paid || 0).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setViewSlip(slip)} className="p-1.5 hover:bg-gray-100 rounded" title="View">
                          <Eye size={14} />
                        </button>
                        {slip.status === 'DRAFT' && (
                          <button onClick={() => finalizeMut.mutate(slip.id)} className="p-1.5 hover:bg-green-100 text-green-600 rounded" title="Finalize" disabled={finalizeMut.isPending}>
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {slip.status === 'FINALIZED' && !slip.paid && (
                          <button onClick={() => handleMarkPaid(slip)} className="p-1.5 hover:bg-sky-100 text-sky-600 rounded" title="Mark Paid" disabled={payMut.isPending}>
                            <Wallet size={14} />
                          </button>
                        )}
                        {slip.status !== 'PAID' && slip.status !== 'CANCELLED' && (
                          <button
                            onClick={() => { if (confirm('Cancel this salary slip? Advances will be restored.')) cancelMut.mutate(slip.id) }}
                            className="p-1.5 hover:bg-red-100 text-red-600 rounded" title="Cancel" disabled={cancelMut.isPending}>
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-3 flex items-center justify-between z-10">
              <h3 className="font-semibold">{viewSlip.slip_number} — {viewSlip.employee_name}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => handlePrint()} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
                  <Printer size={14} /> Print
                </button>
                <button onClick={() => setViewSlip(null)} className="p-1.5 hover:bg-gray-100 rounded">
                  <XCircle size={18} />
                </button>
              </div>
            </div>
            <div className="p-6" ref={slipRef}>
              <SalarySlipPrint slip={viewSlip} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
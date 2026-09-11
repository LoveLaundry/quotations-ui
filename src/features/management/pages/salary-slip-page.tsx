import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeesApi, salaryApi } from '../api/management-api'
import { toast } from 'sonner'
import { Calculator, FileText, Printer, Download, ChevronDown, CheckCircle, XCircle, Eye } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { SalarySlipPrint } from '../components/salary-slip-print'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function SalarySlipPage() {
  const qc = useQueryClient()
  const slipRef = useRef<HTMLDivElement>(null)
  const [selectedEmp, setSelectedEmp] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [calculation, setCalculation] = useState<any>(null)
  const [showSlip, setShowSlip] = useState(false)
  const [generatedSlip, setGeneratedSlip] = useState<any>(null)
  const [allowances, setAllowances] = useState(0)
  const [loanDeduction, setLoanDeduction] = useState(0)
  const [otherDeductions, setOtherDeductions] = useState(0)
  const [notes, setNotes] = useState('')

  const { data: employees = [] } = useQuery({
    queryKey: ['mgmt-employees'],
    queryFn: () => employeesApi.list('').then(r => r.data),
  })

  const calcMut = useMutation({
    mutationFn: () => salaryApi.calculate(selectedEmp, year, month),
    onSuccess: (res) => {
      setCalculation(res.data)
      setAllowances(0)
      setLoanDeduction(0)
      setOtherDeductions(0)
      setNotes('')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Calculation failed'),
  })

  const generateMut = useMutation({
    mutationFn: (data: any) => salaryApi.createSlip(data),
    onSuccess: (res) => {
      toast.success('Salary slip generated')
      setGeneratedSlip(res.data)
      setShowSlip(true)
      qc.invalidateQueries({ queryKey: ['salary-slips'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Generation failed'),
  })

  const handlePrint = useReactToPrint({
    contentRef: slipRef,
    documentTitle: generatedSlip ? `SalarySlip-${generatedSlip.slip_number}` : 'SalarySlip',
  })

  const handleGenerate = () => {
    if (!calculation) return
    const totalEarnings = calculation.base_salary_for_period + calculation.overtime_pay + calculation.extra_work_total + allowances
    const totalDeductions = calculation.epf_employee + calculation.advance_deductions + loanDeduction + otherDeductions
    const netSalary = totalEarnings - totalDeductions

    generateMut.mutate({
      employee_id: selectedEmp,
      period_type: 'MONTHLY',
      period_start: calculation.period_start,
      period_end: calculation.period_end,
      basic_salary: calculation.basic_salary,
      adjusted_base_salary: calculation.adjusted_base_salary,
      calendar_days: calculation.calendar_days,
      working_days: calculation.total_working_days,
      worked_days: calculation.worked_days,
      absent_days: calculation.absent_days,
      leave_days: calculation.leave_days,
      overtime_hours: calculation.overtime_hours,
      overtime_rate: calculation.overtime_rate,
      overtime_pay: calculation.overtime_pay,
      allowances,
      allowance_details: [],
      extra_work_total: calculation.extra_work_total,
      extra_work_details: calculation.extra_work_details || [],
      epf_employee: calculation.epf_employee,
      epf_employer: calculation.epf_employer,
      etf_employer: calculation.etf_employer,
      advance_deductions: calculation.advance_deductions,
      advance_details: calculation.advance_details || [],
      loan_deduction,
      other_deductions,
      status: 'DRAFT',
      notes,
    })
  }

  const totalEarnings = calculation
    ? calculation.base_salary_for_period + calculation.overtime_pay + calculation.extra_work_total + allowances
    : 0
  const totalDeductions = calculation
    ? calculation.epf_employee + calculation.advance_deductions + loanDeduction + otherDeductions
    : 0
  const netSalary = totalEarnings - totalDeductions

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Generate Salary Slip</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calculator size={20} /> Salary Calculation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee</label>
            <select
              value={selectedEmp}
              onChange={e => { setSelectedEmp(e.target.value); setCalculation(null); setShowSlip(false) }}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Select Employee</option>
              {employees.filter((e: any) => e.is_active).map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.salary_type || 'MONTHLY'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Year</label>
            <input
              type="number"
              value={year}
              onChange={e => { setYear(Number(e.target.value)); setCalculation(null) }}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Month</label>
            <select
              value={month}
              onChange={e => { setMonth(Number(e.target.value)); setCalculation(null) }}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
            >
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => calcMut.mutate()}
              disabled={!selectedEmp || calcMut.isPending}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
            >
              <Calculator size={16} />
              {calcMut.isPending ? 'Calculating...' : 'Calculate'}
            </button>
          </div>
        </div>
      </div>

      {calculation && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold text-lg">Attendance & Base Salary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Salary Type</span><span className="font-medium">{calculation.salary_type}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Calendar Days</span><span className="font-medium">{calculation.calendar_days}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Working Days</span><span className="font-medium">{calculation.total_working_days}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Worked Days</span><span className="font-medium text-green-600">{calculation.worked_days}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Leave Days</span><span className="font-medium text-blue-600">{calculation.leave_days}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Absent Days</span><span className="font-medium text-red-600">{calculation.absent_days}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Basic Salary</span><span className="font-medium">Rs. {calculation.basic_salary.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Adjusted Base</span><span className="font-medium">Rs. {calculation.adjusted_base_salary.toLocaleString()}</span></div>
              <div className="col-span-2 flex justify-between border-t pt-2">
                <span className="font-semibold">Base for Period</span>
                <span className="font-bold">Rs. {calculation.base_salary_for_period.toLocaleString()}</span>
              </div>
            </div>

            {calculation.existing_slip_id && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700 dark:text-yellow-300">
                A salary slip already exists for this period (Status: {calculation.existing_slip_status}).
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold text-lg">Earnings & Deductions</h3>

            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Earnings</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Base Salary (Period)</span><span>Rs. {calculation.base_salary_for_period.toLocaleString()}</span></div>
                {calculation.overtime_pay > 0 && (
                  <div className="flex justify-between"><span>Overtime ({calculation.overtime_hours} hrs)</span><span>Rs. {calculation.overtime_pay.toLocaleString()}</span></div>
                )}
                {calculation.extra_work_total > 0 && (
                  <div className="flex justify-between"><span>Extra Work</span><span>Rs. {calculation.extra_work_total.toLocaleString()}</span></div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Allowances</span>
                  <input
                    type="number"
                    value={allowances}
                    onChange={e => setAllowances(Number(e.target.value) || 0)}
                    className="ml-auto w-32 px-2 py-1 border rounded text-sm text-right"
                  />
                </div>
              </div>

              <div className="border-t pt-3 text-sm font-medium text-gray-600 dark:text-gray-400">Deductions</div>
              <div className="space-y-2 text-sm">
                {calculation.epf_employee > 0 && (
                  <div className="flex justify-between"><span>EPF (Employee)</span><span className="text-red-600">- Rs. {calculation.epf_employee.toLocaleString()}</span></div>
                )}
                {calculation.advance_deductions > 0 && (
                  <div className="flex justify-between"><span>Advances</span><span className="text-red-600">- Rs. {calculation.advance_deductions.toLocaleString()}</span></div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Loan Deduction</span>
                  <input
                    type="number"
                    value={loanDeduction}
                    onChange={e => setLoanDeduction(Number(e.target.value) || 0)}
                    className="ml-auto w-32 px-2 py-1 border rounded text-sm text-right"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Other Deductions</span>
                  <input
                    type="number"
                    value={otherDeductions}
                    onChange={e => setOtherDeductions(Number(e.target.value) || 0)}
                    className="ml-auto w-32 px-2 py-1 border rounded text-sm text-right"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-lg"><span className="font-semibold">Total Earnings</span><span className="font-bold">Rs. {totalEarnings.toLocaleString()}</span></div>
              <div className="flex justify-between text-lg"><span className="font-semibold">Total Deductions</span><span className="font-bold text-red-600">Rs. {totalDeductions.toLocaleString()}</span></div>
              <div className="flex justify-between text-xl border-t pt-2"><span className="font-bold">Net Salary</span><span className="font-bold text-green-600">Rs. {netSalary.toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      )}

      {calculation && !showSlip && (
        <div className="flex gap-3">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <button
            onClick={handleGenerate}
            disabled={generateMut.isPending}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2 self-end"
          >
            <FileText size={16} />
            {generateMut.isPending ? 'Generating...' : 'Generate Slip'}
          </button>
        </div>
      )}

      {showSlip && generatedSlip && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" /> Slip Generated: {generatedSlip.slip_number}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => handlePrint()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
              >
                <Printer size={16} /> Print
              </button>
              <button
                onClick={() => { setShowSlip(false); setGeneratedSlip(null); setCalculation(null) }}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm"
              >
                New Calculation
              </button>
            </div>
          </div>
          <div ref={slipRef}>
            <SalarySlipPrint slip={generatedSlip} />
          </div>
        </div>
      )}
    </div>
  )
}

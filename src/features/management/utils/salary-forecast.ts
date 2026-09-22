import { buildHolidaySet } from './attendance-summary'

export interface SalaryForecastInput {
  year: number
  month: number
  holidays?: Array<{ date?: string; start_date?: string; end_date?: string }>
}

export interface SalaryForecast {
  projected: number
  base: number
  allowance: number
  epf: number
  overtime: number
  working_days: number
  method: string
}

export function buildSalaryForecast(
  emp: any,
  otHours: number,
  info: SalaryForecastInput,
): SalaryForecast {
  const daysInMonth = new Date(info.year, info.month, 0).getDate()
  let weekendCount = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(info.year, info.month - 1, d).getDay()
    if (dow === 0 || dow === 6) weekendCount += 1
  }
  const holidaySet = buildHolidaySet(info.holidays || [])
  let holidayCount = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${info.year}-${String(info.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dow = new Date(info.year, info.month - 1, d).getDay()
    if (holidaySet.has(iso) && dow !== 0 && dow !== 6) holidayCount += 1
  }
  const workingDays = Math.max(0, daysInMonth - weekendCount - holidayCount)

  const salaryType = emp.salary_type || 'MONTHLY'
  const basic = Number(emp.basic_salary) || 0
  const dailyRate = Number(emp.daily_rate) || 0
  const weeklyRate = Number(emp.weekly_rate) || dailyRate * 6
  const contract = Number(emp.contract_amount) || 0
  const overtimeRate = Number(emp.overtime_rate) || 0
  const allowance = Number(emp.allowance) || 0
  const epfRate = Number(emp.epf_rate) || 0
  const overtime = Math.round((otHours || 0) * overtimeRate)

  let base: number
  let method: string
  if (salaryType === 'DAILY') {
    base = Math.round(dailyRate * workingDays)
    method = 'Daily · days worked'
  } else if (salaryType === 'WEEKLY') {
    base = Math.round(weeklyRate * (daysInMonth / 7))
    method = 'Weekly'
  } else if (salaryType === 'CONTRACT') {
    base = Math.round(contract)
    method = 'Contract · fixed'
  } else {
    base = Math.round(basic)
    method = emp.attendance_required === false ? 'Monthly · fixed (attendance not required)' : 'Monthly · attendance-based'
  }

  const epf = salaryType === 'MONTHLY' ? Math.round(base * epfRate / 100) : 0
  const projected = Math.max(0, base + allowance + overtime - epf)

  return { projected, base, allowance, epf, overtime, working_days: workingDays, method }
}
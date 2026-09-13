import { COMPANY } from '../../../config/company'
import iconPng from '../../../assets/icon.png'

interface SalarySlipProps {
  slip: any
}

export function SalarySlipPrint({ slip }: SalarySlipProps) {
  if (!slip) return null

  const formatRs = (val: number) => `Rs. ${Number(val || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const periodMonth = slip.period_start ? new Date(slip.period_start + 'T00:00:00').toLocaleString('en-US', { month: 'long', year: 'numeric' }) : ''

  return (
    <div className="w-full max-w-[800px] mx-auto bg-white text-black" style={{ fontFamily: '"Spectral", Georgia, serif' }}>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm 15mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
        }
        .slip-container { border: 1.5px solid #E01E31; padding: 0; }
        .slip-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 12px 20px; border-bottom: 1.5px solid #E01E31; }
        .brand-logo { width: 44px; height: 44px; object-fit: contain; background: #fff; border: 1.5px solid #E01E31; border-radius: 50%; padding: 5px; box-sizing: border-box; flex-shrink: 0; }
        .brand-name { font-family: "Spectral", Georgia, serif; font-weight: 700; letter-spacing: -0.25px; font-size: 20px; color: #E01E31; line-height: 1.15; }
        .brand-tagline { font-size: 11px; color: #6B7280; margin-top: 1px; }
        .brand-contact { font-size: 10px; color: #9CA3AF; margin-top: 4px; line-height: 1.45; }
        .doc-meta { text-align: right; }
        .doc-title { font-size: 17px; font-weight: 800; letter-spacing: 2.5px; text-transform: uppercase; color: #E01E31; line-height: 1.1; }
        .doc-period { font-size: 12px; color: #374151; margin-top: 3px; font-weight: 600; }
        .slip-body { padding: 10px 20px 14px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; column-gap: 28px; row-gap: 0; background: #FDF6F7; border: 1px solid #F3C9CE; border-radius: 6px; padding: 7px 12px; }
        .info-row { display: flex; justify-content: space-between; gap: 10px; padding: 2px 0; font-size: 12px; }
        .info-label { color: #6B7280; font-weight: 500; }
        .info-value { font-weight: 700; text-align: right; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px; margin-top: 8px; }
        .section-title { color: #E01E31; border-left: 3px solid #E01E31; padding: 1px 0 1px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .calc-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .calc-table td { padding: 2.5px 6px; border-bottom: 1px solid #F7E5E7; }
        .calc-table tr:last-child td { border-bottom: none; }
        .calc-table td:last-child { text-align: right; font-weight: 600; }
        .calc-table tr.total-row td { border-top: 1.5px solid #E01E31; border-bottom: none; font-weight: 800; color: #B71C1C; }
        .calc-table td .sub { display: block; font-size: 10px; color: #9CA3AF; font-weight: 400; }
        .advance-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .advance-table th { text-align: left; padding: 3px 6px; color: #B71C1C; font-weight: 700; border-bottom: 1.5px solid #E01E31; }
        .advance-table th:last-child { text-align: right; }
        .advance-table td { padding: 2.5px 6px; border-bottom: 1px solid #F7E5E7; }
        .advance-table td:last-child { text-align: right; }
        .net-salary { display: flex; align-items: center; justify-content: space-between; border: 1.5px solid #E01E31; border-radius: 6px; padding: 9px 16px; margin-top: 10px; background: #fff; }
        .net-salary .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #B71C1C; }
        .net-salary .amount { font-size: 24px; font-weight: 800; color: #E01E31; }
        .slip-footer { display: flex; justify-content: space-between; align-items: flex-end; padding: 6px 20px 0; margin-top: 2px; font-size: 11px; }
        .sig-line { border-top: 1px solid #1F2937; width: 30%; text-align: center; padding-top: 4px; }
        .slip-number { font-size: 10px; color: #9CA3AF; }
        .status-badge { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
        .status-DRAFT { background: #fef3c7; color: #92400e; }
        .status-FINALIZED { background: #d1fae5; color: #065f46; }
        .status-CANCELLED { background: #fee2e2; color: #991b1b; }
      `}</style>

      <div className="slip-container">
        {/* Compact one-row letterhead */}
        <div className="slip-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img className="brand-logo" src={iconPng} alt="Love Laundry" />
            <div>
              <div className="brand-name">{COMPANY.name}</div>
              <div className="brand-tagline">{COMPANY.tagline}</div>
              <div className="brand-contact">
                {COMPANY.address.line1}, {COMPANY.address.line2}<br />
                Tel: {COMPANY.phone.primary} | {COMPANY.phone.secondary}
              </div>
            </div>
          </div>
          <div className="doc-meta">
            <div className="doc-title">Salary Slip</div>
            <div className="doc-period">{periodMonth}</div>
            <div className="slip-number" style={{ marginTop: 3 }}>{slip.slip_number}</div>
          </div>
        </div>

        <div className="slip-body">
          <div className="info-grid">
            <div className="info-row"><span className="info-label">Employee</span><span className="info-value">{slip.employee_name}</span></div>
            <div className="info-row"><span className="info-label">Status</span><span className="info-value"><span className={`status-badge status-${slip.status}`}>{slip.status}</span></span></div>
            <div className="info-row"><span className="info-label">Salary Type</span><span className="info-value">{slip.salary_type}</span></div>
            <div className="info-row"><span className="info-label">Period</span><span className="info-value">{slip.period_start} → {slip.period_end}</span></div>
            <div className="info-row"><span className="info-label">Department</span><span className="info-value">{slip.department || '—'}</span></div>
            <div className="info-row"><span className="info-label">Paid Date</span><span className="info-value">{slip.paid_date || '—'}</span></div>
          </div>

          <div className="two-col">
            <div>
              <div className="section-title">Attendance</div>
              <table className="calc-table">
                <tbody>
                  <tr><td>Calendar Days</td><td>{slip.calendar_days}</td></tr>
                  <tr><td>Working Days</td><td>{slip.working_days}</td></tr>
                  <tr><td>Worked Days</td><td style={{ color: '#16a34a' }}>{slip.worked_days}</td></tr>
                  {slip.leave_days > 0 && <tr><td>Leave Days</td><td style={{ color: '#2563eb' }}>{slip.leave_days}</td></tr>}
                  {slip.absent_days > 0 && <tr><td>Absent Days</td><td style={{ color: '#dc2626' }}>{slip.absent_days}</td></tr>}
                  {slip.holiday_count > 0 && <tr><td>Holidays</td><td style={{ color: '#9333ea' }}>{slip.holiday_count}</td></tr>}
                  {slip.weekend_count > 0 && <tr><td>Weekends</td><td style={{ color: '#9333ea' }}>{slip.weekend_count}</td></tr>}
                </tbody>
              </table>
            </div>
            <div>
              <div className="section-title">
                {slip.epf_base ? `EPF / ETF · ${slip.epf_base === 'FULL' ? 'Full Base' : slip.epf_base === 'ATTENDANCE' ? 'Attendance Base' : 'Adjusted Base'}` : 'EPF / ETF'}
              </div>
              <table className="calc-table">
                <tbody>
                  <tr><td>EPF (Employee)</td><td>{formatRs(slip.epf_employee)}</td></tr>
                  <tr><td>EPF (Employer)</td><td>{formatRs(slip.epf_employer)}</td></tr>
                  <tr><td>ETF (Employer)</td><td>{formatRs(slip.etf_employer)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="two-col" style={{ marginTop: 6 }}>
            <div>
              <div className="section-title">Earnings</div>
              <table className="calc-table">
                <tbody>
                  <tr><td>Basic Salary</td><td>{formatRs(slip.basic_salary)}</td></tr>
                  <tr><td>Adjusted Base<div className="sub">{slip.calendar_days} days</div></td><td>{formatRs(slip.adjusted_base_salary)}</td></tr>
                  <tr><td>Base for Period<div className="sub">{slip.worked_days} days worked</div></td><td style={{ fontWeight: 700 }}>{formatRs(slip.base_salary_for_period ?? (slip.adjusted_base_salary * slip.worked_days / Math.max(slip.calendar_days, 1)))}</td></tr>
                  {slip.overtime_pay > 0 && <tr><td>Overtime<div className="sub">{slip.overtime_hours} hrs × {Number(slip.overtime_rate || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></td><td>{formatRs(slip.overtime_pay)}</td></tr>}
                  {slip.extra_work_total > 0 && <tr><td>Extra Work</td><td>{formatRs(slip.extra_work_total)}</td></tr>}
                  {slip.allowances > 0 && <tr><td>Allowances</td><td>{formatRs(slip.allowances)}</td></tr>}
                  <tr className="total-row"><td>Total Earnings</td><td>{formatRs(slip.total_earnings)}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <div className="section-title">Deductions</div>
              <table className="calc-table">
                <tbody>
                  {slip.epf_employee > 0 && <tr><td>EPF Deduction</td><td>{formatRs(slip.epf_employee)}</td></tr>}
                  {slip.advance_deductions > 0 && <tr><td>Advance Deductions</td><td>{formatRs(slip.advance_deductions)}</td></tr>}
                  {slip.loan_deduction > 0 && <tr><td>Loan Deduction</td><td>{formatRs(slip.loan_deduction)}</td></tr>}
                  {slip.other_deductions > 0 && <tr><td>Other Deductions</td><td>{formatRs(slip.other_deductions)}</td></tr>}
                  <tr className="total-row"><td>Total Deductions</td><td>{formatRs(slip.total_deductions)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {(slip.advance_details || []).length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div className="section-title">Advance Details</div>
              <table className="advance-table">
                <thead>
                  <tr><th>Date</th><th>Original</th><th>Deducted</th><th style={{ textAlign: 'right' }}>Reason</th></tr>
                </thead>
                <tbody>
                  {slip.advance_details.map((adv: any, i: number) => (
                    <tr key={i}>
                      <td>{adv.date}</td>
                      <td>{formatRs(adv.original_amount)}</td>
                      <td>{formatRs(adv.amount_deducted)}</td>
                      <td style={{ textAlign: 'right' }}>{adv.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="net-salary">
            <span className="label">{slip.paid ? 'Net Salary · Paid' : 'Net Salary'}</span>
            <span className="amount">{formatRs(slip.net_salary)}</span>
          </div>

          {slip.notes && (
            <div style={{ fontSize: 11, color: '#4B5563', marginTop: 8, padding: '6px 10px', background: '#ffffff', border: '1px solid #F3C9CE', borderLeft: '3px solid #E01E31', borderRadius: 4 }}>
              <strong>Notes:</strong> {slip.notes}
            </div>
          )}
        </div>

        <div className="slip-footer">
          <div className="sig-line">Employee Signature</div>
          <div className="sig-line">Authorized Signature</div>
          <div className="sig-line">Date</div>
        </div>
      </div>
    </div>
  )
}
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
    <div
      className="w-full max-w-[800px] mx-auto bg-white text-[#111827]"
      style={{ fontFamily: '"Spectral", Georgia, serif' }}
    >
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm 15mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
        }
        .slip-container { border: 2px solid #E01E31; padding: 0; }
        .slip-header { background: linear-gradient(135deg, #E01E31 0%, #B71C1C 55%, #7F1620 100%); color: white; padding: 20px 24px 14px; }
        .brand-row { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; }
        .brand-logo { width: 58px; height: 58px; object-fit: contain; background: #fff; border-radius: 50%; padding: 7px; box-sizing: border-box; }
        .company-name { font-size: 30px; font-weight: 800; letter-spacing: 1px; line-height: 1; }
        .company-tagline { font-size: 12px; opacity: 0.9; margin-top: 3px; letter-spacing: 0.3px; }
        .header-contact { margin-top: 10px; font-size: 11px; opacity: 0.85; line-height: 1.5; }
        .slip-title-band { border-top: 1px solid rgba(255,255,255,0.35); margin-top: 12px; padding-top: 10px; text-align: center; }
        .slip-title { font-size: 20px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; }
        .slip-period { font-size: 13px; margin-top: 3px; opacity: 0.92; }
        .slip-body { padding: 16px 24px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; font-size: 13px; background: #FEF5F6; border: 1px solid #F5D6DA; border-radius: 8px; padding: 8px 12px; }
        .info-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dotted #EBB8BE; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #8A1C28; font-weight: 600; }
        .info-value { font-weight: 700; text-align: right; }
        .section-title { background: #E01E31; color: white; padding: 6px 12px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin: 12px 0 8px; border-radius: 4px 4px 0 0; }
        .calc-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .calc-table th { background: #FDE9EB; padding: 6px 10px; text-align: left; font-weight: 700; color: #8A1C28; border-bottom: 1px solid #F0C6CB; }
        .calc-table th:last-child { text-align: right; }
        .calc-table td { padding: 5px 10px; border-bottom: 1px solid #F5E7E9; }
        .calc-table td:last-child { text-align: right; font-weight: 600; }
        .calc-table tr.total-row td { border-top: 2px solid #E01E31; font-weight: 800; background: #FDE9EB; color: #7F1620; }
        .calc-table tr.subtotal-row td { border-top: 1px solid #9CA3AF; font-weight: 700; }
        .net-salary-box { background: linear-gradient(135deg, #E01E31, #7F1620); color: white; padding: 14px 16px; text-align: center; margin: 12px 0; border-radius: 8px; }
        .net-salary-box .amount { font-size: 26px; font-weight: 800; letter-spacing: 0.5px; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px; }
        .advance-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 4px; }
        .advance-table th { background: #FDE9EB; padding: 4px 8px; text-align: left; font-weight: 700; color: #8A1C28; border-bottom: 1px solid #F0C6CB; }
        .advance-table td { padding: 3px 8px; border-bottom: 1px solid #F5E7E9; }
        .advance-table td:last-child { text-align: right; }
        .slip-footer { border-top: 2px solid #E01E31; padding: 12px 24px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; }
        .sig-line { border-top: 1px solid #111827; width: 160px; text-align: center; padding-top: 4px; margin-top: 40px; }
        .slip-number { font-size: 11px; color: #9CA3AF; }
        .status-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
        .status-DRAFT { background: #FEF3C7; color: #92400E; }
        .status-FINALIZED { background: #D1FAE5; color: #065F46; }
        .status-CANCELLED { background: #FEE2E2; color: #991B1B; }
      `}</style>

      <div className="slip-container">
        <div className="slip-header">
          <div className="brand-row">
            <img className="brand-logo" src={iconPng} alt="Love Laundry" />
            <div>
              <div className="company-name">{COMPANY.name}</div>
              <div className="company-tagline">{COMPANY.tagline}</div>
            </div>
          </div>
          <div className="header-contact">
            {COMPANY.address.line1}, {COMPANY.address.line2} &nbsp;|&nbsp; Reg. {COMPANY.registrationNo}
            <br />
            Tel: {COMPANY.phone.primary} &nbsp;|&nbsp; {COMPANY.phone.secondary} &nbsp;|&nbsp; {COMPANY.email}
          </div>
          <div className="slip-title-band">
            <div className="slip-title">Salary Slip</div>
            <div className="slip-period">{periodMonth}</div>
          </div>
        </div>

        <div className="slip-body">
          <div className="info-grid">
            <div>
              <div className="info-row"><span className="info-label">Employee Name</span><span className="info-value">{slip.employee_name}</span></div>
              <div className="info-row"><span className="info-label">Salary Type</span><span className="info-value">{slip.salary_type}</span></div>
              <div className="info-row"><span className="info-label">Period</span><span className="info-value">{slip.period_start} to {slip.period_end}</span></div>
            </div>
            <div>
              <div className="info-row"><span className="info-label">Slip Number</span><span className="info-value">{slip.slip_number}</span></div>
              <div className="info-row"><span className="info-label">Status</span><span className="info-value"><span className={`status-badge status-${slip.status}`}>{slip.status}</span></span></div>
              <div className="info-row"><span className="info-label">Paid Date</span><span className="info-value">{slip.paid_date || '—'}</span></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px', marginTop: 12 }}>
            <div>
              <div className="section-title">Attendance</div>
              <table className="calc-table">
                <tbody>
                  <tr><td>Calendar Days</td><td>{slip.calendar_days}</td></tr>
                  <tr><td>Working Days</td><td>{slip.working_days}</td></tr>
                  <tr><td>Worked Days</td><td style={{ color: '#16A34A' }}>{slip.worked_days}</td></tr>
                  {slip.leave_days > 0 && <tr><td>Leave Days</td><td style={{ color: '#2563EB' }}>{slip.leave_days}</td></tr>}
                  {slip.holiday_count > 0 && <tr><td>Holidays</td><td style={{ color: '#9333EA' }}>{slip.holiday_count}</td></tr>}
                  {slip.weekend_count > 0 && <tr><td>Weekends</td><td style={{ color: '#9333EA' }}>{slip.weekend_count}</td></tr>}
                  <tr><td>Absent Days</td><td style={{ color: '#DC2626' }}>{slip.absent_days}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <div className="section-title">EPF / ETF {slip.epf_base ? ` · ${slip.epf_base === 'FULL' ? 'full base' : slip.epf_base === 'ATTENDANCE' ? 'attendance base' : 'adjusted base'}` : ''}</div>
              <table className="calc-table">
                <tbody>
                  <tr><td>EPF (Employee)</td><td>{formatRs(slip.epf_employee)}</td></tr>
                  <tr><td>EPF (Employer)</td><td>{formatRs(slip.epf_employer)}</td></tr>
                  <tr><td>ETF (Employer)</td><td>{formatRs(slip.etf_employer)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="two-col" style={{ marginTop: 8 }}>
            <div>
              <div className="section-title">Earnings</div>
              <table className="calc-table">
                <tbody>
                  <tr><td>Basic Salary</td><td>{formatRs(slip.basic_salary)}</td></tr>
                  <tr><td>Adjusted Base ({slip.calendar_days} days)</td><td>{formatRs(slip.adjusted_base_salary)}</td></tr>
                  <tr><td>Base for Period ({slip.worked_days} days worked)</td><td style={{ fontWeight: 800 }}>{formatRs(slip.base_salary_for_period ?? (slip.adjusted_base_salary * slip.worked_days / Math.max(slip.calendar_days, 1)))}</td></tr>
                  {slip.overtime_pay > 0 && <tr><td>Overtime ({slip.overtime_hours} hrs × {formatRs(slip.overtime_rate)})</td><td>{formatRs(slip.overtime_pay)}</td></tr>}
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
                  <tr><th>Date</th><th>Original Amount</th><th>Deducted</th><th style={{ textAlign: 'right' }}>Reason</th></tr>
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

          <div className="net-salary-box">
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Net Salary</div>
            <div className="amount">{formatRs(slip.net_salary)}</div>
            {slip.paid && <div style={{ fontSize: 11, marginTop: 4, opacity: 0.85 }}>Paid on {slip.paid_date}</div>}
          </div>

          {slip.notes && (
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8, padding: '6px 10px', background: '#FEF5F6', border: '1px solid #F5D6DA', borderRadius: 4 }}>
              <strong>Notes:</strong> {slip.notes}
            </div>
          )}
        </div>

        <div className="slip-footer">
          <div className="sig-line">
            <div>Employee Signature</div>
          </div>
          <div className="sig-line">
            <div>Authorized Signature</div>
          </div>
          <div className="sig-line">
            <div>Date</div>
          </div>
        </div>
      </div>
    </div>
  )
}
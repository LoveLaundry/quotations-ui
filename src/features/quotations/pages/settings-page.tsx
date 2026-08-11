import { RiSettings3Line, RiPaletteLine, RiTextSpacing, RiContrastLine, RiCheckLine } from 'react-icons/ri'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { useTheme, type FontSize, type Contrast } from '../../../context/ThemeContext'

const FONT_OPTIONS: { value: FontSize; label: string; desc: string; px: string }[] = [
  { value: 'sm', label: 'Small', desc: 'Compact, more content visible', px: '13px' },
  { value: 'md', label: 'Medium', desc: 'Default comfortable size', px: '14px' },
  { value: 'lg', label: 'Large', desc: 'Easier on the eyes', px: '15px' },
]

const CONTRAST_OPTIONS: { value: Contrast; label: string; desc: string; secondary: string; tertiary: string }[] = [
  { value: 'normal', label: 'Normal', desc: 'Standard grey tones', secondary: '#374151', tertiary: '#4B5563' },
  { value: 'dark',   label: 'Dark',   desc: 'Darker grey, easier to read', secondary: '#1D2939', tertiary: '#344054' },
  { value: 'darkest', label: 'Maximum', desc: 'Near-black for all text', secondary: '#101828', tertiary: '#1D2939' },
]

function OptionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative flex flex-col gap-1 rounded-xl border-2 px-4 py-3 text-left transition-all cursor-pointer',
        active
          ? 'border-[#DC2626] bg-[#FFF1F1]'
          : 'border-[#E4E7EC] bg-white hover:border-[#FCA5A5] hover:bg-[#FFF7F7]',
      ].join(' ')}
    >
      {active && (
        <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#DC2626]">
          <RiCheckLine className="h-2.5 w-2.5 text-white" />
        </span>
      )}
      {children}
    </button>
  )
}

export default function SettingsPage() {
  const { fontSize, contrast, setFontSize, setContrast } = useTheme()

  return (
    <div className="space-y-6 pb-10 select-none">
      <div>
        <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Settings' }]} />
        <div className="flex items-center gap-3 mt-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F3F4F6] border border-[#E4E7EC]">
            <RiSettings3Line className="h-4 w-4 text-[#374151]" />
          </div>
          <div>
            <h1 className="text-dashboard-title">Settings</h1>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Customize display, fonts and accessibility
            </p>
          </div>
        </div>
      </div>

      {/* Font Size */}
      <Card>
        <CardHeader className="border-b border-[#F2F4F7] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF] border border-[#BFDBFE]">
              <RiTextSpacing className="h-4 w-4 text-[#2563EB]" />
            </div>
            <div>
              <CardTitle>Font Size</CardTitle>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                Controls the base text size across the entire application
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {FONT_OPTIONS.map(opt => (
              <OptionButton key={opt.value} active={fontSize === opt.value} onClick={() => setFontSize(opt.value)}>
                <span className="font-semibold text-[#101828]" style={{ fontSize: opt.px }}>{opt.label}</span>
                <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{opt.desc}</span>
                <span className="text-[10px] font-mono text-[#98A2B3]">{opt.px}</span>
              </OptionButton>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Text Contrast */}
      <Card>
        <CardHeader className="border-b border-[#F2F4F7] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0FDF4] border border-[#BBF7D0]">
              <RiContrastLine className="h-4 w-4 text-[#16A34A]" />
            </div>
            <div>
              <CardTitle>Text Contrast</CardTitle>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                Make secondary text darker for better readability
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CONTRAST_OPTIONS.map(opt => (
              <OptionButton key={opt.value} active={contrast === opt.value} onClick={() => setContrast(opt.value)}>
                <span className="font-semibold text-[#101828] text-[13px]">{opt.label}</span>
                <span className="text-[11px]" style={{ color: opt.tertiary }}>{opt.desc}</span>
                <div className="mt-1.5 flex gap-1.5 items-center">
                  <div className="h-3 w-3 rounded-full border border-[#E4E7EC]" style={{ background: opt.secondary }} />
                  <div className="h-2.5 w-2.5 rounded-full border border-[#E4E7EC]" style={{ background: opt.tertiary }} />
                  <span className="text-[10px] font-mono" style={{ color: opt.tertiary }}>{opt.secondary}</span>
                </div>
              </OptionButton>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader className="border-b border-[#F2F4F7] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF7ED] border border-[#FED7AA]">
              <RiPaletteLine className="h-4 w-4 text-[#EA580C]" />
            </div>
            <div>
              <CardTitle>Live Preview</CardTitle>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                How your text looks with current settings
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="rounded-xl border border-[#E4E7EC] bg-[#FAFAFA] p-5 space-y-3">
            <h3 className="font-bold text-[#101828]" style={{ fontSize: 'calc(var(--body-font-size) + 4px)' }}>
              Invoice #INV-20260811-0001
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--body-font-size)' }}>
              This is secondary text — client details, dates, and descriptions appear in this color.
            </p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'calc(var(--body-font-size) - 1px)' }}>
              This is tertiary text — labels, captions, and metadata appear here.
            </p>
            <div className="flex gap-3 pt-1">
              <div className="rounded-lg border border-[#E4E7EC] bg-white px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Client Name</p>
                <p className="font-semibold text-[#101828]" style={{ fontSize: 'var(--body-font-size)' }}>Hilton Colombo</p>
              </div>
              <div className="rounded-lg border border-[#E4E7EC] bg-white px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Amount</p>
                <p className="font-semibold text-[#101828]" style={{ fontSize: 'var(--body-font-size)' }}>LKR 84,500</p>
              </div>
              <div className="rounded-lg border border-[#E4E7EC] bg-white px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Status</p>
                <p className="font-semibold text-[#16A34A]" style={{ fontSize: 'var(--body-font-size)' }}>Paid</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            ✓ Changes apply instantly and are saved automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

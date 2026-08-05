import { RiSettings3Line } from 'react-icons/ri'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Breadcrumb } from '../../../components/ui/breadcrumb'

export default function SettingsPage() {
  return (
    <div className="space-y-5 pb-10 select-none">
      <div>
        <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Settings' }]} />
        <h1 className="text-dashboard-title mt-1">Settings</h1>
        <p className="text-[13px] text-[#98A2B3] mt-0.5">Application preferences and configuration</p>
      </div>

      <Card>
        <CardHeader className="border-b border-[#F2F4F7] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6] text-[#6B7280] border border-[#E4E7EC]">
              <RiSettings3Line className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>System Preferences</CardTitle>
              <span className="mt-1 inline-flex items-center rounded-md border border-[#E4E7EC] bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-semibold text-[#6B7280]">
                Coming soon
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-[13px] text-[#98A2B3] leading-relaxed">
            Currency, account, and display preferences will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

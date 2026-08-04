import { RiSettings3Line } from 'react-icons/ri'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { Badge } from '../../../components/ui/badge'

export default function SettingsPage() {
  return (
    <div className="space-y-8 pb-16 select-none">
      <div className="space-y-2">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Settings' }]} />
        <h1 className="text-dashboard-title font-extrabold text-slate-900 tracking-tight">
          Settings
        </h1>
        <p className="text-body-copy font-medium text-slate-500">
          Application preferences and configuration
        </p>
      </div>

      <Card className="border border-slate-200/90 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <RiSettings3Line className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-card-title font-extrabold text-slate-900">System Preferences</CardTitle>
              <Badge variant="secondary" className="mt-1.5 text-[11px] font-bold px-2.5 py-0.5 bg-slate-100 text-slate-700">
                Coming soon
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <p className="text-body-copy font-medium text-slate-500 leading-relaxed">
            Settings for currency and account preferences will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
import { Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { Badge } from '../../../components/ui/badge'

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Settings' }]} />
        <p className="text-body-lg text-slate-500">Application preferences and configuration</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Settings className="h-9 w-9" strokeWidth={1.5} />
            </div>
            <div>
              <CardTitle>Settings</CardTitle>
              <Badge variant="secondary" className="mt-2">Coming soon</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-body text-slate-500">
            Settings for currency, notifications, and account preferences will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

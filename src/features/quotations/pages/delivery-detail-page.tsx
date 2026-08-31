import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Truck, Calendar, User, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { EmptyState } from '../../../components/ui/empty-state'
import { ErrorState } from '../../../components/ui/error-state'
import { Skeleton } from '../../../components/ui/skeleton'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { formatDate } from '../../../lib/utils'
import { useDelivery } from '../hooks/useDeliveries'

export default function DeliveryDetailPage() {
    const { id } = useParams()
    const { data: delivery, isLoading, isError, error } = useDelivery(id)

    if (isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-32" />
                <Skeleton className="h-64" />
            </div>
        )
    }

    if (isError) {
        return <ErrorState description={error instanceof Error ? error.message : 'Unable to load delivery'} />
    }

    if (!delivery) {
        return <EmptyState title="Delivery not found" description="It may have been removed." />
    }

    const totalPieces = delivery.items.reduce((s: number, i: any) => s + i.quantity, 0)

    return (
        <div className="space-y-5 pb-10">
            <div className="flex items-start gap-3">
                <Link to="/deliveries" className="mt-1 text-[#98A2B3] hover:text-[#374151] transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <Breadcrumb
                        items={[
                            { label: 'Dashboard', href: '/' },
                            { label: 'Deliveries', href: '/deliveries' },
                            { label: delivery.client_name },
                        ]}
                    />
                    <h1 className="text-dashboard-title mt-1">{delivery.client_name}</h1>
                    <p className="text-[13px] text-[#98A2B3] mt-0.5">
                        Gate Pass: <span className="font-mono">{delivery.gate_pass_id}</span>
                    </p>
                </div>
            </div>

            {/* Info Strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    { icon: Calendar, label: 'Delivery Date', value: formatDate(delivery.delivery_date) },
                    { icon: User, label: 'Delivered By', value: delivery.delivered_by },
                    { icon: User, label: 'Received By', value: delivery.received_by },
                    { icon: Package, label: 'Total Pieces', value: `${totalPieces} pcs` },
                ].map(({ icon: Icon, label, value }) => (
                    <Card key={label} className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-3.5 w-3.5 text-[#98A2B3]" />
                            <p className="text-[11px] text-[#98A2B3] font-medium uppercase tracking-wide">{label}</p>
                        </div>
                        <p className="text-[13px] font-semibold text-[#101828]">{value}</p>
                    </Card>
                ))}
            </div>

            {delivery.notes && (
                <Card className="p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#98A2B3] mb-1">Notes</p>
                    <p className="text-[13px] text-[#374151]">{delivery.notes}</p>
                </Card>
            )}

            {/* Items */}
            <Card>
                <CardHeader className="border-b border-[#F2F4F7] pb-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0FDF4] border border-[#BBF7D0]">
                            <Truck className="h-4 w-4 text-[#16A34A]" />
                        </div>
                        <CardTitle>Delivered Items</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="divide-y divide-[#F9FAFB]">
                        {delivery.items.map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between gap-3 py-3.5">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] font-bold text-[12px]">
                                        {item.item_name.charAt(0).toUpperCase()}
                                    </div>
                                    <p className="text-[13px] font-medium text-[#101828]">
                                        {item.item_name}
                                        {item.specification && (
                                            <span className="ml-2 inline-flex items-center rounded bg-[#FFF7ED] border border-[#FED7AA] px-1.5 py-0.5 text-[10px] font-semibold text-[#EA580C]">
                                                {item.specification}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <span className="text-[14px] font-semibold text-[#101828]">{item.quantity} pcs</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-[#E4E7EC] pt-3 mt-2 flex items-center justify-between">
                        <span className="text-[13px] text-[#6B7280]">Total</span>
                        <span className="text-[15px] font-bold text-[#101828]">{totalPieces} pieces</span>
                    </div>
                </CardContent>
            </Card>

            {/* Link to Gate Pass */}
            <Card className="p-4 border-[#BFDBFE] bg-[#EFF6FF]">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[12px] font-semibold text-[#2563EB] uppercase tracking-wide mb-0.5">Associated Gate Pass</p>
                        <p className="text-[13px] font-mono text-[#374151]">{delivery.gate_pass_id}</p>
                    </div>
                    <Link to={`/gate-passes/${delivery.gate_pass_id}`}>
                        <button className="text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] transition cursor-pointer">
                            View →
                        </button>
                    </Link>
                </div>
            </Card>
        </div>
    )
}

import {
  FilePlus,
  Eye,
  Pencil as PencilSimple,
  Trash2 as Trash,
  FileText,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { ConfirmDialog } from '../../../components/ui/confirm-dialog'
import { EmptyState } from '../../../components/ui/empty-state'
import { SkeletonTable } from '../../../components/ui/skeleton'
import { PageHeader } from '../../../components/ui/page-header'
import { FilterBar, FilterChip } from '../../../components/ui/filter-bar'
import { Toolbar, ToolbarGroup, SearchInput } from '../../../components/ui/toolbar'
import { DataTable, type Column } from '../../../components/ui/data-table'
import { RowActions, type MenuGroup } from '../../../components/ui/dropdown-menu'
import { Badge, type BadgeTone } from '../../../components/ui/badge'
import { Pagination } from '../../../components/ui/pagination'
import { ExportButton } from '../../../components/ui/export-button'
import { ORDER_STATUSES } from '../../../types/quotation'
import type { Quotation } from '../../../types/quotation'
import { useDeleteQuotation, useQuotations } from '../hooks/useQuotations'
import { QuotationPreviewDialog } from '../components/quotation-preview-dialog'
import {
  BulkActionBar, ColumnVisibilityMenu, CopyIdButton, DateRangeFilter, DensityToggle,
  InlineRetry, PageSizeSelect, RowDetailDrawer, SelectionCheckbox, SkipPaginationLink,
  SortableHeader, TruncatedText,
} from '../../feature-pack/components'
import {
  useNotify, useStaleWhileRevalidate, useTableController,
} from '../../feature-pack/hooks'
import {
  aggregateNestedItems, formatCurrency, formatDate, formatNumber, normalizeItems,
  toCSV, toJSON,
} from '../../feature-pack/utils'

/** Order status → badge tone. Grouped by meaning, not by hue. */
const STATUS_TONE: Record<string, BadgeTone> = {
  draft: 'neutral',
  sent: 'info',
  accepted: 'success',
  archived: 'neutral',
  received: 'info',
  washing: 'info',
  pressing: 'info',
  folding: 'info',
  packing: 'info',
  ready: 'success',
  out_for_delivery: 'info',
  delivered: 'success',
  cancelled: 'danger',
}

const STATUS_LABEL: Record<string, string> = {
  out_for_delivery: 'Out for delivery',
}

const label = (s: string) => STATUS_LABEL[s] ?? s.replace(/_/g, ' ')

const ariaSort = (sort: { key: string; direction: 'asc' | 'desc' } | null, key: string) =>
  sort?.key === key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'

const TOGGLEABLE_COLUMNS = ['client_name', 'status', 'line_items', 'updated_at'] as const

function downloadText(content: string, filename: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export default function QuotationsPage() {
  const navigate = useNavigate()
  const notify = useNotify()
  const query = useQuotations()
  const swr = useStaleWhileRevalidate(query)
  const deleteMutation = useDeleteQuotation()

  const [preview, setPreview] = useState<Quotation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // A null collection from the API must never reach a table render. The
  // normaliser also repairs each row's line_items array.
  const rows = useMemo(() => normalizeItems<Quotation>(swr.data), [swr.data])

  const searchable = useCallback(
    (quotation: Quotation) => [
      quotation.client_name ?? '',
      quotation.quotation_title ?? '',
      ...normalizeItems<{ item_name?: string }>(quotation.line_items).map((line) => line.item_name ?? ''),
    ].join(' '),
    [],
  )
  const filterDate = useCallback(
    (quotation: Quotation) => quotation.updated_at ?? quotation.created_at,
    [],
  )

  const table = useTableController<Quotation>({
    rows,
    keyOf: (quotation) => String(quotation.id),
    searchable,
    filterDate,
    initialSort: { key: 'client_name', direction: 'asc' },
  })

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const quotation of table.rows) {
      if (quotation.status) map.set(quotation.status, (map.get(quotation.status) ?? 0) + 1)
    }
    return map
  }, [table.rows])

  const exportRows = useMemo(() => {
    const source = table.selected.size > 0
      ? table.filtered.filter((quotation) => table.selected.has(String(quotation.id)))
      : table.filtered
    return source.map((quotation) => ({
      id: String(quotation.id),
      client_name: quotation.client_name ?? '',
      quotation_title: quotation.quotation_title ?? '',
      status: quotation.status ?? '',
      items: normalizeItems<{ item_name?: string }>(quotation.line_items).length,
      updated_at: formatDate(quotation.updated_at ?? quotation.created_at),
    }))
  }, [table.filtered, table.selected])

  const exportColumns = useMemo(
    () => [
      { key: 'id', label: 'ID' },
      { key: 'client_name', label: 'Client' },
      { key: 'quotation_title', label: 'Title' },
      { key: 'status', label: 'Status' },
      { key: 'items', label: 'Items' },
      { key: 'updated_at', label: 'Updated' },
    ],
    [],
  )

  const exportCSV = () => {
    downloadText(toCSV(exportRows, exportColumns), 'quotations.csv', 'text/csv;charset=utf-8')
    notify.success(`${exportRows.length} quotations exported as CSV`)
  }
  const exportJSON = () => {
    downloadText(toJSON(exportRows, exportColumns), 'quotations.json', 'application/json')
    notify.success(`${exportRows.length} quotations exported as JSON`)
  }

  const retry = useCallback(async () => {
    await query.refetch()
    setLastUpdated(new Date())
  }, [query])

  const rowActions = (quotation: Quotation): MenuGroup[] => [
    {
      items: [
        {
          id: 'detail',
          label: 'Row details',
          icon: <Eye size={16} />,
          onSelect: () => table.setDetail(quotation),
        },
        {
          id: 'preview',
          label: 'Quick preview',
          icon: <Eye size={16} />,
          onSelect: () => setPreview(quotation),
        },
        {
          id: 'view',
          label: 'Open',
          icon: <FileText size={16} />,
          onSelect: () => navigate(`/quotations/${quotation.id}`),
        },
        {
          id: 'edit',
          label: 'Edit',
          icon: <PencilSimple size={16} />,
          onSelect: () => navigate(`/quotations/${quotation.id}/edit`),
        },
        {
          id: 'delete',
          label: 'Delete',
          icon: <Trash size={16} />,
          destructive: true,
          onSelect: () => setDeleteTarget(quotation),
        },
      ],
    },
  ]

  const baseColumns: Column<Quotation>[] = [
    {
      key: '_select',
      header: (
        <SelectionCheckbox
          checked={table.selection.all}
          indeterminate={table.selection.some}
          onChange={table.toggleAll}
          label={table.selection.all ? 'Clear all rows on this page' : 'Select all rows on this page'}
        />
      ),
      width: '40px',
      render: (quotation) => (
        <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
          <SelectionCheckbox
            checked={table.selected.has(String(quotation.id))}
            onChange={() => table.toggleRow(String(quotation.id))}
            label={`Select ${quotation.client_name ?? 'quotation'}`}
          />
        </div>
      ),
    },
    {
      key: 'client_name',
      header: (
        <SortableHeader
          label="Client"
          active={table.sort?.key === 'client_name'}
          direction={table.sort?.direction}
          onClick={() => table.toggleSort('client_name')}
        />
      ),
      sortDirection: ariaSort(table.sort, 'client_name'),
      render: (quotation) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-[var(--text-primary)]">
            <TruncatedText text={quotation.client_name ?? '(no name)'} max={60} />
          </p>
          {quotation.quotation_title && (
            <p className="truncate text-[11.5px] text-[var(--text-muted)]">
              <TruncatedText text={quotation.quotation_title} max={70} />
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: (
        <SortableHeader
          label="Status"
          active={table.sort?.key === 'status'}
          direction={table.sort?.direction}
          onClick={() => table.toggleSort('status')}
        />
      ),
      sortDirection: ariaSort(table.sort, 'status'),
      width: '160px',
      render: (quotation) =>
        quotation.status ? (
          <Badge size="xs" tone={STATUS_TONE[quotation.status] ?? 'neutral'} dot>
            {label(quotation.status)}
          </Badge>
        ) : (
          <span className="text-[12px] text-[var(--text-faint)]">—</span>
        ),
    },
    {
      key: 'line_items',
      header: (
        <SortableHeader
          label="Items"
          active={table.sort?.key === 'line_items'}
          direction={table.sort?.direction}
          onClick={() => table.toggleSort('line_items')}
        />
      ),
      sortDirection: ariaSort(table.sort, 'line_items'),
      numeric: true,
      width: '80px',
      render: (quotation) => formatNumber(normalizeItems(quotation.line_items).length),
    },
    {
      key: 'updated_at',
      header: (
        <SortableHeader
          label="Updated"
          active={table.sort?.key === 'updated_at'}
          direction={table.sort?.direction}
          onClick={() => table.toggleSort('updated_at')}
        />
      ),
      sortDirection: ariaSort(table.sort, 'updated_at'),
      width: '140px',
      render: (quotation) => (
        <span className="text-[12.5px] whitespace-nowrap text-[var(--text-tertiary)]">
          {formatDate(quotation.updated_at ?? quotation.created_at)}
        </span>
      ),
    },
    {
      key: '_id',
      header: <span className="sr-only">Record ID</span>,
      align: 'center',
      width: '44px',
      render: (quotation) => (
        <div onClick={(event) => event.stopPropagation()}>
          <CopyIdButton id={String(quotation.id)} label="Quotation" />
        </div>
      ),
    },
    {
      key: '_actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      width: '56px',
      render: (quotation) => (
        <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
          <RowActions groups={rowActions(quotation)} label={`Actions for ${quotation.client_name}`} />
        </div>
      ),
    },
  ]

  const columns = useMemo(
    () => baseColumns.filter((column) => !table.hidden.has(column.key)),
    // The action closures are intentionally rebuilt with the row context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table.hidden, table.selected, table.sort, navigate],
  )

  const detailRow = table.detail ? aggregateNestedItems(table.detail) : null
  const detailItems = detailRow ? normalizeItems<{
    item_name?: string
    unit_price?: number | string
  }>(detailRow.line_items) : []
  const detailTotal = detailItems.reduce(
    (sum, line) => sum + (Number(line.unit_price) || 0),
    0,
  )

  if (swr.isLoading) return <SkeletonTable rows={6} cols={5} dense={table.density === 'compact'} />

  if (swr.isError) {
    return (
      <InlineRetry
        error={swr.error}
        onRetry={() => void retry()}
        label="quotations"
      />
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quotations"
        subtitle="Every hotel and client price list, with its current order status."
        actions={
          <Button asChild>
            <Link to="/quotations/new">
              <FilePlus size={16} aria-hidden />
              New quotation
            </Link>
          </Button>
        }
      />

      <Toolbar>
        <ToolbarGroup className="sm:max-w-xs">
          <div data-feature-search="true">
            <SearchInput
              value={table.rawSearch}
              onValueChange={table.setRawSearch}
              placeholder="Search client, title or item…"
            />
          </div>
        </ToolbarGroup>

        <ToolbarGroup className="min-w-0 flex-1">
          <FilterBar>
            <FilterChip
              label="All"
              count={table.rows.length}
              active={table.status === 'all'}
              onClick={() => table.setStatus('all')}
            />
            {ORDER_STATUSES.map((item) => (
              <FilterChip
                key={item}
                label={label(item)}
                count={counts.get(item) ?? 0}
                active={table.status === item}
                onClick={() => table.setStatus(table.status === item ? 'all' : item)}
              />
            ))}
          </FilterBar>
        </ToolbarGroup>

        <ToolbarGroup align="end">
          {swr.isRefreshing && (
            <span role="status" className="text-[11.5px] text-[var(--text-faint)]">
              Refreshing cached data…
            </span>
          )}
          <DateRangeFilter value={table.dateRange} onChange={table.setDateRange} />
          <ColumnVisibilityMenu
            columns={TOGGLEABLE_COLUMNS}
            hidden={table.hidden}
            onToggle={table.toggleColumn}
          />
          <DensityToggle value={table.density} onChange={table.setDensity} />
          <ExportButton
            data={exportRows}
            columns={exportColumns}
            filename="quotations"
            disabled={exportRows.length === 0}
          />
          <span className="text-[12px] tabular-nums whitespace-nowrap text-[var(--text-muted)]">
            {table.isFiltered ? `${table.total} of ${table.rows.length}` : `${table.rows.length} total`}
          </span>
        </ToolbarGroup>
      </Toolbar>

      {table.selection.count > 0 && (
        <BulkActionBar
          count={table.selection.count}
          onClear={table.clearSelection}
          onExportCsv={exportCSV}
          onExportJson={exportJSON}
        />
      )}

      <DataTable
        columns={columns}
        data={table.pageRows}
        rowKey={(quotation) => String(quotation.id)}
        onRowClick={(quotation) => navigate(`/quotations/${quotation.id}`)}
        mobilePrimary={['client_name', 'status']}
        mobileHidden={['_select', '_actions', '_id']}
        dense={table.density === 'compact'}
        caption={`${table.total} quotation${table.total === 1 ? '' : 's'}, page ${table.range.page} of ${table.range.pageCount}`}
        emptyState={
          table.isFiltered ? (
            <EmptyState
              icon={<FileText size={22} />}
              title="No quotations match"
              description="Clear the search, date range or status filter."
              action={
                <Button variant="secondary" size="sm" onClick={table.reset}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<FileText size={22} />}
              title="No quotations yet"
              description="Create a price list for a client to get started."
              action={
                <Button asChild size="sm">
                  <Link to="/quotations/new">Create quotation</Link>
                </Button>
              }
            />
          )
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <SkipPaginationLink />
        <PageSizeSelect value={table.pageSize} onChange={table.setPageSize} />
        <div id="table-pagination" className="min-w-0 flex-1">
          <Pagination
            total={table.total}
            limit={table.pageSize}
            offset={table.range.offset}
            onChange={table.setOffset}
            itemLabel="quotations"
          />
        </div>
        {lastUpdated && (
          <span className="hidden text-[11px] tabular-nums text-[var(--text-faint)] lg:inline">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      <QuotationPreviewDialog
        quotation={preview}
        open={Boolean(preview)}
        onOpenChange={(open) => !open && setPreview(null)}
      />

      <RowDetailDrawer
        open={Boolean(detailRow)}
        onOpenChange={(open) => !open && table.setDetail(null)}
        title={detailRow?.client_name ?? 'Quotation'}
        subtitle={detailRow?.quotation_title ?? 'Price list'}
        fields={[
          { label: 'Status', value: detailRow?.status ? label(detailRow.status) : '—' },
          { label: 'Items', value: formatNumber(detailItems.length) },
          { label: 'List total', value: formatCurrency(detailTotal) },
          { label: 'Created', value: formatDate(detailRow?.created_at) },
          { label: 'Updated', value: formatDate(detailRow?.updated_at ?? detailRow?.created_at) },
          { label: 'Record ID', value: <span className="font-mono text-[11px]">{String(detailRow?.id ?? '—')}</span> },
        ]}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete quotation?"
        message={
          deleteTarget
            ? `${deleteTarget.client_name}${deleteTarget.quotation_title ? ` — ${deleteTarget.quotation_title}` : ''} will be permanently deleted. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          deleteMutation.mutate(String(deleteTarget.id), {
            onSettled: () => setDeleteTarget(null),
          })
          notify.success('Quotation deleted')
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

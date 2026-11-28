import { useState, useRef, useEffect, useCallback, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QRCodeSVG } from 'qrcode.react'
import JsBarcode from 'jsbarcode'
import { useGenerateTags } from '../hooks/useLinen'
import { checkLetters } from '../lib/linen-code'
import { buildTagPrintHtml, type PrintableTag } from '../lib/tag-print'
import { entityId, type RegistryEntity } from '../../platform/services/entity-registry.service'
import { listAllHotels } from '../lib/hotel-registry'
import { LINEN_CATEGORIES } from '../../../types/linen'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Breadcrumb } from '../../../components/ui/breadcrumb'
import { Printer, Plus, CheckCircle } from 'lucide-react'
import { formatDayMonthYear, todayISO } from '../../../lib/time'

interface TagItem {
  linen_id: string
  category: string
  item_type: string
  client_name: string
}

/** Mirrors `item_code()` in bill-service so the preview matches printed tags. */
const ITEM_CODE_BY_CATEGORY: Record<string, string> = {
  BEDSHEET: 'BS', PILLOWCASE: 'PC', TOWEL: 'TW', DUVET_COVER: 'DC',
  BATH_MAT: 'BM', UNIFORM: 'UN', TABLECLOTH: 'TC', NAPKIN: 'NK',
  ROBE: 'RB', SLIPPER: 'SL', OTHER: 'OT',
}

/** Mirrors `structured_linen_id()` in bill-service: series letter + four
 * digits + two check letters. The preview must match the printed tag exactly. */
function previewTag(category: string, hotelCode: string, startNumber: number): string {
  const sequence = Math.max(1, Math.min(259974, Math.floor(startNumber) || 1))
  const offset = sequence - 1
  const series = String.fromCharCode(65 + Math.floor(offset / 9999))
  const number = String((offset % 9999) + 1).padStart(4, '0')
  const base = `${ITEM_CODE_BY_CATEGORY[category] || 'OT'}${(hotelCode || 'G').toUpperCase()}-${series}${number}`
  return base + checkLetters(base)
}

function generateBarcodeSvgString(value: string): string {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  JsBarcode(svg, value, { format: 'CODE128', width: 1.5, height: 30, displayValue: false, margin: 0 })
  return svg.outerHTML
}

function TagCard({ tag }: { tag: TagItem }) {
  const barcodeRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, tag.linen_id, {
        format: 'CODE128',
        width: 1.5,
        height: 30,
        displayValue: false,
        margin: 0,
      })
    }
  }, [tag.linen_id])

  return (
    <div className="border-2 border-black p-3 flex flex-col items-center gap-1 bg-white" style={{ width: '70mm', height: '38mm', pageBreakInside: 'avoid' }}>
      <p className="text-[8px] font-bold uppercase tracking-widest">Love Laundry</p>
      <QRCodeSVG value={tag.linen_id} size={50} level="M" />
      <svg ref={barcodeRef} style={{ width: '80%', height: 20 }} />
      <p className="text-[9px] font-bold font-mono tracking-wider">{tag.linen_id}</p>
    </div>
  )
}

export default function LinenTagGenerator() {
  const [category, setCategory] = useState('BEDSHEET')
  const [itemType, setItemType] = useState('')
  const [hotels, setHotels] = useState<RegistryEntity[]>([])
  const [loadingHotels, setLoadingHotels] = useState(true)
  const [hotelsError, setHotelsError] = useState('')
  const [selectedHotelId, setSelectedHotelId] = useState('')
  const [quantity, setQuantity] = useState(10)
  const [startNumber, setStartNumber] = useState(1)
  const [size, setSize] = useState('')
  const [color, setColor] = useState('')
  const [department, setDepartment] = useState('')
  const [generatedTags, setGeneratedTags] = useState<TagItem[]>([])
  const generateMutation = useGenerateTags()

  useEffect(() => {
    let active = true
    setLoadingHotels(true)
    setHotelsError('')
    listAllHotels()
      .then(data => {
        if (!active) return
        setHotels(data)
        setLoadingHotels(false)
      })
      .catch(() => {
        if (!active) return
        setHotels([])
        setHotelsError('Could not load hotels. Check the hotels list and try again.')
        setLoadingHotels(false)
      })
    return () => { active = false }
  }, [])

  const selectedHotel = hotels.find(hotel => entityId(hotel) === selectedHotelId)
  const hotelCode = selectedHotel?.hotel_code?.trim().toUpperCase() || ''

  const handleGenerate = () => {
    if (!itemType || !selectedHotel || !hotelCode || quantity <= 0) return
    generateMutation.mutate(
      {
        category,
        item_type: itemType,
        client_name: selectedHotel.name,
        quantity,
        start_number: startNumber,
        hotel_id: entityId(selectedHotel),
        hotel_code: hotelCode,
        size: size || undefined,
        color: color || undefined,
        department: department || undefined,
      },
      {
        onSuccess: (data) => {
          setGeneratedTags(data.items.map(i => ({
            linen_id: i.linen_id,
            category: i.category,
            item_type: i.item_type,
            client_name: i.client_name,
          })))
        },
      }
    )
  }

  const handlePrint = useCallback(() => {
    if (!generatedTags.length) return

    // Build the whole job up front from the generated IDs. No waiting for the
    // preview to render QR codes, so every tag prints in one go even for a
    // batch of thousands.
    const printable: PrintableTag[] = generatedTags.map(tag => ({
      linen_id: tag.linen_id,
      qrSvg: renderToStaticMarkup(
        createElement(QRCodeSVG, { value: tag.linen_id, size: 50, level: 'M' }),
      ),
      barcodeSvg: generateBarcodeSvgString(tag.linen_id),
    }))
    const html = buildTagPrintHtml(
      printable,
      `Printed ${formatDayMonthYear(todayISO())}`,
      `${generatedTags[0]?.client_name || 'Love Laundry'} — Linen Tags`,
    )

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.open()
      printWindow.document.write(html)
      printWindow.document.close()
      return
    }

    // Pop-up blocked: use a hidden same-origin frame for the same print job.
    const frame = document.createElement('iframe')
    frame.setAttribute('aria-hidden', 'true')
    frame.style.position = 'fixed'
    frame.style.width = '0'
    frame.style.height = '0'
    frame.style.border = '0'
    document.body.appendChild(frame)
    const frameDocument = frame.contentWindow?.document
    if (!frameDocument) {
      frame.remove()
      return
    }
    frameDocument.open()
    frameDocument.write(html)
    frameDocument.close()
    frame.contentWindow?.focus()
    frame.contentWindow?.addEventListener('afterprint', () => frame.remove(), { once: true })
  }, [generatedTags])

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: 'Linen' }, { label: 'Tag Generator' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: '"Spectral", Georgia, serif' }}>Generate Linen Tags</h1>
          <p className="text-sm text-[var(--text-muted)]">Create linen IDs and preview printable tags</p>
        </div>
        {generatedTags.length > 0 && (
          <Button onClick={handlePrint}>
            <Printer size={16} className="mr-2" />
            Print all {generatedTags.length} tags
          </Button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Form */}
        <Card className="lg:w-96 border border-[var(--border)] shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--danger)]/20 focus:border-[var(--danger)] transition-colors">
                {LINEN_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5 block">Item Type *</label>
              <input value={itemType} onChange={e => setItemType(e.target.value)} placeholder="e.g. King Bedsheet"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--danger)]/20 focus:border-[var(--danger)] transition-colors" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5 block">Hotel / Owner *</label>
              <select value={selectedHotelId} onChange={e => setSelectedHotelId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--danger)]/20 focus:border-[var(--danger)] transition-colors">
                <option value="">{hotels.length ? 'Select a hotel record' : loadingHotels ? 'Loading hotel records...' : hotelsError ? 'Hotels unavailable' : 'No hotels found'}</option>
                {hotels.map(hotel => (
                  <option key={entityId(hotel)} value={entityId(hotel)}>
                    {hotel.name}{hotel.hotel_code ? ` — ${hotel.hotel_code}` : ' — no code'}
                  </option>
                ))}
              </select>
              {hotelsError ? (
                <p className="mt-1 text-[11px] text-[var(--danger)]" role="alert">{hotelsError}</p>
              ) : null}
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                Hotel code is read from the selected hotels list record. Tags will look like <span className="font-mono font-semibold">{previewTag(category, hotelCode, startNumber)}</span>.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5 block">Quantity *</label>
                <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={1} max={10000}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--danger)]/20 focus:border-[var(--danger)] transition-colors" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5 block">Start number *</label>
                <input type="number" value={startNumber} onChange={e => setStartNumber(Math.max(1, Number(e.target.value) || 1))} min={1} max={259974}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--danger)]/20 focus:border-[var(--danger)] transition-colors" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5 block">Size</label>
                <input value={size} onChange={e => setSize(e.target.value)} placeholder="e.g. King"
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--danger)]/20 focus:border-[var(--danger)] transition-colors" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5 block">Color</label>
                <input value={color} onChange={e => setColor(e.target.value)} placeholder="e.g. White"
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--danger)]/20 focus:border-[var(--danger)] transition-colors" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1.5 block">Department</label>
              <input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Housekeeping"
                className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--danger)]/20 focus:border-[var(--danger)] transition-colors" />
            </div>
            <Button onClick={handleGenerate} disabled={!itemType || !hotelCode || quantity <= 0 || generateMutation.isPending} className="w-full">
              <Plus size={16} className="mr-2" />
              {generateMutation.isPending ? 'Generating...' : `Generate ${quantity} Tags`}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="flex-1">
          {generatedTags.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-semibold">
                  <CheckCircle size={12} /> {generatedTags.length} tags ready to print together
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {generatedTags.map(tag => <TagCard key={tag.linen_id} tag={tag} />)}
              </div>
            </div>
          ) : (
            <Card className="border border-[var(--border)] shadow-sm">
              <CardContent className="p-12 text-center">
                <Printer size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
                <p className="text-sm text-[var(--text-muted)]">Fill in the form and click Generate to preview tags</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

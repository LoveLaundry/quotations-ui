/**
 * One print job for every generated linen tag.
 *
 * The generator used to collect QR SVGs from the preview DOM one card at a
 * time. A batch of hundreds (or the 10,000 the API allows) made that loop
 * re-render the whole preview on every capture, so the print button often stayed
 * on "Loading..." forever. Here the print document is built from plain strings
 * in one pass: every tag goes into the same job, in order, with no dependency
 * on what the preview has rendered.
 */

export interface PrintableTag {
  linen_id: string
  /** Static SVG markup for the QR code (generated outside this helper). */
  qrSvg: string
  /** Static SVG markup for the CODE128 barcode. */
  barcodeSvg: string
}

/** Escape text before it is written into the print document. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Build a complete, self-contained HTML document containing all the tags.
 * Kept free of DOM and React so it can be unit tested and reused by the print
 * button and any future "download labels" action.
 */
export function buildTagPrintHtml(
  tags: PrintableTag[],
  printedDate: string,
  title = 'Love Laundry — Linen Tags',
): string {
  const cards = tags.map(tag => `
        <div class="tag-card">
          <div class="tag-brand">LOVE LAUNDRY</div>
          <div class="tag-qr">${tag.qrSvg}</div>
          <div class="tag-barcode">${tag.barcodeSvg}</div>
          <div class="tag-id">${escapeHtml(tag.linen_id)}</div>
        </div>`).join('')

  return `<!DOCTYPE html>
<html><head><title>Linen Tags</title>
<style>
  @page { size: A4; margin: 8mm; }
  body { margin: 0; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; }
  .print-header {
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 2px solid #000; padding-bottom: 2mm; margin-bottom: 4mm;
    font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;
  }
  .print-header .muted { font-weight: normal; color: #444; letter-spacing: 0; text-transform: none; }
  /* Inline blocks paginate reliably; flex/grid rows are often clipped at a
     page boundary by browser print engines. Three 63mm cards fit an A4 page. */
  .tags-grid { font-size: 0; }
  .tag-card {
    display: inline-block; vertical-align: top;
    width: 63mm; height: 33mm; margin: 0 1mm 2.5mm 0; padding: 2.5mm;
    border: 2px solid #000; box-sizing: border-box; background: #FFF;
    break-inside: avoid; page-break-inside: avoid;
  }
  .tag-brand { font-size: 7px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; font-family: 'Courier New', monospace; }
  .tag-qr { line-height: 0; }
  .tag-qr svg { display: block; }
  .tag-barcode { width: 80%; line-height: 0; }
  .tag-barcode svg { width: 100%; height: 22px; }
  .tag-id { margin-top: 1mm; font-size: 9px; font-weight: bold; letter-spacing: 1px; font-family: 'Courier New', monospace; }
  .page-note { clear: both; font-size: 8px; color: #666; margin-top: 4mm; }
</style></head><body>
<div class="print-header"><span>${escapeHtml(title)}</span><span class="muted">${escapeHtml(printedDate)} · ${tags.length} tag${tags.length === 1 ? '' : 's'}</span></div>
<div class="tags-grid">${cards}
</div>
<div class="page-note">One label per linen item. Scan only tags carrying a current checksummed ID.</div>
<script>
  // Inline SVGs need no network load; one print call covers the whole batch.
  // The guard makes sure the batch is never sent to the printer twice.
  var llPrinted = false;
  function llPrintAll() {
    if (llPrinted) return;
    llPrinted = true;
    window.print();
  }
  if (document.readyState === 'complete') llPrintAll();
  else window.addEventListener('load', llPrintAll);
  setTimeout(llPrintAll, 1500);
<\/script></body></html>`
}

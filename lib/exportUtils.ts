// Client-side export generators for booking history (TXT / PDF / DOCX).
// All functions run in the browser; heavy libraries are imported on demand.

export interface ExportRow {
  id: string;
  date: string;
  time: string;
  client: string;
  email: string;
  phone: string;
  shop: string;
  services: string;
  price: number;
  status: string;
}

export interface ExportMeta {
  title: string;
  shopName: string;
  period: string;
  generatedAt: string;
  totalBookings: number;
  totalRevenue: number;
  totalDuration: number; // minutes
}

/** Which columns appear in the exported report (role-aware). */
export interface ExportOptions {
  includeBookingId: boolean;
  includeContact: boolean;
  includeShop: boolean;
}

export const SHOP_EXPORT_OPTIONS: ExportOptions = {
  includeBookingId: false,
  includeContact: false,
  includeShop: false,
};

export const ADMIN_EXPORT_OPTIONS: ExportOptions = {
  includeBookingId: true,
  includeContact: true,
  includeShop: true,
};

const CURRENCY = "₹";

export function formatMoney(n: number): string {
  return `${CURRENCY}${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Formats "YYYY-MM-DD" → "01 Jul 2026" (safe against invalid input). */
export function formatDisplayDate(iso: string): string {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[parseInt(m, 10) - 1] || m;
  return `${parseInt(d, 10)} ${month} ${y}`;
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    confirmed: "Booked",
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
    no_show: "Not Arrive",
  };
  return map[status] || status || "Unknown";
}

/**
 * Builds the shared export rows from enriched booking objects.
 * Each service becomes its own line: "Haircut — ₹300.00 (30m)"
 */
export function buildExportRows(bookings: any[]): ExportRow[] {
  return bookings.map((b) => {
    const services =
      b.services && b.services.length > 0
        ? b.services
            .map(
              (s: any) =>
                `${s.name || "Service"} — ${formatMoney(Number(s.price) || 0)} (${Number(s.duration) || 30}m)`
            )
            .join("\n")
        : "—";
    return {
      id: b.id || "",
      date: formatDisplayDate(b.slotDate),
      time: b.slotStartTime || "-",
      client: b.user?.name || "Unknown",
      email: b.user?.email || "",
      phone: b.user?.phone || "",
      shop: b.shopName || b.shop?.shopName || "-",
      services,
      price: Number(b.totalPrice) || 0,
      status: statusLabel(b.status),
    };
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ─────────────────────────── Column config ───────────────────────────

interface Column {
  header: string;
  width: number;
  value: (r: ExportRow, idx: number) => string;
}

function buildColumns(opts: ExportOptions, priceFn: (n: number) => string = formatMoney): Column[] {
  const cols: Column[] = [{ header: "#", width: 4, value: (_r, i) => String(i + 1) }];
  if (opts.includeBookingId) cols.push({ header: "Booking ID", width: 18, value: (r) => r.id });
  cols.push({ header: "Date", width: 12, value: (r) => r.date });
  cols.push({ header: "Time", width: 10, value: (r) => r.time });
  if (opts.includeShop) cols.push({ header: "Shop", width: 20, value: (r) => r.shop });
  cols.push({ header: "Client", width: 18, value: (r) => r.client });
  if (opts.includeContact) cols.push({ header: "Contact", width: 24, value: (r) => r.phone || r.email || "-" });
  cols.push({ header: "Services", width: 36, value: (r) => r.services });
  cols.push({ header: "Price", width: 12, value: (r) => priceFn(r.price) });
  cols.push({ header: "Status", width: 10, value: (r) => r.status });
  return cols;
}

/** Truncates a single text line so aligned text tables stay tidy. */
function fitLine(s: string, width: number): string {
  const clean = s.replace(/\n/g, " ");
  if (clean.length <= width) return clean.padEnd(width);
  return clean.slice(0, Math.max(0, width - 1)) + "…";
}

// ─────────────────────────── TXT ───────────────────────────

export function buildTxtContent(meta: ExportMeta, rows: ExportRow[], opts: ExportOptions): string {
  const cols = buildColumns(opts);
  const widths = cols.map((c) => c.width);
  const W = widths.reduce((a, b) => a + b, 0) + (cols.length - 1);
  const rule = "=".repeat(W);
  const thin = "-".repeat(W);

  const lines: string[] = [];
  lines.push(rule);
  const title = meta.title.toUpperCase();
  const leftPad = Math.max(0, Math.floor((W - title.length) / 2));
  lines.push(" ".repeat(leftPad) + title);
  lines.push(rule);
  lines.push(`Shop           : ${meta.shopName || "-"}`);
  lines.push(`Period         : ${meta.period}`);
  lines.push(`Generated      : ${meta.generatedAt}`);
  lines.push(`Total Bookings : ${meta.totalBookings}`);
  lines.push(`Total Revenue  : ${formatMoney(meta.totalRevenue)}`);
  lines.push(`Total Duration : ${meta.totalDuration} minutes`);
  lines.push(rule);
  lines.push("");
  lines.push("BOOKING DETAILS");
  lines.push(thin);

  // Header
  lines.push(cols.map((c) => c.header.padEnd(c.width)).join(" ").trimEnd());
  lines.push(thin);

  // Rows (support multi-line cells, e.g. one service per line)
  rows.forEach((r, idx) => {
    const cellLines = cols.map((c) => c.value(r, idx).split("\n"));
    const lineCount = Math.max(...cellLines.map((arr) => arr.length));
    for (let li = 0; li < lineCount; li++) {
      const parts = cols.map((c, ci) => {
        const text = li < cellLines[ci].length ? cellLines[ci][li] : "";
        return fitLine(text, c.width);
      });
      lines.push(parts.join(" ").trimEnd());
    }
  });

  lines.push(thin);
  lines.push(`TOTAL: ${rows.length} bookings  |  ${formatMoney(meta.totalRevenue)}`);
  lines.push(rule);
  lines.push("");
  lines.push("Generated by BarberBook");

  return lines.join("\n");
}

export function downloadTxt(meta: ExportMeta, rows: ExportRow[], filename: string, opts: ExportOptions) {
  const content = buildTxtContent(meta, rows, opts);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, filename);
}

// ─────────────────────────── PDF ───────────────────────────

// jsPDF's built-in Helvetica only covers WinAnsi/Latin-1, where the ₹ (U+20B9)
// glyph does not exist — it would render as a garbage box. Use "Rs." in PDFs
// so prices stay readable; TXT/DOCX keep the real ₹ symbol.
function pdfMoney(n: number): string {
  return `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function downloadPdf(meta: ExportMeta, rows: ExportRow[], filename: string, opts: ExportOptions) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  // buildExportRows formats services with ₹ (U+20B9), which has no glyph in
  // jsPDF's WinAnsi Helvetica — substitute it here so every cell stays readable.
  const rowsForPdf = rows.map((r) => ({ ...r, services: r.services.replace(/₹/g, "Rs. ") }));

  const cols = buildColumns(opts, pdfMoney);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(meta.title, 40, 45);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Shop: ${meta.shopName || "-"}`, 40, 62);
  doc.text(`Period: ${meta.period}`, 40, 76);
  doc.text(`Generated: ${meta.generatedAt}`, 40, 90);
  doc.text(
    `Total Bookings: ${meta.totalBookings}    |    Total Revenue: ${pdfMoney(meta.totalRevenue)}    |    Total Duration: ${meta.totalDuration} min`,
    40,
    104
  );

  autoTable(doc, {
    startY: 118,
    head: [cols.map((c) => c.header)],
    body: rowsForPdf.map((r, idx) => cols.map((c) => c.value(r, idx))),
    styles: { fontSize: 8, cellPadding: 4, valign: "top" },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    margin: { left: 40, right: 40 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 118;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Total: ${rows.length} bookings  |  ${pdfMoney(meta.totalRevenue)}`, 40, finalY + 20);
  doc.text("Generated by BarberBook", pageWidth - 40, finalY + 20, { align: "right" });

  doc.save(filename);
}

// ─────────────────────────── DOCX ───────────────────────────

export async function downloadDocx(meta: ExportMeta, rows: ExportRow[], filename: string, opts: ExportOptions) {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } =
    await import("docx");

  const cell = (text: string, cellOpts: { bold?: boolean; fill?: string } = {}) =>
    new TableCell({
      shading: cellOpts.fill ? { type: "clear", fill: cellOpts.fill } : undefined,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: String(text || " ")
        .split("\n")
        .map(
          (line) =>
            new Paragraph({ children: [new TextRun({ text: line || " ", bold: cellOpts.bold })] })
        ),
    });

  const cols = buildColumns(opts);

  const headerRow = new TableRow({
    tableHeader: true,
    children: cols.map((c) => cell(c.header, { bold: true, fill: "EEEEF6" })),
  });

  const bodyRows = rows.map(
    (r, idx) =>
      new TableRow({
        children: cols.map((c) => cell(c.value(r, idx))),
      })
  );

  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: meta.title, bold: true })],
          }),
          new Paragraph({ text: `Shop: ${meta.shopName || "-"}`, spacing: { after: 60 } }),
          new Paragraph({ text: `Period: ${meta.period}`, spacing: { after: 60 } }),
          new Paragraph({ text: `Generated: ${meta.generatedAt}`, spacing: { after: 60 } }),
          new Paragraph({
            text: `Total Bookings: ${meta.totalBookings}  |  Total Revenue: ${formatMoney(meta.totalRevenue)}  |  Total Duration: ${meta.totalDuration} minutes`,
            spacing: { after: 240 },
          }),
          new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...bodyRows] }),
          new Paragraph({ text: "", spacing: { before: 240 } }),
          new Paragraph({
            text: `Total: ${rows.length} bookings  |  ${formatMoney(meta.totalRevenue)}  |  Generated by BarberBook`,
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, filename);
}

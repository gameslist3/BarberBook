"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  FileText,
  FileDown,
  Loader2,
  Store,
  Trash2,
  Download,
  ChevronUp,
  History,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Users,
  Clock,
  IndianRupee,
} from "lucide-react";
import { getBookingHistory, deleteAnyBooking } from "@/app/actions/history";
import { getShops } from "@/app/actions/shop";
import { UserAvatar } from "./UserAvatar";
import { getKolkataDateString } from "@/lib/timeUtils";
import {
  buildExportRows,
  downloadTxt,
  downloadPdf,
  downloadDocx,
  formatMoney,
  statusLabel,
  SHOP_EXPORT_OPTIONS,
  ADMIN_EXPORT_OPTIONS,
  type ExportMeta,
  type ExportRow,
  type ExportOptions,
} from "@/lib/exportUtils";

interface BookingHistoryPanelProps {
  mode: "shop" | "admin";
}

// ── Date helpers (all dates are "YYYY-MM-DD" in Kolkata timezone) ─────────
function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function addMonths(iso: string, delta: number): string {
  const [y, m] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + delta, 1));
  return dt.toISOString().slice(0, 10);
}

function lastDayOfMonth(iso: string): string {
  return shiftDate(addMonths(iso, 1), -1);
}

type PresetKey = "today" | "yesterday" | "last7" | "thisMonth" | "lastMonth" | "all";

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 Days" },
  { key: "thisMonth", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "all", label: "All Time" },
];

function presetRange(key: PresetKey, today: string): { start: string; end: string } {
  switch (key) {
    case "today":
      return { start: today, end: today };
    case "yesterday":
      return { start: shiftDate(today, -1), end: shiftDate(today, -1) };
    case "last7":
      return { start: shiftDate(today, -6), end: today };
    case "thisMonth":
      return { start: today.slice(0, 8) + "01", end: today };
    case "lastMonth":
      return { start: addMonths(today, -1).slice(0, 8) + "01", end: lastDayOfMonth(addMonths(today, -1)) };
    case "all":
      return { start: "2000-01-01", end: today };
  }
}

export default function BookingHistoryPanel({ mode }: BookingHistoryPanelProps) {
  const isAdmin = mode === "admin";
  const exportOptions: ExportOptions = isAdmin ? ADMIN_EXPORT_OPTIONS : SHOP_EXPORT_OPTIONS;
  const today = useMemo(() => getKolkataDateString(), []);

  const [activePreset, setActivePreset] = useState<PresetKey | null>("thisMonth");
  const [startDate, setStartDate] = useState(() => presetRange("thisMonth", today).start);
  const [endDate, setEndDate] = useState(() => presetRange("thisMonth", today).end);

  // Admin-only
  const [shops, setShops] = useState<{ id: string; shopName: string }[]>([]);
  const [selectedShopId, setSelectedShopId] = useState("all");

  const [bookings, setBookings] = useState<any[]>([]);
  const [shopName, setShopName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Export state
  const [exporting, setExporting] = useState<"txt" | "pdf" | "docx" | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; left: number; align: "above" | "below" } | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Delete state (admin only)
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Load shop list for admin
  useEffect(() => {
    if (!isAdmin) return;
    getShops().then((data) => setShops(data.map((s: any) => ({ id: s.id, shopName: s.shopName || "Shop" }))));
  }, [isAdmin]);

  // Close export dropdown when clicking outside / pressing Escape
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDock = exportRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);
      if (!insideDock && !insideMenu) {
        setExportOpen(false);
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExportOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, []);

  // Keep the export menu fully on-screen: open upward when there's room, otherwise flip
  // below the dock, and clamp horizontally so it is never cropped off the viewport.
  useLayoutEffect(() => {
    if (!exportOpen) return;
    const position = () => {
      const dock = exportRef.current;
      const menu = menuRef.current;
      if (!dock) return;
      const br = dock.getBoundingClientRect();
      const mw = menu?.offsetWidth || 240;
      const mh = menu?.offsetHeight || 220;
      const gap = 10;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const spaceAbove = br.top;
      const spaceBelow = vh - br.bottom;
      const openAbove = spaceAbove >= mh + gap || spaceAbove >= spaceBelow;
      const left = Math.max(8, Math.min(br.left + br.width / 2 - mw / 2, vw - mw - 8));
      if (openAbove) {
        setMenuPos({ bottom: vh - br.top + gap, left, align: "above" });
      } else {
        setMenuPos({ top: br.bottom + gap, left, align: "below" });
      }
    };
    position();
    window.addEventListener("resize", position);
    return () => window.removeEventListener("resize", position);
  }, [exportOpen]);

  const fetchHistory = useCallback(
    async (range: { start: string; end: string }, shopId?: string) => {
      setIsLoading(true);
      setError("");
      try {
        const result = await getBookingHistory({
          startDate: range.start,
          endDate: range.end,
          shopId: isAdmin && shopId && shopId !== "all" ? shopId : undefined,
        });
        setBookings(result.bookings);
        setShopName(result.shopName);
      } catch (e: any) {
        setError(e.message || "Failed to load booking history.");
      } finally {
        setIsLoading(false);
      }
    },
    [isAdmin]
  );

  // Initial load
  useEffect(() => {
    fetchHistory(presetRange("thisMonth", today), "all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (key: PresetKey) => {
    const range = presetRange(key, today);
    setActivePreset(key);
    setStartDate(range.start);
    setEndDate(range.end);
    fetchHistory(range, selectedShopId);
  };

  const applyRange = () => {
    if (!startDate || !endDate) {
      showToast("Please pick both start and end dates.");
      return;
    }
    if (startDate > endDate) {
      showToast("Start date cannot be after end date.");
      return;
    }
    setActivePreset(null);
    fetchHistory({ start: startDate, end: endDate }, selectedShopId);
  };

  const changeShop = (shopId: string) => {
    setSelectedShopId(shopId);
    fetchHistory({ start: startDate, end: endDate }, shopId);
  };

  // ── Stats ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
    const totalDuration = bookings.reduce((sum, b) => sum + (Number(b.totalDuration) || 0), 0);
    const uniqueClients = new Set(bookings.map((b) => b.userId)).size;
    return { totalRevenue, totalDuration, uniqueClients };
  }, [bookings]);

  // ── Export ───────────────────────────────────────────────
  const exportMeta = useMemo<ExportMeta>(() => {
    return {
      title: "BarberBook — Booking History",
      shopName: isAdmin && selectedShopId === "all" ? "All Shops" : shopName,
      period: `${startDate}  to  ${endDate}`,
      generatedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      totalBookings: bookings.length,
      totalRevenue: stats.totalRevenue,
      totalDuration: stats.totalDuration,
    };
  }, [isAdmin, selectedShopId, shopName, startDate, endDate, bookings.length, stats.totalRevenue, stats.totalDuration]);

  const baseFilename = `barberbook-bookings_${startDate}_to_${endDate}`;

  const handleExport = async (format: "txt" | "pdf" | "docx") => {
    setExportOpen(false);
    if (bookings.length === 0) {
      showToast("No bookings in this range to export.");
      return;
    }
    setExporting(format);
    try {
      const rows: ExportRow[] = buildExportRows(bookings);
      if (format === "txt") {
        downloadTxt(exportMeta, rows, `${baseFilename}.txt`, exportOptions);
      } else if (format === "pdf") {
        await downloadPdf(exportMeta, rows, `${baseFilename}.pdf`, exportOptions);
      } else {
        await downloadDocx(exportMeta, rows, `${baseFilename}.docx`, exportOptions);
      }
      showToast(`${format.toUpperCase()} exported successfully!`);
    } catch (e: any) {
      console.error("Export failed:", e);
      showToast("Export failed. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  // ── Admin delete ─────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteAnyBooking(deleteTarget.id);
    setDeleting(false);
    if (result.success) {
      setBookings((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      showToast("Booking deleted.");
    } else {
      showToast(result.error || "Failed to delete booking.");
    }
    setDeleteTarget(null);
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      confirmed: "bg-blue-50 text-blue-700 border-blue-100",
      pending: "bg-amber-50 text-amber-700 border-amber-100",
      completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
      cancelled: "bg-red-50 text-red-700 border-red-100",
    };
    return map[status] || "bg-gray-50 text-gray-600 border-gray-100";
  };

  return (
    <div className="space-y-5 pb-32">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl animate-slideInRight">
          <CheckCircle2 size={16} className="text-emerald-400" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${isAdmin ? "bg-indigo-50 text-indigo-600" : "bg-violet-50 text-violet-600"}`}>
          <History size={22} />
        </div>
        <div>
          <h2 className="text-[17px] font-bold text-gray-900">Booking History</h2>
          <p className="text-xs text-gray-500">
            {isAdmin
              ? "View and export schedule data for any shop. You can also delete any booking."
              : "View and export your shop's monthly booking history."}
          </p>
        </div>
      </div>

      {/* Timeline + Range Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
        {/* Top row: timeline presets */}
        <div className="flex flex-wrap items-center gap-1.5 px-4 pt-3.5 pb-2.5">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                activePreset === p.key
                  ? isAdmin
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                    : "bg-violet-600 text-white shadow-sm shadow-violet-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Date range row */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2.5">
            <label className="flex flex-col gap-1.5">
              <span
                className={`flex items-center gap-1 text-[11px] font-bold ${isAdmin ? "text-indigo-500" : "text-violet-500"}`}
              >
                <CalendarDays size={12} />
                From
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActivePreset(null);
                }}
                className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-800 transition-all focus:outline-none focus:bg-white focus:ring-2 ${
                  isAdmin ? "focus:ring-indigo-200 focus:border-indigo-300" : "focus:ring-violet-200 focus:border-violet-300"
                }`}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span
                className={`flex items-center gap-1 text-[11px] font-bold ${isAdmin ? "text-indigo-500" : "text-violet-500"}`}
              >
                <CalendarDays size={12} />
                To
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActivePreset(null);
                }}
                className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-800 transition-all focus:outline-none focus:bg-white focus:ring-2 ${
                  isAdmin ? "focus:ring-indigo-200 focus:border-indigo-300" : "focus:ring-violet-200 focus:border-violet-300"
                }`}
              />
            </label>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={applyRange}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border-2 border-violet-600 text-violet-600 hover:bg-violet-50 transition-all active:scale-95"
            >
              <CalendarDays size={13} />
              Show Bookings
            </button>
            <button
              onClick={() => fetchHistory({ start: startDate, end: endDate }, selectedShopId)}
              disabled={isLoading}
              title="Refresh"
              className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-40"
            >
              <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Admin shop filter */}
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-gray-100">
              <Store size={14} className="text-indigo-400" />
              <select
                value={selectedShopId}
                onChange={(e) => changeShop(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
              >
                <option value="all">All Shops</option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shopName}
                  </option>
                ))}
              </select>
              {selectedShopId !== "all" && (
                <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  {shopName}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary panel (single white block, no per-stat cards) */}
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 p-4">
        <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-violet-50" />
        <div className="pointer-events-none absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-indigo-50/60" />
        <p className="relative text-[10px] font-bold uppercase tracking-widest text-gray-400">Summary</p>
        <div className="relative mt-3 grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-3">
          {[
            { label: "Bookings", value: bookings.length.toString(), icon: CalendarDays },
            { label: "Revenue", value: formatMoney(stats.totalRevenue), icon: IndianRupee },
            { label: "Duration", value: `${Math.round(stats.totalDuration / 60 * 10) / 10}h`, icon: Clock },
            { label: "Clients", value: stats.uniqueClients.toString(), icon: Users },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 min-w-0">
              <span
                className={`p-2 rounded-lg shrink-0 ${isAdmin ? "bg-indigo-50 text-indigo-600" : "bg-violet-50 text-violet-600"}`}
              >
                <s.icon size={15} />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400 truncate">{s.label}</p>
                <p className="text-base font-bold text-gray-900 truncate">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading / Empty / Error */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white rounded-xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <AlertTriangle size={28} className="text-red-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <CalendarDays size={28} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No bookings found</h3>
          <p className="text-sm text-gray-500">No schedule data in this date range.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                    {isAdmin && <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Shop</th>}
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Services</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    {isAdmin && <th className="px-4 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((b, idx) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-400 font-medium">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">{b.slotDate}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{b.slotStartTime}</td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-700 whitespace-nowrap">{b.shopName || "—"}</p>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            user={b.user}
                            className="w-8 h-8 rounded-full"
                            fallbackClassName="bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold text-xs"
                          />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{b.user?.name || "Unknown"}</p>
                            {isAdmin && (
                              <p className="text-xs text-gray-400 truncate max-w-[160px]">
                                {b.user?.email || b.user?.phone || ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700 max-w-[240px] truncate">
                          {b.services?.map((s: any) => s.name).join(", ") || "—"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {b.services?.map((s: any) => `${s.duration || 0}m`).join(", ")}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">
                        {formatMoney(b.totalPrice)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusColor(
                            b.status
                          )}`}
                        >
                          {statusLabel(b.status)}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setDeleteTarget(b)}
                            className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors active:scale-90"
                            title="Delete booking"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2.5">
            {bookings.map((b, idx) => (
              <div
                key={b.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.99] transition-transform"
              >
                <div className="p-3">
                  {/* Header: avatar + name | status */}
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar
                        user={b.user}
                        className="w-8 h-8 rounded-lg shadow-sm"
                        fallbackClassName="bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold text-xs"
                      />
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-gray-900 truncate leading-tight">{b.user?.name || "Unknown Client"}</p>
                        {isAdmin && (
                          <p className="text-[11px] text-gray-400 truncate">
                            {b.user?.email || b.user?.phone || ""}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusColor(
                          b.status
                        )}`}
                      >
                        {statusLabel(b.status)}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => setDeleteTarget(b)}
                          className="p-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete booking"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Date + time strip */}
                  <div className="flex items-center gap-1.5 text-[11px] bg-gray-50 rounded-lg px-2.5 py-2 overflow-hidden">
                    <CalendarDays size={11} className="text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-700 whitespace-nowrap">{b.slotDate}</span>
                    <span className="mx-0.5 text-gray-300">•</span>
                    <Clock size={11} className="text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-700 whitespace-nowrap">{b.slotStartTime}</span>
                    {isAdmin && (
                      <>
                        <span className="mx-0.5 text-gray-300">•</span>
                        <Store size={11} className="text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-700 truncate min-w-0">{b.shopName || "—"}</span>
                      </>
                    )}
                  </div>

                  {/* Services chips */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(b.services?.length ? b.services : [{ name: "—", duration: 0 }]).map((s: any, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-700 text-[10px] font-semibold"
                      >
                        <FileText size={9} />
                        {s.name}
                        {s.duration ? <span className="text-violet-400 font-medium">· {s.duration}m</span> : null}
                      </span>
                    ))}
                  </div>

                  {/* Footer: booking # + price */}
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">#{idx + 1}</span>
                    <span className="text-[13px] font-bold text-gray-900">{formatMoney(b.totalPrice)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Floating Export Dock — fixed, floats above the bottom nav bar */}
      <div
        ref={exportRef}
        className={`fixed left-1/2 -translate-x-1/2 z-[15] animate-slideUpFade ${
          isAdmin ? "bottom-[calc(5rem_+_env(safe-area-inset-bottom))]" : "bottom-[6.75rem]"
        } md:left-auto md:translate-x-0 md:right-6 md:bottom-6`}
      >
        <button
          onClick={() => setExportOpen((v) => !v)}
          disabled={exporting !== null || bookings.length === 0}
          title={bookings.length === 0 ? "No bookings to export" : "Export as..."}
          aria-haspopup="menu"
          aria-expanded={exportOpen}
          aria-controls="export-menu"
          className={`group flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full text-xs font-semibold text-white transition-all duration-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:shadow-[0_14px_36px_rgba(0,0,0,0.26)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
            isAdmin
              ? "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 focus-visible:ring-indigo-400"
              : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 focus-visible:ring-violet-400"
          }`}
        >
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${
              isAdmin ? "bg-white/25" : "bg-white/20"
            }`}
          >
            {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          </span>
          <span className="tracking-wide">Export</span>
          {bookings.length > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                isAdmin ? "bg-white/25" : "bg-white/20"
              }`}
            >
              {bookings.length}
            </span>
          )}
          <ChevronUp size={14} className={`transition-transform duration-300 ${exportOpen ? "rotate-180" : ""}`} />
        </button>

      </div>

      {/* Export menu — portaled to <body> with computed position so it can never be cropped off-screen */}
      {exportOpen &&
        createPortal(
          <div
            ref={menuRef}
            id="export-menu"
            role="menu"
            style={menuPos ? { left: menuPos.left, top: menuPos.top, bottom: menuPos.bottom } : { left: -9999, bottom: -9999 }}
            className={`fixed z-[95] w-60 max-h-[calc(100dvh-3rem)] overflow-y-auto bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.16)] border border-gray-100 ${
              menuPos?.align === "below" ? "animate-fadeIn" : "animate-slideUp"
            }`}
          >
            <div className="px-4 pt-3 pb-1.5 flex items-center justify-between gap-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Download as</p>
              <span className={`text-[10px] font-bold ${isAdmin ? "text-indigo-500" : "text-violet-500"}`}>
                {bookings.length} item{bookings.length === 1 ? "" : "s"}
              </span>
            </div>
            {(
              [
                { key: "txt", label: "Text file", hint: ".txt", icon: FileText },
                { key: "pdf", label: "PDF file", hint: ".pdf", icon: FileDown },
                { key: "docx", label: "Word file", hint: ".docx", icon: FileText },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => handleExport(f.key)}
                disabled={exporting !== null}
                role="menuitem"
                className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <span
                  className={`p-1.5 rounded-lg ${isAdmin ? "bg-indigo-50 text-indigo-600" : "bg-violet-50 text-violet-600"}`}
                >
                  <f.icon size={15} />
                </span>
                <span className="flex-1 font-semibold text-gray-800">{f.label}</span>
                <span className="text-[10px] text-gray-400 font-medium">{f.hint}</span>
              </button>
            ))}
            {!isAdmin && (
              <p className="px-4 py-2 text-[10px] text-gray-400 border-t border-gray-100">
                Omits shop, contact &amp; booking ID.
              </p>
            )}
          </div>,
          document.body
        )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Delete this booking?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              <span className="font-semibold text-gray-700">{deleteTarget.user?.name || "Unknown"}</span> ·{" "}
              {deleteTarget.slotDate} at {deleteTarget.slotStartTime} · {formatMoney(deleteTarget.totalPrice)}
              <br />
              This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 text-sm"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

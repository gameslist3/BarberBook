"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Save, MapPin, Upload, X, Image as ImageIcon, Store, Phone, Clock, Info, CalendarX, Plus, Trash2, Sun, Moon, Monitor } from "lucide-react";
import { SkeletonForm } from "@/components/Skeleton";
import { getShopProfile, updateShopProfile } from "@/app/actions/shop";
import { TimeSelectDropdown } from "@/components/TimeSelectDropdown";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import { uploadImage } from "@/lib/uploadImage";
import { SafeImage } from "@/components/SafeImage";
import { getKolkataDateString } from "@/lib/timeUtils";
import { useTheme } from "@/components/ThemeProvider";

// Convert a local date string (YYYY-MM-DD from date picker) to Kolkata date string
// Date picker returns midnight in user's local timezone; we need the Kolkata date at that moment
function localDateToKolkataDate(localDateStr: string): string {
  // Parse as local midnight
  const localDate = new Date(localDateStr + "T00:00:00");
  // Format as Kolkata date manually
  const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
  });
  const parts = formatter.formatToParts(localDate);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value?.padStart(2, '0');
  const day = parts.find(p => p.type === 'day')?.value?.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ShopSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    shopName: "",
    address: "",
    phone: "",
    description: "",
    googleMapLink: "",
    logoUrl: "",
    lunchStartTime: "1:00 PM",
    lunchEndTime: "2:00 PM",
    openTime: "9:00 AM",
    closeTime: "6:00 PM",
    images: [] as string[],
    holidays: {} as Record<string, string>,
  });

  const initialRef = useRef<typeof formData | null>(null);

  const hasChanges = initialRef.current
    ? JSON.stringify(formData) !== JSON.stringify(initialRef.current)
    : false;

  // Cropper State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getShopProfile();
      if (data) {
        const initial = {
          shopName: data.shopName || "",
          address: data.address || "",
          phone: data.phone || "",
          description: data.description || "",
          googleMapLink: data.googleMapLink || "",
          logoUrl: data.logoUrl || "",
          lunchStartTime: data.lunchStartTime || data.lunchTime || "1:00 PM",
          lunchEndTime: data.lunchEndTime || "2:00 PM",
          openTime: data.openTime || "9:00 AM",
          closeTime: data.closeTime || "6:00 PM",
          images: data.images || [],
          holidays: data.holidays || {},
        };
        setFormData(initial);
        initialRef.current = initial;
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, []);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError("Image must be less than 10MB.");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || null);
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setIsUploadingLogo(true);
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImageBlob) {
        const url = await uploadImage(croppedImageBlob);
        setFormData((prev) => ({ ...prev, logoUrl: url }));
      }
    } catch (e: any) {
      setError(e.message || "Failed to crop and upload image.");
    } finally {
      setIsUploadingLogo(false);
      setIsCropping(false);
      setImageSrc(null);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError("Image must be less than 10MB.");
        e.target.value = "";
        return;
      }
      setIsUploadingGallery(true);
      setError("");
      const url = await uploadImage(file);
      setFormData((prev) => ({ ...prev, images: [...prev.images, url] }));
    } catch (e: any) {
      setError(e.message || "Failed to upload gallery image.");
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Holidays state
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayEndDate, setHolidayEndDate] = useState("");
  const [holidayReason, setHolidayReason] = useState("");

  // Helper to increment a YYYY-MM-DD date string by one day (pure string math, no timezone)
  const incrementDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    // Days in each month (non-leap year)
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    // Check leap year for February
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    const dim = month === 2 && isLeap ? 29 : daysInMonth[month - 1];
    
    let newDay = day + 1;
    let newMonth = month;
    let newYear = year;
    
    if (newDay > dim) {
      newDay = 1;
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    }
    
    return [
      newYear,
      String(newMonth).padStart(2, '0'),
      String(newDay).padStart(2, '0')
    ].join('-');
  };

  const addHoliday = async () => {
    if (!holidayDate) return;

    const startDate = holidayDate;
    const endDate = holidayEndDate && holidayEndDate > holidayDate ? holidayEndDate : holidayDate;

    const newHolidays = { ...formData.holidays };

    if (endDate > startDate) {
      let current = startDate;
      while (current <= endDate) {
        newHolidays[current] = holidayReason;
        current = incrementDate(current);
      }
    } else {
      newHolidays[startDate] = holidayReason;
    }

    const updatedForm = { ...formData, holidays: newHolidays };

    // Update local state
    setFormData(updatedForm);
    setHolidayDate("");
    setHolidayEndDate("");
    setHolidayReason("");
    setShowAddHoliday(false);

    // Save to Firestore
    setIsSaving(true);
    await updateShopProfile(updatedForm);
    setIsSaving(false);
  };

  const removeHoliday = async (date: string) => {
    const updatedHolidays = { ...formData.holidays };
    delete updatedHolidays[date];
    const updatedForm = { ...formData, holidays: updatedHolidays };

    setFormData(updatedForm);
    setIsSaving(true);
    await updateShopProfile(updatedForm);
    setIsSaving(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess(false);

    if (!formData.googleMapLink) {
      setError("Please provide a Google Maps search link for your shop.");
      setIsSaving(false);
      return;
    }

    const result = await updateShopProfile(formData);

    if (result.success) {
      setSuccess(true);
      initialRef.current = JSON.parse(JSON.stringify(formData));
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || "Failed to update profile.");
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <SkeletonForm />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Alerts */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 p-3.5 rounded-[20px] text-sm border border-red-100 dark:border-red-900 flex items-start gap-2.5">
          <X size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 p-3.5 rounded-[20px] text-sm border border-green-100 dark:border-green-900 flex items-center gap-2.5">
          <Save size={16} className="shrink-0" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {/* Section: Shop Information */}
      <div className="bg-white dark:bg-gray-900 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-50 dark:border-gray-900 dark:border-gray-800 overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-50 dark:border-gray-900 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <Store size={18} className="text-violet-600" />
            <h2 className="text-[15px] font-bold text-gray-900 dark:text-white dark:text-gray-100">Shop Information</h2>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {/* Shop Name */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300 mb-2.5">Shop Name</label>
            <input
              required
              type="text"
              placeholder="Your barber shop name"
              className="w-full h-14 px-4 rounded-[20px] border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 dark:text-white dark:text-gray-100 bg-gray-50 dark:bg-gray-800 text-sm transition-all"
              value={formData.shopName}
              onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
            />
          </div>

          {/* About */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300 mb-2.5">
              <div className="flex items-center gap-1.5">
                <Info size={14} className="text-gray-400" />
                About the Shop
              </div>
            </label>
            <textarea
              rows={3}
              placeholder="Tell clients about your barbershop..."
              className="w-full p-4 rounded-[20px] border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 dark:text-white dark:text-gray-100 resize-none bg-gray-50 dark:bg-gray-800 text-sm transition-all"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300 mb-2.5">Phone Number</label>
            <div className="relative">
              <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                required
                type="tel"
                placeholder="(555) 123-4567"
                className="w-full h-14 pl-10 pr-3.5 rounded-[20px] border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 dark:text-white dark:text-gray-100 bg-gray-50 dark:bg-gray-800 text-sm transition-all"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300 mb-2.5">Address</label>
            <div className="relative">
              <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                required
                type="text"
                placeholder="123 Main St, City, State"
                className="w-full h-14 pl-10 pr-3.5 rounded-[20px] border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 dark:text-white dark:text-gray-100 bg-gray-50 dark:bg-gray-800 text-sm transition-all"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {/* Google Maps Link */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300 mb-2.5">Google Maps Link</label>
            <div className="relative">
              <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                required
                type="text"
                placeholder="https://maps.app.goo.gl/..."
                className="w-full h-14 pl-10 pr-3.5 rounded-[20px] border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 dark:text-white dark:text-gray-100 bg-gray-50 dark:bg-gray-800 text-sm transition-all"
                value={formData.googleMapLink}
                onChange={(e) => setFormData({ ...formData, googleMapLink: e.target.value })}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5 ml-1">
              Paste a Google Maps link for your shop location.
            </p>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* Business Hours */}
          {/* ═══════════════════════════════════════════ */}
          <div className="pt-2">
            <div className="flex items-center gap-2.5 mb-4">
              <Clock size={16} className="text-violet-500" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Business Hours</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2.5">Opening</label>
                <TimeSelectDropdown
                  value={formData.openTime}
                  onChange={(v) => setFormData({ ...formData, openTime: v })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2.5">Closing</label>
                <TimeSelectDropdown
                  value={formData.closeTime}
                  onChange={(v) => setFormData({ ...formData, closeTime: v })}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 dark:bg-gray-800" />

          {/* ═══════════════════════════════════════════ */}
          {/* Lunch Break */}
          {/* ═══════════════════════════════════════════ */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Clock size={16} className="text-amber-500" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Lunch Break</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2.5">Starts at</label>
                <TimeSelectDropdown
                  value={formData.lunchStartTime}
                  onChange={(v) => setFormData({ ...formData, lunchStartTime: v })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2.5">Ends at</label>
                <TimeSelectDropdown
                  value={formData.lunchEndTime}
                  onChange={(v) => setFormData({ ...formData, lunchEndTime: v })}
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 ml-0.5">
              No appointments will be scheduled during this break.
            </p>
          </div>
        </div>
      </div>

      {/* Section: Shop Logo */}
      <div className="bg-white dark:bg-gray-900 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-50 dark:border-gray-900 dark:border-gray-800 overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-50 dark:border-gray-900 dark:border-gray-800">
          <h2 className="text-[15px] font-bold text-gray-900 dark:text-white dark:text-gray-100">Shop Logo</h2>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Logo Preview */}
            {formData.logoUrl ? (
              <div className="relative w-20 h-20 rounded-[20px] border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0 shadow-sm">
                <SafeImage
                  src={formData.logoUrl}
                  alt="Logo"
                  className="w-full h-full object-cover"
                  fallback={<ImageIcon className="text-gray-300 w-7 h-7" />}
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-[20px] border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                <ImageIcon className="text-gray-300 w-7 h-7" />
              </div>
            )}
            {/* Upload Button */}
            <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900 active:bg-violet-200 rounded-[20px] text-sm font-semibold transition-all">
              <Upload size={16} />
              Upload
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-3">Upload your shop logo. It will be cropped to a square.</p>
        </div>
      </div>

      {/* Section: Gallery */}
      <div className="bg-white dark:bg-gray-900 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-50 dark:border-gray-900 dark:border-gray-800 overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-50 dark:border-gray-900 dark:border-gray-800">
          <h2 className="text-[15px] font-bold text-gray-900 dark:text-white dark:text-gray-100">Gallery</h2>
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Upload photos of your shop, your team, or your best haircuts.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {formData.images.map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-[20px] overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm group"
              >
                <SafeImage
                  src={img}
                  alt={`Gallery ${idx + 1}`}
                  className="w-full h-full object-cover"
                  fallback={<ImageIcon className="text-gray-300 w-6 h-6" />}
                />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(idx)}
                  className="absolute top-1.5 right-1.5 bg-black/60 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {/* Add Image Button */}
            <label className="relative aspect-square rounded-[20px] border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-violet-400 bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center cursor-pointer transition-all group">
              {isUploadingGallery ? (
                <Loader2 className="w-5 h-5 animate-spin text-violet-500 mb-1" />
              ) : (
                <Upload className="w-5 h-5 text-gray-400 group-hover:text-violet-500 mb-1 transition-colors" />
              )}
              <span className="text-[10px] font-medium text-gray-400 group-hover:text-violet-600 transition-colors">
                {isUploadingGallery ? "..." : "Add"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleGalleryUpload}
                disabled={isUploadingGallery}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Section: Holidays / Off-Days */}
      <div className="bg-white dark:bg-gray-900 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-50 dark:border-gray-900 dark:border-gray-800 overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-50 dark:border-gray-900 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CalendarX size={18} className="text-red-500" />
              <h2 className="text-[15px] font-bold text-gray-900 dark:text-white dark:text-gray-100">Holidays / Off-Days</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowAddHoliday(!showAddHoliday)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 active:bg-red-200 rounded-xl text-xs font-semibold transition-all"
            >
              <Plus size={14} />
              Add
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Your shop will show as closed on these days. No bookings can be made.
          </p>
        </div>
        <div className="p-4">
          {/* Add Holiday Form */}
          {showAddHoliday && (
            <div className="mb-4 p-4 bg-red-50/60 dark:bg-red-950/60 rounded-[20px] border border-red-100 dark:border-red-900">
              <div className="space-y-3">
                {/* Date row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">From</label>
                    <input
                      type="date"
                      value={holidayDate}
                      onChange={(e) => setHolidayDate(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-red-200/80 dark:border-red-800 focus:ring-2 focus:ring-red-300 focus:border-red-300 outline-none text-gray-900 dark:text-white dark:text-gray-100 bg-white dark:bg-gray-900 dark:bg-gray-800 text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">To (optional)</label>
                    <input
                      type="date"
                      min={holidayDate}
                      value={holidayEndDate}
                      onChange={(e) => setHolidayEndDate(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-red-200/80 dark:border-red-800 focus:ring-2 focus:ring-red-300 focus:border-red-300 outline-none text-gray-900 dark:text-white dark:text-gray-100 bg-white dark:bg-gray-900 dark:bg-gray-800 text-sm transition-all"
                    />
                  </div>
                </div>
                {/* Reason */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Republic Day"
                    value={holidayReason}
                    onChange={(e) => setHolidayReason(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-red-200/80 dark:border-red-800 focus:ring-2 focus:ring-red-300 focus:border-red-300 outline-none text-gray-900 dark:text-white dark:text-gray-100 bg-white dark:bg-gray-900 dark:bg-gray-800 text-sm placeholder-gray-400 transition-all"
                  />
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={addHoliday}
                    disabled={!holidayDate}
                    className="flex-1 h-11 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 active:bg-red-800 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Plus size={15} />
                    Add Holiday
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddHoliday(false); setHolidayDate(""); setHolidayEndDate(""); setHolidayReason(""); }}
                    className="h-11 px-5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800 active:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Holiday List */}
          {Object.keys(formData.holidays).length === 0 ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-2.5">
                <CalendarX className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400 font-medium">No holidays set</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 dark:text-gray-400 mt-0.5">Your shop is open every day</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(formData.holidays)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, reason]) => {
                  const d = new Date(date + "T00:00:00");
                  const display = d.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  return (
                    <div
                      key={date}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 dark:border-gray-700 hover:border-gray-200 dark:border-gray-700 dark:hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950 flex items-center justify-center shrink-0">
                          <CalendarX size={16} className="text-red-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 dark:text-white dark:text-gray-100 truncate">{display}</p>
                          {reason && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{reason}</p>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeHoliday(date)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-all shrink-0 ml-2"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Section: Appearance / Theme */}
      <div className="bg-white dark:bg-gray-900 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-50 dark:border-gray-900 dark:border-gray-800 overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-50 dark:border-gray-900 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            {theme === "dark" ? <Moon size={18} className="text-violet-600" /> : <Sun size={18} className="text-violet-600" />}
            <h2 className="text-[15px] font-bold text-gray-900 dark:text-white dark:text-gray-100">Appearance</h2>
          </div>
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Choose your preferred theme</p>
          <div className="flex gap-3">
            {[
              { key: "light" as const, label: "Light", icon: Sun },
              { key: "dark" as const, label: "Dark", icon: Moon },
              { key: "system" as const, label: "System", icon: Monitor },
            ].map((opt) => {
              const Icon = opt.icon;
              const isActive = theme === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTheme(opt.key)}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-[20px] border-2 transition-all ${
                    isActive
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Icon size={22} className={isActive ? "text-violet-600" : "text-gray-400 dark:text-gray-500"} />
                  <span className={`text-sm font-semibold ${isActive ? "text-violet-700 dark:text-violet-300" : "text-gray-600 dark:text-gray-400"}`}>
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Save Button — only visible after changes */}
      {hasChanges && (
        <div className="sticky bottom-0 pb-4 pt-2 animate-fadeIn">
          <button
            type="submit"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-[20px] bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 transition-all shadow-lg shadow-violet-200"
          >
            {isSaving ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <Save size={18} />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      {/* Cropper Modal */}
      {isCropping && imageSrc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
          <div className="relative flex-1">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="bg-white dark:bg-gray-900 p-5 flex flex-col gap-4 shrink-0 rounded-t-2xl">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Zoom
              </label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCropping(false);
                  setImageSrc(null);
                }}
                className="flex-1 py-3 rounded-[20px] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800 active:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropSave}
                disabled={isUploadingLogo}
                className="flex-1 py-3 rounded-[20px] bg-violet-600 text-white font-medium text-sm hover:bg-violet-700 active:bg-violet-800 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {isUploadingLogo && <Loader2 className="w-4 h-4 animate-spin" />}
                {isUploadingLogo ? "Uploading..." : "Crop & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

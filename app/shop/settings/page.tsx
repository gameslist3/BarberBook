"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Save, MapPin, Upload, X, Image as ImageIcon, Store, Phone, Clock, Info } from "lucide-react";
import { SkeletonForm } from "@/components/Skeleton";
import { getShopProfile, updateShopProfile } from "@/app/actions/shop";
import { TimeSelectDropdown } from "@/components/TimeSelectDropdown";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";

export default function ShopSettingsPage() {
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
        };
        setFormData(initial);
        initialRef.current = initial;
      }
      setIsLoading(false);
    };
    fetchProfile();
  }, []);

  const uploadToCloudinary = async (file: Blob | File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary environment variables are missing.");
    }
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", uploadPreset);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: data,
    });
    if (!res.ok) throw new Error("Failed to upload image");
    const json = await res.json();
    return json.secure_url;
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || null);
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
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
        const url = await uploadToCloudinary(croppedImageBlob);
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
      setIsUploadingGallery(true);
      const file = e.target.files[0];
      const url = await uploadToCloudinary(file);
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
      <div className="space-y-5">
        <SkeletonForm />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Alerts */}
      {error && (
        <div className="bg-red-50 text-red-700 p-3.5 rounded-2xl text-sm border border-red-100 flex items-start gap-2.5">
          <X size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 p-3.5 rounded-2xl text-sm border border-green-100 flex items-center gap-2.5">
          <Save size={16} className="shrink-0" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {/* Section: Shop Information */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-50 overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-50">
          <div className="flex items-center gap-2.5">
            <Store size={18} className="text-violet-600" />
            <h2 className="text-[15px] font-bold text-gray-900">Shop Information</h2>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {/* Shop Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Shop Name</label>
            <input
              required
              type="text"
              placeholder="Your barber shop name"
              className="w-full h-12 px-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 bg-gray-50 text-sm transition-all"
              value={formData.shopName}
              onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
            />
          </div>

          {/* About */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Info size={14} className="text-gray-400" />
                About the Shop
              </div>
            </label>
            <textarea
              rows={3}
              placeholder="Tell clients about your barbershop..."
              className="w-full p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 resize-none bg-gray-50 text-sm transition-all"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                required
                type="tel"
                placeholder="(555) 123-4567"
                className="w-full h-12 pl-10 pr-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 bg-gray-50 text-sm transition-all"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                required
                type="text"
                placeholder="123 Main St, City, State"
                className="w-full h-12 pl-10 pr-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 bg-gray-50 text-sm transition-all"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {/* Google Maps Link */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Google Maps Link</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                required
                type="text"
                placeholder="https://maps.app.goo.gl/..."
                className="w-full h-12 pl-10 pr-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 bg-gray-50 text-sm transition-all"
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
              <span className="text-sm font-semibold text-gray-800">Business Hours</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Opening</label>
                <TimeSelectDropdown
                  value={formData.openTime}
                  onChange={(v) => setFormData({ ...formData, openTime: v })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Closing</label>
                <TimeSelectDropdown
                  value={formData.closeTime}
                  onChange={(v) => setFormData({ ...formData, closeTime: v })}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* ═══════════════════════════════════════════ */}
          {/* Lunch Break */}
          {/* ═══════════════════════════════════════════ */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Clock size={16} className="text-amber-500" />
              <span className="text-sm font-semibold text-gray-800">Lunch Break</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Starts at</label>
                <TimeSelectDropdown
                  value={formData.lunchStartTime}
                  onChange={(v) => setFormData({ ...formData, lunchStartTime: v })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Ends at</label>
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
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-50 overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-50">
          <h2 className="text-[15px] font-bold text-gray-900">Shop Logo</h2>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Logo Preview */}
            {formData.logoUrl ? (
              <div className="relative w-20 h-20 rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0 shadow-sm">
                <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
                <ImageIcon className="text-gray-300 w-7 h-7" />
              </div>
            )}
            {/* Upload Button */}
            <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-violet-50 text-violet-700 hover:bg-violet-100 active:bg-violet-200 rounded-2xl text-sm font-semibold transition-all">
              <Upload size={16} />
              Upload
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-3">Upload your shop logo. It will be cropped to a square.</p>
        </div>
      </div>

      {/* Section: Gallery */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-50 overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-50">
          <h2 className="text-[15px] font-bold text-gray-900">Gallery</h2>
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-4">
            Upload photos of your shop, your team, or your best haircuts.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {formData.images.map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 shadow-sm group"
              >
                <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
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
            <label className="relative aspect-square rounded-2xl border-2 border-dashed border-gray-200 hover:border-violet-400 bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-all group">
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

      {/* Save Button — only visible after changes */}
      {hasChanges && (
        <div className="sticky bottom-0 pb-4 pt-2 animate-fadeIn">
          <button
            type="submit"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 transition-all shadow-lg shadow-violet-200"
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
          <div className="bg-white p-5 flex flex-col gap-4 shrink-0 rounded-t-2xl">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                Zoom
              </label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCropping(false);
                  setImageSrc(null);
                }}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropSave}
                disabled={isUploadingLogo}
                className="flex-1 py-3 rounded-2xl bg-violet-600 text-white font-medium text-sm hover:bg-violet-700 active:bg-violet-800 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
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

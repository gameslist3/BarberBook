"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, MapPin, Upload, X, Image as ImageIcon, Store, Phone, Clock, Info, ChevronRight } from "lucide-react";
import { getShopProfile, updateShopProfile } from "@/app/actions/shop";
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
    lunchTime: "13:00",
    images: [] as string[],
  });

  // Cropper State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getShopProfile();
      if (data) {
        setFormData({
          shopName: data.shopName || "",
          address: data.address || "",
          phone: data.phone || "",
          description: data.description || "",
          googleMapLink: data.googleMapLink || "",
          logoUrl: data.logoUrl || "",
          lunchTime: data.lunchTime || "13:00",
          images: data.images || [],
        });
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
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || "Failed to update profile.");
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Page Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Shop Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Update your shop&apos;s public profile and location.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Alerts */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-sm border border-red-100 flex items-start gap-2.5">
            <X size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 p-3.5 rounded-xl text-sm border border-green-100 flex items-center gap-2.5">
            <Save size={16} className="shrink-0" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        {/* Section 1: Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveSection(activeSection === "basic" ? null : "basic")}
            className="w-full flex items-center justify-between px-4 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Store size={18} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">Basic Info</h2>
                <p className="text-xs text-gray-500 mt-0.5">Shop name, logo, description</p>
              </div>
            </div>
            <ChevronRight
              size={18}
              className={`text-gray-400 transition-transform ${activeSection === "basic" ? "rotate-90" : ""}`}
            />
          </button>
          {activeSection === "basic" && (
            <div className="px-4 pb-5 space-y-4 border-t border-gray-50 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop Name</label>
                <input
                  required
                  type="text"
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-gray-50 text-sm"
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop Logo</label>
                <p className="text-xs text-gray-400 mb-3">Upload your shop logo. It will be cropped to a square.</p>
                <div className="flex items-center gap-4">
                  {formData.logoUrl ? (
                    <div className="relative w-20 h-20 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0 shadow-sm">
                      <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
                      <ImageIcon className="text-gray-300 w-7 h-7" />
                    </div>
                  )}
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:bg-indigo-200 rounded-xl text-sm font-medium transition-colors">
                    <Upload size={16} />
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Info size={14} />
                    About the Shop
                  </div>
                </label>
                <textarea
                  rows={3}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 resize-none bg-gray-50 text-sm"
                  placeholder="Tell clients about your barbershop..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Contact */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveSection(activeSection === "contact" ? null : "contact")}
            className="w-full flex items-center justify-between px-4 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <Phone size={18} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">Contact</h2>
                <p className="text-xs text-gray-500 mt-0.5">Phone number, hours</p>
              </div>
            </div>
            <ChevronRight
              size={18}
              className={`text-gray-400 transition-transform ${activeSection === "contact" ? "rotate-90" : ""}`}
            />
          </button>
          {activeSection === "contact" && (
            <div className="px-4 pb-5 space-y-4 border-t border-gray-50 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    required
                    type="tel"
                    placeholder="(555) 123-4567"
                    className="w-full h-11 pl-9 pr-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-gray-50 text-sm"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    Lunch Break Start Time
                  </div>
                </label>
                <input
                  type="time"
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-gray-50 text-sm"
                  value={formData.lunchTime}
                  onChange={(e) => setFormData({ ...formData, lunchTime: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Location */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveSection(activeSection === "location" ? null : "location")}
            className="w-full flex items-center justify-between px-4 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <MapPin size={18} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">Location</h2>
                <p className="text-xs text-gray-500 mt-0.5">Address, Google Maps link</p>
              </div>
            </div>
            <ChevronRight
              size={18}
              className={`text-gray-400 transition-transform ${activeSection === "location" ? "rotate-90" : ""}`}
            />
          </button>
          {activeSection === "location" && (
            <div className="px-4 pb-5 space-y-4 border-t border-gray-50 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Text Address</label>
                <input
                  required
                  type="text"
                  placeholder="123 Main St, City, State"
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-gray-50 text-sm"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Google Maps Link</label>
                <p className="text-xs text-gray-400 mb-2">
                  Paste a Google Maps link for your shop location.
                </p>
                <input
                  required
                  type="text"
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-gray-50 text-sm"
                  value={formData.googleMapLink}
                  onChange={(e) => setFormData({ ...formData, googleMapLink: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Gallery */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveSection(activeSection === "gallery" ? null : "gallery")}
            className="w-full flex items-center justify-between px-4 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ImageIcon size={18} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">Gallery</h2>
                <p className="text-xs text-gray-500 mt-0.5">Photos of your shop and work</p>
              </div>
            </div>
            <ChevronRight
              size={18}
              className={`text-gray-400 transition-transform ${activeSection === "gallery" ? "rotate-90" : ""}`}
            />
          </button>
          {activeSection === "gallery" && (
            <div className="px-4 pb-5 space-y-4 border-t border-gray-50 pt-4">
              <p className="text-xs text-gray-500">
                Upload photos of your shop, your team, or your best haircuts.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                    <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute top-1.5 right-1.5 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <label className="relative aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-400 bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                  {isUploadingGallery ? (
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mb-1" />
                  ) : (
                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 mb-1 transition-colors" />
                  )}
                  <span className="text-[10px] font-medium text-gray-400 group-hover:text-indigo-600 transition-colors">
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
          )}
        </div>

        {/* Save Button */}
        <div className="pt-2 sticky bottom-0 bg-gray-50 pb-4">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-200"
          >
            {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save size={18} />}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

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
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Zoom</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setIsCropping(false); setImageSrc(null); }}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropSave}
                disabled={isUploadingLogo}
                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 active:bg-indigo-800 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
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

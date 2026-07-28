"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, MapPin, Upload, X, Image as ImageIcon } from "lucide-react";
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
    images: [] as string[]
  });

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
        setFormData({
          shopName: data.shopName || "",
          address: data.address || "",
          phone: data.phone || "",
          description: data.description || "",
          googleMapLink: data.googleMapLink || "",
          logoUrl: data.logoUrl || "",
          lunchTime: data.lunchTime || "13:00",
          images: data.images || []
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
      body: data
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
        setFormData(prev => ({ ...prev, logoUrl: url }));
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
      setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
    } catch (e: any) {
      setError(e.message || "Failed to upload gallery image.");
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
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
          <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Shop Settings</h1>
        <p className="text-gray-500 mt-1">Update your shop's public profile and location.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Basic Info</h2>
            
            {error && <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm border border-red-100">{error}</div>}
            {success && <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm border border-green-100">Profile updated successfully!</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                    <input required type="text" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" value={formData.shopName} onChange={e => setFormData({...formData, shopName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input required type="tel" placeholder="(555) 123-4567" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
            
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shop Logo</label>
                    <p className="text-xs text-gray-500 mb-3">Upload your shop logo. It will be cropped to a square.</p>
                    
                    <div className="flex items-center gap-4">
                      {formData.logoUrl ? (
                          <div className="relative w-20 h-20 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0 shadow-sm">
                              <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                          </div>
                      ) : (
                          <div className="w-20 h-20 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 border-dashed">
                              <ImageIcon className="text-gray-300 w-8 h-8" />
                          </div>
                      )}
                      
                      <div className="flex-1">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors">
                          <Upload size={16} />
                          Upload Logo
                          <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                        </label>
                      </div>
                    </div>
                </div>
            
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">About the Shop</label>
                    <textarea rows={3} className="w-full p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 resize-none" placeholder="Tell clients about your barbershop..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                <ImageIcon size={20} className="text-indigo-600"/> Shop Gallery
            </h2>
            <p className="text-sm text-gray-500 mb-4">Upload photos of your shop, your team, or your best haircuts to display on your public page.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                  <img src={img} alt={`Gallery image ${idx + 1}`} className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeGalleryImage(idx)}
                    className="absolute top-2 right-2 bg-white/90 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              <label className="relative aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                {isUploadingGallery ? (
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
                ) : (
                  <Upload className="w-6 h-6 text-gray-400 group-hover:text-indigo-500 mb-2 transition-colors" />
                )}
                <span className="text-xs font-medium text-gray-500 group-hover:text-indigo-600 transition-colors">
                  {isUploadingGallery ? 'Uploading...' : 'Add Photo'}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} disabled={isUploadingGallery} />
              </label>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                <MapPin size={20} className="text-indigo-600"/> Location setup
            </h2>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Text Address (Shown on Card)</label>
                <input required type="text" placeholder="123 Main St, City, State" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 mb-4" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                
                <label className="block text-sm font-medium text-gray-700 mb-1 mt-4">Google Maps Link</label>
                <p className="text-sm text-gray-500 mb-2">Paste a Google Maps link or the exact search query for your shop (e.g. "My Barbershop, NY"). This ensures the map embeds perfectly on the exact location.</p>
                <input required type="text" placeholder="https://maps.app.goo.gl/..." className="w-full h-10 px-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 mb-2" value={formData.googleMapLink} onChange={e => setFormData({...formData, googleMapLink: e.target.value})} />
            </div>
        </div>

        <div className="flex justify-end">
            <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 h-11 px-8 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
                {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save size={18} />}
                {isSaving ? 'Saving...' : 'Save Changes'}
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
          <div className="bg-white p-6 flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <div className="flex-1 w-full">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Zoom</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
              <button 
                onClick={() => { setIsCropping(false); setImageSrc(null); }}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleCropSave}
                disabled={isUploadingLogo}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploadingLogo && <Loader2 className="w-4 h-4 animate-spin" />}
                {isUploadingLogo ? 'Uploading...' : 'Crop & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

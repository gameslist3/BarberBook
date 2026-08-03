"use client";

import { useState, useCallback, useEffect } from "react";
import { Camera, Loader2, Trash2, X } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import { uploadImage } from "@/lib/uploadImage";

export function ProfilePhotoManager({ user }: { user: any }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const router = useRouter();

  // Cropper State — the uploaded photo goes through a crop stage first
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  // The user.photoUrl is fetched from the server (and live-updates via the
  // parent's onSnapshot, so the new photo shows right after saving).
  const photoUrl = user.photoUrl || user.photoURL || null;
  const [photoFailed, setPhotoFailed] = useState(false);

  // Reset the fallback state whenever the URL changes (new upload / removal).
  const displayUrl = photoUrl || null;
  const showImage = displayUrl && !photoFailed;

  useEffect(() => {
    setPhotoFailed(false);
  }, [photoUrl]);

  const handleRemovePhoto = async () => {
    if (!photoUrl || isUploading || isRemoving) return;
    setShowRemoveConfirm(false);
    try {
      setIsRemoving(true);

      // Clear the photo from the user doc so the initial-letter avatar returns
      await updateDoc(doc(db, "users", user.id), {
        photoUrl: "",
      });

      // Clear it from Firebase Auth too
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          photoURL: "",
        });
      }

      setIsRemoving(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to remove photo. Please try again.");
      setIsRemoving(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    // Read the file as a data URL and open the crop modal
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result?.toString() || null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setIsCropping(true);
    });
    reader.readAsDataURL(file);

    // Reset the input so the same file can be re-selected later
    e.target.value = "";
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels || isUploading) return;
    try {
      setIsUploading(true);
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedImageBlob) throw new Error("Failed to crop image");

      // Upload the cropped image to Cloudinary
      const downloadURL = await uploadImage(croppedImageBlob);
      setPhotoFailed(false);

      // Update Firestore
      await updateDoc(doc(db, "users", user.id), {
        photoUrl: downloadURL,
      });

      // Update Firebase Auth if logged in on client
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          photoURL: downloadURL,
        });
      }

      setIsUploading(false);
      setIsCropping(false);
      setImageSrc(null);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Upload failed. Please try again.");
      setIsUploading(false);
      setIsCropping(false);
      setImageSrc(null);
    }
  };

  return (
    <div className="relative group shrink-0">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-3xl overflow-hidden border-4 border-white shadow-sm ring-1 ring-gray-100 relative">
        {showImage ? (
          <Image
            src={displayUrl as string}
            alt="Profile"
            fill
            className="object-cover"
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          user.name?.charAt(0) || "U"
        )}

        {/* Hover overlay for upload */}
        <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
          {isUploading ? (
            <Loader2 className="animate-spin text-white" size={24} />
          ) : (
            <Camera className="text-white" size={24} />
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Remove photo badge — sibling of the avatar so the avatar's
          overflow-hidden (needed for the rounded image) can't clip it. */}
      {photoUrl && (
        <button
          type="button"
          onClick={() => setShowRemoveConfirm(true)}
          disabled={isUploading || isRemoving}
          title="Remove photo"
          aria-label="Remove photo"
          className="absolute -top-1 -right-1 z-10 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-red-600 hover:border-red-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRemoving ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <X size={13} strokeWidth={2.5} />
          )}
        </button>
      )}

      {(isUploading || isRemoving) && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-indigo-600 whitespace-nowrap">
          {isRemoving ? "Removing..." : "Uploading..."}
        </span>
      )}

      {/* Remove confirmation popup */}
      {showRemoveConfirm && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowRemoveConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 w-full max-w-sm text-center animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1.5">Remove photo?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Your profile picture will be removed and your initial-letter avatar will be restored.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowRemoveConfirm(false)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={isRemoving}
                className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-medium text-sm hover:bg-red-700 active:bg-red-800 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {isRemoving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isRemoving ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
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
              cropShape="round"
              showGrid={false}
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
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
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
                disabled={isUploading}
                className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 active:bg-indigo-800 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isUploading ? "Uploading..." : "Crop & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

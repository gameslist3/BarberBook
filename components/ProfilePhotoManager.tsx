"use client";

import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { storage, db, auth } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function ProfilePhotoManager({ user }: { user: any }) {
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  
  // The user.photoUrl is fetched from the server.
  const photoUrl = user.photoUrl || user.photoURL || null;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      const storageRef = ref(storage, `profilePhotos/${user.id}_${Date.now()}`);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {},
        (error) => {
          console.error("Upload failed", error);
          alert("Upload failed. Please try again.");
          setIsUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
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
          router.refresh();
        }
      );
    } catch (error) {
      console.error(error);
      setIsUploading(false);
    }
  };

  return (
    <div className="relative group shrink-0">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-3xl overflow-hidden border-4 border-white shadow-sm ring-1 ring-gray-100 relative">
        {photoUrl ? (
          <Image src={photoUrl} alt="Profile" fill className="object-cover" />
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
            onChange={handleImageChange}
            disabled={isUploading}
          />
        </label>
      </div>
      {isUploading && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-indigo-600 whitespace-nowrap">
          Uploading...
        </span>
      )}
    </div>
  );
}

import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-12">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
      <p className="text-gray-500 font-medium">Loading...</p>
    </div>
  );
}

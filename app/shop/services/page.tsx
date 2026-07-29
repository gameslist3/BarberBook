"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X, Loader2, Scissors, Clock, IndianRupee } from "lucide-react";
import { SkeletonServiceCard } from "@/components/Skeleton";
import { getServices, addService, deleteService, toggleServiceStatus } from "@/app/actions/services";

export default function ShopServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const [newService, setNewService] = useState({ name: "", price: "", hr: "0", min: "30" });

  const fetchServices = async () => {
    setIsLoading(true);
    const data = await getServices();
    setServices(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");

    const hours = parseInt(newService.hr) || 0;
    const minutes = parseInt(newService.min) || 0;
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes === 0) {
      setError("Duration must be greater than 0.");
      setIsCreating(false);
      return;
    }

    const result = await addService({
      name: newService.name,
      price: parseFloat(newService.price),
      duration: totalMinutes,
      isActive: true,
    });

    if (result.success) {
      setShowAddModal(false);
      setNewService({ name: "", price: "", hr: "0", min: "30" });
      fetchServices();
    } else {
      setError(result.error || "Failed to save service.");
    }

    setIsCreating(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    const result = await deleteService(id);
    if (result.success) {
      fetchServices();
    } else {
      alert("Failed to delete service: " + result.error);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    // Optimistically update UI immediately
    setServices((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, isActive: !currentStatus } : s
      )
    );

    const result = await toggleServiceStatus(id, !currentStatus);
    if (!result.success) {
      // Revert on failure
      setServices((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, isActive: currentStatus } : s
        )
      );
      alert("Failed to update status.");
    }
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h} hr`;
    return `${m} min`;
  };

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-bold text-gray-900">My Services</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 active:bg-violet-800 transition-all shadow-sm shadow-violet-200 active:scale-95"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Add Service Bottom Sheet */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
          <div
            className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full md:max-w-md md:mx-4 overflow-hidden flex flex-col max-h-[90vh] animate-slideUp md:animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Add New Service</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleAddService}
              className="p-5 space-y-4 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {error && (
                <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-sm border border-red-100 flex items-start gap-2">
                  <X size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Service Name</label>
                <div className="relative">
                  <Scissors size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    required
                    type="text"
                    placeholder="e.g. Men's Fade"
                    className="w-full h-12 pl-10 pr-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 bg-gray-50 text-sm"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Price</label>
                <div className="relative">
                  <IndianRupee size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full h-12 pl-10 pr-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 bg-gray-50 text-sm"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      required
                      type="number"
                      min="0"
                      max="12"
                      placeholder="Hours"
                      className="w-full h-12 px-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 bg-gray-50 text-sm"
                      value={newService.hr}
                      onChange={(e) => setNewService({ ...newService, hr: e.target.value })}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">hr</span>
                  </div>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      min="0"
                      max="59"
                      placeholder="Minutes"
                      className="w-full h-12 px-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-gray-900 bg-gray-50 text-sm"
                      value={newService.min}
                      onChange={(e) => setNewService({ ...newService, min: e.target.value })}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">min</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full flex justify-center items-center h-12 rounded-2xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 transition-all shadow-sm shadow-violet-200"
                >
                  {isCreating ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    "Save Service"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonServiceCard key={i} />)}
        </div>
      ) : services.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-4">
            <Scissors size={28} className="text-violet-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No services yet</h3>
          <p className="text-sm text-gray-500">Tap the + button to add your first service.</p>
        </div>
      ) : (
        /* Service Cards */
        <div className="space-y-3">
          {services.map((service) => {
            const isActive = service.isActive !== false;
            return (
              <div
                key={service.id}
                className={`bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border transition-all ${
                  isActive ? "border-gray-50" : "border-gray-50 opacity-60"
                }`}
              >
                <div className="p-4 space-y-3">
                  {/* ═══ ROW 1: Icon + Service Name ═══ */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                      <Scissors size={15} />
                    </div>
                    <p className="text-[15px] font-bold text-gray-900">{service.name}</p>
                  </div>

                  {/* ═══ ROW 2: Price | Duration | Toggle | Delete ═══ */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">
                        ₹{Number(service.price).toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs font-medium text-gray-600">
                        {formatDuration(service.duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Toggle Switch */}
                      <button
                        onClick={() => handleToggle(service.id, isActive)}
                        className={`relative inline-flex h-6 w-10 items-center rounded-full transition-all ${
                          isActive ? "bg-violet-600" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-all ${
                            isActive ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(service.id, service.name)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

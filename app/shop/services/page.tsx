"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X, Loader2, Scissors, Clock, DollarSign, Power, PowerOff } from "lucide-react";
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
    const result = await toggleServiceStatus(id, !currentStatus);
    if (result.success) {
      fetchServices();
    } else {
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
    <div className="pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Manage services you offer to clients.</p>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Add Service</span>
        </button>
      </div>

      {/* Add Service Bottom Sheet (Mobile) / Modal (Desktop) */}
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
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Service Name</label>
                <div className="relative">
                  <Scissors size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    required
                    type="text"
                    placeholder="e.g. Men's Fade"
                    className="w-full h-11 pl-9 pr-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-gray-50 text-sm"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Price</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full h-11 pl-9 pr-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-gray-50 text-sm"
                    value={newService.price}
                    onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      required
                      type="number"
                      min="0"
                      max="12"
                      placeholder="Hours"
                      className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-gray-50 text-sm"
                      value={newService.hr}
                      onChange={(e) => setNewService({ ...newService, hr: e.target.value })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">hr</span>
                  </div>
                  <div className="relative">
                    <input
                      required
                      type="number"
                      min="0"
                      max="59"
                      placeholder="Minutes"
                      className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-gray-50 text-sm"
                      value={newService.min}
                      onChange={(e) => setNewService({ ...newService, min: e.target.value })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">min</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full flex justify-center items-center h-12 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isCreating ? <Loader2 className="animate-spin w-5 h-5" /> : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm text-gray-400">Loading services...</p>
          </div>
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Scissors size={28} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No services yet</h3>
          <p className="text-sm text-gray-500">Click &quot;Add Service&quot; to start building your menu.</p>
        </div>
      ) : (
        <>
          {/* Mobile: Card List */}
          <div className="md:hidden space-y-3">
            {services.map((service) => {
              const isActive = service.isActive !== false;
              return (
                <div
                  key={service.id}
                  className={`bg-white rounded-xl shadow-sm border overflow-hidden active:scale-[0.99] transition-transform ${
                    isActive ? "border-gray-100" : "border-gray-100 opacity-70"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <Scissors size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{service.name}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <DollarSign size={11} />${service.price.toFixed(2)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {formatDuration(service.duration)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      {/* Toggle Switch */}
                      <button
                        onClick={() => handleToggle(service.id, isActive)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                          isActive ? "bg-green-500" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                            isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>

                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400 mr-1">{isActive ? "Active" : "Inactive"}</span>
                        <button
                          onClick={() => handleDelete(service.id, service.name)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Service Name</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Price</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Duration</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{service.name}</td>
                    <td className="px-6 py-4 text-gray-700">${service.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-700">{formatDuration(service.duration)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(service.id, service.isActive !== false)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          service.isActive !== false ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            service.isActive !== false ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(service.id, service.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

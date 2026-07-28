"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X, Loader2 } from "lucide-react";
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
    const totalMinutes = (hours * 60) + minutes;
    
    if (totalMinutes === 0) {
        setError("Duration must be greater than 0.");
        setIsCreating(false);
        return;
    }

    const result = await addService({
      name: newService.name,
      price: parseFloat(newService.price),
      duration: totalMinutes,
      isActive: true
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500">Manage the services you offer to clients.</p>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} /> Add Service
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Add New Service</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddService} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                <input required type="text" placeholder="e.g. Men's Fade" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} />
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input required type="number" min="0" step="0.01" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Hours)</label>
                  <input required type="number" min="0" max="12" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" value={newService.hr} onChange={e => setNewService({...newService, hr: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Minutes)</label>
                  <input required type="number" min="0" max="59" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900" value={newService.min} onChange={e => setNewService({...newService, min: e.target.value})} />
                </div>
              </div>
              
              <div className="pt-4">
                <button type="submit" disabled={isCreating} className="w-full flex justify-center items-center h-10 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {isCreating ? <Loader2 className="animate-spin w-5 h-5" /> : "Save Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
            {isLoading ? (
               <tr><td colSpan={5} className="px-6 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400"/></td></tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No services added yet. Click "Add Service" to start building your menu.
                </td>
              </tr>
            ) : (
              services.map(service => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{service.name}</td>
                  <td className="px-6 py-4 text-gray-700">${service.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-700">{formatDuration(service.duration)}</td>
                  <td className="px-6 py-4">
                      <button 
                          onClick={() => handleToggle(service.id, service.isActive !== false)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${service.isActive !== false ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${service.isActive !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(service.id, service.name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

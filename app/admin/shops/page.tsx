"use client";

import { useState, useEffect } from "react";
import { Plus, Power, Calendar, Trash2, X, Loader2, Store, Phone, Mail, User, Clock, ChevronRight, PowerOff } from "lucide-react";
import { SkeletonCard, SkeletonTableRow } from "@/components/Skeleton";
import { createShop, getShops, deleteShop, toggleShopStatus } from "@/app/actions/shop";

export default function ShopsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const [newShop, setNewShop] = useState({
    name: "", owner: "", email: "", phone: "", password: "", expiryDays: 30
  });

  const fetchShops = async () => {
    setIsLoading(true);
    const data = await getShops();
    setShops(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");
    
    const result = await createShop(newShop);
    
    if (result.success) {
      alert("Shop and User Account created successfully!");
      setShowAddModal(false);
      setNewShop({ name: "", owner: "", email: "", phone: "", password: "", expiryDays: 30 });
      fetchShops();
    } else {
      setError(result.error || "Failed to create shop.");
    }
    setIsCreating(false);
  };

  const handleDelete = async (shopId: string, shopName: string) => {
    if (!window.confirm(`WARNING: Are you sure you want to permanently delete "${shopName}"? This will erase their profile, all their services, and all their bookings from the database.`)) {
      return;
    }
    const result = await deleteShop(shopId);
    if (result.success) {
      fetchShops();
    } else {
      alert(result.error);
    }
  };

  const handleToggleStatus = async (shopId: string, isActive: boolean) => {
    const result = await toggleShopStatus(shopId, isActive);
    if (result.success) {
      fetchShops();
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "Unknown";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysSince = (date: string | undefined) => {
    if (!date) return 0;
    return Math.max(0, Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 3600 * 24)));
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Manage all barber shop accounts on the platform.</p>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Add Shop</span>
        </button>
      </div>

      {/* Add Shop Bottom Sheet (Mobile) / Modal (Desktop) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
          <div
            className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full md:max-w-lg md:mx-4 overflow-hidden flex flex-col max-h-[90vh] animate-slideUp md:animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Add New Shop</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddShop} className="p-5 overflow-y-auto space-y-4" onClick={(e) => e.stopPropagation()}>
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop Name</label>
                <div className="relative">
                  <Store size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input required type="text" placeholder="e.g. Downtown Barbers" className="w-full h-11 pl-9 pr-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-gray-50 text-sm" value={newShop.name} onChange={e => setNewShop({...newShop, name: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Owner Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input required type="text" placeholder="John Doe" className="w-full h-11 pl-9 pr-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-gray-50 text-sm" value={newShop.owner} onChange={e => setNewShop({...newShop, owner: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Owner Email (Login)</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input required type="email" placeholder="owner@example.com" className="w-full h-11 pl-9 pr-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-gray-50 text-sm" value={newShop.email} onChange={e => setNewShop({...newShop, email: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Owner Password</label>
                <input required type="password" minLength={6} placeholder="Min. 6 characters" className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-gray-50 text-sm" value={newShop.password} onChange={e => setNewShop({...newShop, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input required type="tel" placeholder="(555) 123-4567" className="w-full h-11 pl-9 pr-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-gray-50 text-sm" value={newShop.phone} onChange={e => setNewShop({...newShop, phone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Initial Access (Days)</label>
                <input required type="number" min="1" className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-gray-50 text-sm" value={newShop.expiryDays} onChange={e => setNewShop({...newShop, expiryDays: parseInt(e.target.value)})} />
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isCreating} className="w-full flex justify-center items-center h-12 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 transition-colors shadow-sm">
                  {isCreating ? <Loader2 className="animate-spin w-5 h-5" /> : "Create Shop & Send Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <>
          {/* Mobile skeleton */}
          <div className="md:hidden space-y-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
          {/* Desktop skeleton */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['Shop Name', 'Owner', 'Contact', 'Timeline', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-4 text-sm font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => <SkeletonTableRow key={i} />)}
              </tbody>
            </table>
          </div>
        </>
      ) : shops.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Store size={28} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No shops yet</h3>
          <p className="text-sm text-gray-500">Click &quot;Add Shop&quot; to create the first barber shop account.</p>
        </div>
      ) : (
        <>
          {/* Mobile: Card List */}
          <div className="md:hidden space-y-3">
            {shops.map((shop) => {
              const isActive = shop.isActive !== false;
              return (
                <div
                  key={shop.id}
                  className={`bg-white rounded-xl shadow-sm border overflow-hidden active:scale-[0.99] transition-transform ${
                    isActive ? "border-gray-100" : "border-gray-100 opacity-75"
                  }`}
                >
                  <div className="p-4">
                    {/* Shop Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <Store size={18} />
                        </div>
                        <div>
                          <p className="notranslate text-sm font-semibold text-gray-900">{shop.shopName}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <User size={11} />
                            <span>{shop.owner?.name || "Unknown"}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        {isActive ? "Active" : "Disabled"}
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="text-gray-400 shrink-0" />
                        <span>{shop.owner?.email || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="text-gray-400 shrink-0" />
                        <span>{shop.phone || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-gray-400 shrink-0" />
                        <span>Active for {getDaysSince(shop.createdAt)} days</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => handleToggleStatus(shop.id, shop.isActive)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        {isActive ? <PowerOff size={14} /> : <Power size={14} />}
                        {isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => handleDelete(shop.id, shop.shopName)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 w-1/5">Shop Name</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 w-[15%]">Owner</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 w-[15%]">Contact</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 w-[20%]">Timeline</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 w-[15%]">Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-600 w-[15%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shops.map(shop => (
                  <tr key={shop.id} className="hover:bg-gray-50">
                    <td className="notranslate px-6 py-4 font-medium text-gray-900">{shop.shopName}</td>
                    <td className="px-6 py-4 text-gray-700">{shop.owner?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{shop.phone || 'N/A'}</div>
                      <div className="text-gray-500 text-sm mt-1">{shop.owner?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        <span className="font-semibold">Active for:</span> {getDaysSince(shop.createdAt)} days
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <span className="font-semibold">Initial Access:</span> {shop.accessExpiresAt && shop.createdAt ? Math.round((new Date(shop.accessExpiresAt).getTime() - new Date(shop.createdAt).getTime()) / (1000 * 3600 * 24)) : 30} days
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${shop.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {shop.isActive !== false ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleToggleStatus(shop.id, shop.isActive)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Toggle Status"><Power size={18}/></button>
                        <button onClick={() => handleDelete(shop.id, shop.shopName)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete Shop"><Trash2 size={18}/></button>
                      </div>
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

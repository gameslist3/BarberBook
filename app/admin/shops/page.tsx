"use client";

import { useState, useEffect } from "react";
import { Plus, Power, Calendar, Trash2, X, Loader2 } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500">Manage all barber shop accounts on the platform.</p>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} /> Add New Shop
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Add New Shop</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddShop} className="p-6 overflow-y-auto space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                <input required type="text" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={newShop.name} onChange={e => setNewShop({...newShop, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                <input required type="text" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={newShop.owner} onChange={e => setNewShop({...newShop, owner: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email (Login)</label>
                <input required type="email" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={newShop.email} onChange={e => setNewShop({...newShop, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Password</label>
                <input required type="password" minLength={6} className="w-full h-10 px-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={newShop.password} onChange={e => setNewShop({...newShop, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input required type="tel" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={newShop.phone} onChange={e => setNewShop({...newShop, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Access (Days)</label>
                <input required type="number" min="1" className="w-full h-10 px-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" value={newShop.expiryDays} onChange={e => setNewShop({...newShop, expiryDays: parseInt(e.target.value)})} />
              </div>
              
              <div className="pt-4">
                <button type="submit" disabled={isCreating} className="w-full flex justify-center items-center h-10 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {isCreating ? <Loader2 className="animate-spin w-5 h-5" /> : "Create Shop & Send Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[900px] text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 w-1/5">Shop Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 w-1/5">Owner</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 w-1/4">Contact</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 w-1/12">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 w-1/6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
               <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></td></tr>
            ) : shops.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No shops found. Click "Add New Shop" to create one.
                </td>
              </tr>
            ) : (
              shops.map(shop => (
                <tr key={shop.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{shop.shopName}</td>
                  <td className="px-6 py-4 text-gray-700">{shop.owner?.name || 'Unknown'}</td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{shop.owner?.email}</div>
                    <div className="text-gray-500 text-sm">{shop.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${shop.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {shop.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleToggleStatus(shop.id, shop.isActive)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Toggle Status"><Power size={18}/></button>
                      <button onClick={() => handleDelete(shop.id, shop.shopName)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete Shop"><Trash2 size={18}/></button>
                    </div>
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

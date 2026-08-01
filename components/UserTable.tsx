"use client";

import { useState } from "react";
import { Mail, Clock, Users, X, Loader2, Shield, Power, PowerOff, Trash2 } from "lucide-react";
import { toggleUserStatus, deleteUserAccount } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import { UserAvatar } from "./UserAvatar";

const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN: { label: "Admin", color: "text-purple-700", bg: "bg-purple-50" },
  APP_OWNER: { label: "App Owner", color: "text-purple-700", bg: "bg-purple-50" },
  SHOP_OWNER: { label: "Shop Owner", color: "text-indigo-700", bg: "bg-indigo-50" },
  CLIENT: { label: "Client", color: "text-green-700", bg: "bg-green-50" },
};

export default function UserTable({ users: initialUsers }: { users: any[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleToggleStatus = async (user: any, newStatus: boolean) => {
    setIsProcessing(true);
    const res = await toggleUserStatus(user.id, newStatus);
    if (res.success) {
      setUsers(users.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u));
      setSelectedUser(null);
      router.refresh();
    } else {
      alert("Error: " + res.error);
    }
    setIsProcessing(false);
  };

  const handleDelete = async (user: any) => {
    if (!window.confirm(`WARNING: Are you sure you want to permanently delete the account for ${user.name}?`)) return;
    setIsProcessing(true);
    const res = await deleteUserAccount(user.id);
    if (res.success) {
      setUsers(users.filter(u => u.id !== user.id));
      setSelectedUser(null);
      router.refresh();
    } else {
      alert("Error: " + res.error);
    }
    setIsProcessing(false);
  };

  const getRoleBadge = (role: string) => {
    const config = roleConfig[role] || { label: role, color: "text-gray-700", bg: "bg-gray-100" };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        isActive !== false ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive !== false ? "bg-green-500" : "bg-red-500"}`} />
        {isActive !== false ? "Active" : "Inactive"}
      </span>
    );
  };

  const formatDate = (date: any) => {
    if (!date) return "Unknown";
    const d = typeof date === "string" ? date : new Date(date).toISOString();
    return d.split("T")[0];
  };

  return (
    <>
      {users.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No users found</h3>
          <p className="text-sm text-gray-500">Users will appear here once they sign up.</p>
        </div>
      ) : (
        <>
          {/* Mobile: Card List */}
          <div className="md:hidden space-y-3">
            {users.map((u: any) => (
              <div
                key={u.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.99] transition-transform"
              >
                <div className="p-4">
                  {/* User Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        user={u}
                        className="w-10 h-10 rounded-full"
                        fallbackClassName="bg-indigo-100 text-indigo-600 font-bold text-sm"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{u.name || "Unknown"}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <Mail size={11} />
                          <span>{u.email}</span>
                        </div>
                      </div>
                    </div>
                    {getRoleBadge(u.role)}
                  </div>

                  {/* Details */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 mb-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>Joined {formatDate(u.createdAt)}</span>
                    </div>
                    {getStatusBadge(u.isActive !== false)}
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => setSelectedUser(u)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 active:bg-indigo-200 transition-colors"
                  >
                    <Shield size={15} />
                    Manage User
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            user={u}
                            className="w-10 h-10 rounded-full"
                            fallbackClassName="bg-indigo-100 text-indigo-600 font-bold text-sm"
                          />
                          <div>
                            <div className="font-semibold text-gray-900">{u.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail size={12} /> {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                      <td className="px-6 py-4">{getStatusBadge(u.isActive !== false)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatDate(u.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setSelectedUser(u)} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium border border-indigo-200 px-3 py-1 rounded hover:bg-indigo-50 transition-colors">Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Manage User Modal / Bottom Sheet */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full md:max-w-md md:mx-4 overflow-hidden animate-slideUp md:animate-fadeIn">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Manage User</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* User Info */}
              <div className="flex items-center gap-3">
                <UserAvatar
                  user={selectedUser}
                  className="w-12 h-12 rounded-full"
                  fallbackClassName="bg-indigo-100 text-indigo-600 font-bold text-lg"
                />
                <div>
                  <p className="font-semibold text-gray-900 text-base">{selectedUser.name}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {selectedUser.isActive !== false ? (
                  <button
                    disabled={isProcessing}
                    onClick={() => handleToggleStatus(selectedUser, false)}
                    className="w-full flex items-center justify-center gap-2 h-12 bg-orange-50 text-orange-700 hover:bg-orange-100 active:bg-orange-200 font-medium rounded-xl disabled:opacity-50 transition-colors text-sm"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PowerOff size={16} />}
                    Deactivate Account
                  </button>
                ) : (
                  <button
                    disabled={isProcessing}
                    onClick={() => handleToggleStatus(selectedUser, true)}
                    className="w-full flex items-center justify-center gap-2 h-12 bg-green-50 text-green-700 hover:bg-green-100 active:bg-green-200 font-medium rounded-xl disabled:opacity-50 transition-colors text-sm"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power size={16} />}
                    Activate Account
                  </button>
                )}

                <div className="border-t border-gray-100"></div>

                <button
                  disabled={isProcessing}
                  onClick={() => handleDelete(selectedUser)}
                  className="w-full flex items-center justify-center gap-2 h-12 bg-red-600 text-white hover:bg-red-700 active:bg-red-800 font-medium rounded-xl disabled:opacity-50 transition-colors shadow-sm text-sm"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 size={16} />}
                  Permanently Remove Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

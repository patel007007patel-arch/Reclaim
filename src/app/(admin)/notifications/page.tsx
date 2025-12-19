"use client";

import React, { useEffect, useState } from "react";
import Toast from "@/components/ui/toast/Toast";
import Pagination from "@/components/tables/Pagination";
import ConfirmationDialog from "@/components/ui/confirmation-dialog/ConfirmationDialog";

type Target = "all" | "users";

interface Notification {
  _id: string;
  title: string;
  message: string;
  target: Target;
  userIds: string[];
  scheduledFor?: string | null;
  sentAt?: string | null;
  status: "draft" | "scheduled" | "sent" | "failed";
  users?: Array<{ _id: string; name: string; email: string }>;
}

interface User {
  _id: string;
  name: string;
  email: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info"; isVisible: boolean }>({
    message: "",
    type: "success",
    isVisible: false,
  });
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    id: string | null;
    message: string;
    action?: "delete" | "edit";
    item?: Notification | null;
  }>({
    isOpen: false,
    id: null,
    message: "",
    action: undefined,
    item: null,
  });
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [targetFilter, setTargetFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");

  const [form, setForm] = useState<Partial<Notification>>({
    title: "",
    message: "",
    target: "all",
    scheduledFor: "",
    status: "draft",
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users?limit=1000");
      const data = await res.json();
      if (data.success) {
        setAllUsers(data.users || []);
      }
    } catch (e) {
      console.error("Failed to load users", e);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "20");
      if (statusFilter) params.append("status", statusFilter);
      if (targetFilter) params.append("target", targetFilter);
      if (searchFilter) params.append("search", searchFilter);

      const res = await fetch(`/api/admin/notifications?${params}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        if (data.pagination) {
          setTotalPages(data.pagination.pages || 1);
        }
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [page, statusFilter, targetFilter, searchFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserSelector && !target.closest('.user-selector-container')) {
        setShowUserSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserSelector]);

  const resetForm = () => {
    setForm({
      title: "",
      message: "",
      target: "all",
      scheduledFor: "",
      status: "draft",
    });
    setSelectedUserIds([]);
    setEditingId(null);
    setShowUserSelector(false);
    setShowForm(false);
  };

  const handleAddClick = () => {
    resetForm();
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message) return;
    if (form.target === "users" && selectedUserIds.length === 0) {
      alert("Please select at least one user");
      return;
    }
    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId
        ? `/api/admin/notifications/${editingId}`
        : "/api/admin/notifications";

      const body: any = {
        title: form.title,
        message: form.message,
        target: form.target || "all",
        status: form.status || "draft",
      };
      if (form.target === "users") {
        body.userIds = selectedUserIds;
      }
      if (form.scheduledFor) body.scheduledFor = form.scheduledFor;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        await fetchItems();
        resetForm();
        setShowForm(false);
        setToast({
          message: editingId ? "Notification updated successfully" : "Notification created successfully",
          type: "success",
          isVisible: true,
        });
      } else {
        console.error("Save failed", data);
        setToast({
          message: data.message || (editingId ? "Failed to update notification" : "Failed to create notification"),
          type: "error",
          isVisible: true,
        });
      }
    } catch (e) {
      console.error("Save error", e);
      setToast({
        message: editingId ? "Failed to update notification" : "Failed to create notification",
        type: "error",
        isVisible: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (n: Notification) => {
    setConfirmDialog({
      isOpen: true,
      id: n._id,
      message: "Are you sure you want to edit this notification?",
      action: "edit",
      item: n,
    });
  };

  const handleEdit = () => {
    if (!confirmDialog.item || confirmDialog.action !== "edit") return;
    const n = confirmDialog.item;
    setEditingId(n._id);
    setShowForm(true);
    setForm({
      title: n.title,
      message: n.message,
      target: n.target,
      scheduledFor: n.scheduledFor
        ? n.scheduledFor.substring(0, 16)
        : "",
      status: n.status,
    });
    setSelectedUserIds(n.userIds || []);
    setShowUserSelector(n.target === "users");
    setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null });
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      id,
      message: "Are you sure you want to delete this notification? This action cannot be undone.",
      action: "delete",
      item: null,
    });
  };

  const handleDelete = async () => {
    if (!confirmDialog.id || confirmDialog.action !== "delete") return;
    try {
      const res = await fetch(`/api/admin/notifications/${confirmDialog.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchItems();
        setToast({
          message: "Notification deleted successfully",
          type: "success",
          isVisible: true,
        });
        setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null });
      } else {
        setToast({
          message: "Failed to delete notification",
          type: "error",
          isVisible: true,
        });
        setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null });
      }
    } catch (e) {
      console.error("Delete failed", e);
      setToast({
        message: "Failed to delete notification",
        type: "error",
        isVisible: true,
      });
      setConfirmDialog({ isOpen: false, id: null, message: "" });
    }
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredItems = items.filter((item) => {
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      return (
        item.title.toLowerCase().includes(searchLower) ||
        item.message.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Custom Notifications
        </h1>
      </div>

      {/* Form - Only show when showForm is true or editingId is set */}
      {(showForm || editingId) && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 relative">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-800 dark:text-gray-100">
            {editingId ? "Edit Notification" : "Create Notification"}
          </h2>
          <button
            type="button"
            onClick={resetForm}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close form"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Title
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
              value={form.title || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Message
            </label>
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
              rows={3}
              value={form.message || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, message: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Target
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={form.target || "all"}
              onChange={(e) => {
                const newTarget = e.target.value as Target;
                setForm((f) => ({ ...f, target: newTarget }));
                setShowUserSelector(newTarget === "users");
                if (newTarget === "all") {
                  setSelectedUserIds([]);
                }
              }}
            >
              <option value="all">All users</option>
              <option value="users">Selected users</option>
            </select>
          </div>

          {form.target === "users" && (
            <div className="md:col-span-2 user-selector-container">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Select Users ({selectedUserIds.length} selected)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onFocus={() => setShowUserSelector(true)}
                />
                {showUserSelector && (
                  <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {filteredUsers.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-500">
                        No users found
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <label
                          key={user._id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user._id)}
                            onChange={() => toggleUserSelection(user._id)}
                            className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
              {selectedUserIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedUserIds.map((userId) => {
                    const user = allUsers.find((u) => u._id === userId);
                    return user ? (
                      <span
                        key={userId}
                        className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-1 text-xs text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                      >
                        {user.name}
                        <button
                          type="button"
                          onClick={() => toggleUserSelection(userId)}
                          className="ml-1 text-brand-600 hover:text-brand-800"
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Schedule (optional)
            </label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={form.scheduledFor || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, scheduledFor: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Status
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={form.status || "draft"}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as Notification["status"],
                }))
              }
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-500 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-600 disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Save Changes" : "Save Notification"}
            </button>
          </div>
        </form>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </h3>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${showFilters ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showFilters && (
          <div className="p-4 grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by title or message..."
                value={searchFilter}
                onChange={(e) => {
                  setSearchFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Target
              </label>
              <select
                value={targetFilter}
                onChange={(e) => {
                  setTargetFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All Targets</option>
                <option value="all">All Users</option>
                <option value="users">Selected Users</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchFilter("");
                  setStatusFilter("");
                  setTargetFilter("");
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h2 className="text-sm font-medium text-gray-800 dark:text-gray-100">
            Notifications ({filteredItems.length})
          </h2>
          <button
            onClick={handleAddClick}
            className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
          >
            + Create Notification
          </button>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading && (
                <tr>
                  <td className="px-4 py-4 text-xs text-gray-500" colSpan={5}>
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && filteredItems.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-xs text-gray-500" colSpan={5}>
                    No notifications found.
                  </td>
                </tr>
              )}
              {filteredItems.map((n) => (
                <tr key={n._id}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {n.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {n.message}
                    </div>
                    {n.target === "users" && n.userIds && n.userIds.length > 0 && (
                      <div className="mt-1 text-[11px] text-gray-400">
                        {n.userIds.length} user{n.userIds.length !== 1 ? "s" : ""} selected
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    {n.target === "all" ? (
                      "All users"
                    ) : (
                      <span>
                        {n.userIds?.length || 0} selected user{n.userIds?.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    {n.scheduledFor
                      ? new Date(n.scheduledFor).toLocaleString()
                      : "Not scheduled"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        n.status === "sent"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                          : n.status === "scheduled"
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                          : n.status === "failed"
                          ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {n.status}
                    </span>
                    {n.sentAt && (
                      <div className="mt-1 text-[11px] text-gray-400">
                        Sent {new Date(n.sentAt).toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2 text-xs">
                      <button
                        onClick={() => handleEditClick(n)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(n._id)}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:border-red-800/70 dark:text-red-300 dark:hover:bg-red-900/40"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center border-t border-gray-100 px-4 py-3 dark:border-gray-800">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
      
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen && confirmDialog.action === "delete"}
        onClose={() => setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null })}
        onConfirm={handleDelete}
        title="Delete Notification"
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
      
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen && confirmDialog.action === "edit"}
        onClose={() => setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null })}
        onConfirm={handleEdit}
        title="Edit Notification"
        message={confirmDialog.message}
        confirmText="Edit"
        cancelText="Cancel"
        variant="info"
      />
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Toast from "@/components/ui/toast/Toast";
import StatusToggle from "@/components/ui/status-toggle/StatusToggle";
import ConfirmationDialog from "@/components/ui/confirmation-dialog/ConfirmationDialog";
import DatePicker from "@/components/form/date-picker";

interface Affirmation {
  _id: string;
  title?: string;
  text: string;
  reflectionPrompt?: string;
  scheduledFor?: string | null;
  active: boolean;
  archived: boolean;
}

export default function WeeklyAffirmationsPage() {
  const [items, setItems] = useState<Affirmation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Affirmation>>({
    title: "",
    text: "",
    reflectionPrompt: "",
    scheduledFor: "",
    active: true,
    archived: false,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
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
    action?: "delete" | "toggle" | "edit";
    item?: Affirmation | null;
    newStatus?: boolean;
  }>({
    isOpen: false,
    id: null,
    message: "",
    action: undefined,
    item: null,
    newStatus: undefined,
  });
  
  // Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [archivedFilter, setArchivedFilter] = useState<string>("");

  const fetchAffirmations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchFilter) params.append("search", searchFilter);
      if (activeFilter) params.append("active", activeFilter);
      if (archivedFilter) params.append("archived", archivedFilter);

      const res = await fetch(`/api/admin/weekly-affirmations?${params}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.affirmations);
      }
    } catch (e) {
      console.error("Failed to load weekly affirmations", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffirmations();
  }, [searchFilter, activeFilter, archivedFilter]);

  const resetForm = () => {
    setForm({
      title: "",
      text: "",
      reflectionPrompt: "",
      scheduledFor: "",
      active: true,
      archived: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleAddClick = () => {
    resetForm();
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.text) return;
    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId
        ? `/api/admin/weekly-affirmations/${editingId}`
        : "/api/admin/weekly-affirmations";

      const body: any = {
        title: form.title,
        text: form.text,
        reflectionPrompt: form.reflectionPrompt,
        scheduledFor: form.scheduledFor ? form.scheduledFor : null,
        active: !!form.active,
        archived: !!form.archived,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!data.success) {
        setToast({
          message: editingId ? "Failed to update affirmation" : "Failed to create affirmation",
          type: "error",
          isVisible: true,
        });
      } else {
        await fetchAffirmations();
        resetForm();
        setShowForm(false);
        setToast({
          message: editingId ? "Affirmation updated successfully" : "Affirmation created successfully",
          type: "success",
          isVisible: true,
        });
      }
    } catch (error) {
      console.error("Save error", error);
      setToast({
        message: editingId ? "Failed to update affirmation" : "Failed to create affirmation",
        type: "error",
        isVisible: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (item: Affirmation) => {
    setConfirmDialog({
      isOpen: true,
      id: item._id,
      message: "Are you sure you want to edit this affirmation?",
      action: "edit",
      item: item,
      newStatus: undefined,
    });
  };

  const handleEdit = () => {
    if (!confirmDialog.item || confirmDialog.action !== "edit") return;
    const item = confirmDialog.item;
    setEditingId(item._id);
    setShowForm(true);
    setForm({
      title: item.title || "",
      text: item.text,
      reflectionPrompt: item.reflectionPrompt || "",
      scheduledFor: item.scheduledFor ? new Date(item.scheduledFor).toISOString().split("T")[0] : "",
      active: item.active,
      archived: item.archived,
    });
    setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null, newStatus: undefined });
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      id,
      message: "Are you sure you want to delete this affirmation? This action cannot be undone.",
      action: "delete",
      item: null,
      newStatus: undefined,
    });
  };

  const handleDelete = async () => {
    if (!confirmDialog.id || confirmDialog.action !== "delete") return;
    try {
      const res = await fetch(`/api/admin/weekly-affirmations/${confirmDialog.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await fetchAffirmations();
        setToast({
          message: "Affirmation deleted successfully",
          type: "success",
          isVisible: true,
        });
        setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null, newStatus: undefined });
      } else {
        setToast({
          message: "Failed to delete affirmation",
          type: "error",
          isVisible: true,
        });
        setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null, newStatus: undefined });
      }
    } catch (e) {
      console.error("Delete failed", e);
      setToast({
        message: "Failed to delete affirmation",
        type: "error",
        isVisible: true,
      });
      setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null, newStatus: undefined });
    }
  };

  const toggleActiveClick = (item: Affirmation) => {
    const newActiveStatus = !item.active;
    const action = newActiveStatus ? "activate" : "deactivate";
    setConfirmDialog({
      isOpen: true,
      id: item._id,
      message: `Are you sure you want to ${action} this affirmation?`,
      action: "toggle",
      item: item,
      newStatus: newActiveStatus,
    });
  };

  const toggleActive = async () => {
    if (!confirmDialog.id || !confirmDialog.item || confirmDialog.action !== "toggle") return;
    try {
      const res = await fetch(`/api/admin/weekly-affirmations/${confirmDialog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: confirmDialog.newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchAffirmations();
        setToast({
          message: confirmDialog.newStatus
            ? "Affirmation activated successfully"
            : "Affirmation deactivated successfully",
          type: "success",
          isVisible: true,
        });
        setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null, newStatus: undefined });
      } else {
        setToast({
          message: "Failed to update affirmation status",
          type: "error",
          isVisible: true,
        });
        setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null, newStatus: undefined });
      }
    } catch (e) {
      console.error("Toggle active failed", e);
      setToast({
        message: "Failed to update affirmation status",
        type: "error",
        isVisible: true,
      });
      setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null, newStatus: undefined });
    }
  };


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
          Weekly Affirmations & Reflections
        </h1>
      </div>

      {/* Form */}
      {(showForm || editingId) && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 relative">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-800 dark:text-gray-100">
              {editingId ? "Edit Affirmation" : "Add New Affirmation"}
            </h2>
            <button
              type="button"
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Title (optional)
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
                value={form.title || ""}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Affirmation Text *
              </label>
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
                rows={3}
                value={form.text || ""}
                onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Reflection Prompt (optional)
              </label>
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
                rows={2}
                value={form.reflectionPrompt || ""}
                onChange={(e) => setForm((f) => ({ ...f, reflectionPrompt: e.target.value }))}
              />
            </div>

            <div>
              <DatePicker
                key={`weekly-scheduled-${editingId || 'new'}`}
                id="weekly-affirmation-scheduled-for-picker"
                label="Scheduled For (optional)"
                placeholder="Select date"
                defaultDate={form.scheduledFor || undefined}
                onChange={(selectedDates, dateStr) => {
                  setForm((f) => ({ ...f, scheduledFor: dateStr || "" }));
                }}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.active ?? true}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.archived ?? false}
                  onChange={(e) => setForm((f) => ({ ...f, archived: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Archived</span>
              </label>
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
                {saving ? "Saving..." : editingId ? "Save Changes" : "Add Affirmation"}
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
                placeholder="Search by title or text..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Status
              </label>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Archived
              </label>
              <select
                value={archivedFilter}
                onChange={(e) => setArchivedFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All</option>
                <option value="false">Not Archived</option>
                <option value="true">Archived</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchFilter("");
                  setActiveFilter("");
                  setArchivedFilter("");
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
            Affirmations ({items.length})
          </h2>
          <button
            onClick={handleAddClick}
            className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
          >
            + Add Affirmation
          </button>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Title / Text</th>
                <th className="px-4 py-3">Scheduled Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading && (
                <tr>
                  <td className="px-4 py-4 text-xs text-gray-500" colSpan={4}>
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-xs text-gray-500" colSpan={4}>
                    No affirmations yet. Create your first weekly affirmation above.
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr
                  key={item._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.title || item.text.substring(0, 50) + (item.text.length > 50 ? "..." : "")}
                      </div>
                      {item.title && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {item.text.substring(0, 50) + (item.text.length > 50 ? "..." : "")}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      {item.scheduledFor
                        ? new Date(item.scheduledFor).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : <span className="text-gray-400 dark:text-gray-500">Not scheduled</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusToggle
                      active={item.active}
                      activeLabel="Active"
                      inactiveLabel="Disabled"
                      onChange={(newActive) => {
                        if (newActive !== item.active) {
                          toggleActiveClick(item);
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2 text-xs">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item._id)}
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
      </div>
      
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen && confirmDialog.action === "delete"}
        onClose={() => setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null, newStatus: undefined })}
        onConfirm={handleDelete}
        title="Delete Affirmation"
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
      
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen && confirmDialog.action === "toggle"}
        onClose={() => setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null, newStatus: undefined })}
        onConfirm={toggleActive}
        title={confirmDialog.newStatus ? "Activate Affirmation" : "Deactivate Affirmation"}
        message={confirmDialog.message}
        confirmText="Confirm"
        cancelText="Cancel"
        variant="warning"
      />
      
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen && confirmDialog.action === "edit"}
        onClose={() => setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null, newStatus: undefined })}
        onConfirm={handleEdit}
        title="Edit Affirmation"
        message={confirmDialog.message}
        confirmText="Edit"
        cancelText="Cancel"
        variant="info"
      />
    </div>
  );
}

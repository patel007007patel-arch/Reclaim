"use client";

import React, { useEffect, useState } from "react";
import Toast from "@/components/ui/toast/Toast";
import Pagination from "@/components/tables/Pagination";
import ConfirmationDialog from "@/components/ui/confirmation-dialog/ConfirmationDialog";

type MediaType = "video" | "audio";

interface MediaItem {
  _id: string;
  title: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  tags: string[];
}

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState("");
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
    item?: MediaItem | null;
  }>({
    isOpen: false,
    id: null,
    message: "",
    action: undefined,
    item: null,
  });
  
  const [form, setForm] = useState<Partial<MediaItem>>({
    title: "",
    type: "video",
    url: "",
    thumbnailUrl: "",
    durationSeconds: undefined,
    tags: [],
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (searchFilter) params.append("search", searchFilter);
      if (typeFilter) params.append("type", typeFilter);
      if (tagFilter) params.append("tag", tagFilter);

      const res = await fetch(`/api/admin/media?${params}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        if (data.pagination) {
          setTotalPages(data.pagination.pages || 1);
        }
      }
    } catch (e) {
      console.error("Failed to load media items", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, searchFilter, typeFilter, tagFilter]);

  const resetForm = () => {
    setForm({
      title: "",
      type: "video",
      url: "",
      thumbnailUrl: "",
      durationSeconds: undefined,
      tags: [],
    });
    setTagInput("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleAddClick = () => {
    resetForm();
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.type || !form.url) return;
    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId
        ? `/api/admin/media/${editingId}`
        : "/api/admin/media";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        await fetchItems();
        resetForm();
        setShowForm(false);
        setToast({
          message: editingId ? "Media item updated successfully" : "Media item created successfully",
          type: "success",
          isVisible: true,
        });
      } else {
        setToast({
          message: editingId ? "Failed to update media item" : "Failed to create media item",
          type: "error",
          isVisible: true,
        });
      }
    } catch (e) {
      console.error("Save error", e);
      setToast({
        message: editingId ? "Failed to update media item" : "Failed to create media item",
        type: "error",
        isVisible: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (item: MediaItem) => {
    setConfirmDialog({
      isOpen: true,
      id: item._id,
      message: "Are you sure you want to edit this media item?",
      action: "edit",
      item: item,
    });
  };

  const handleEdit = () => {
    if (!confirmDialog.item || confirmDialog.action !== "edit") return;
    const item = confirmDialog.item;
    setEditingId(item._id);
    setShowForm(true);
    setForm({
      title: item.title,
      type: item.type,
      url: item.url,
      thumbnailUrl: item.thumbnailUrl,
      durationSeconds: item.durationSeconds,
      tags: item.tags,
    });
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      id,
      message: "Are you sure you want to delete this media item? This action cannot be undone.",
      action: "delete",
      item: null,
    });
  };

  const handleDelete = async () => {
    if (!confirmDialog.id || confirmDialog.action !== "delete") return;
    try {
      const res = await fetch(`/api/admin/media/${confirmDialog.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchItems();
        setToast({
          message: "Media item deleted successfully",
          type: "success",
          isVisible: true,
        });
        setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null });
      } else {
        setToast({
          message: "Failed to delete media item",
          type: "error",
          isVisible: true,
        });
        setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null });
      }
    } catch (e) {
      console.error("Delete failed", e);
      setToast({
        message: "Failed to delete media item",
        type: "error",
        isVisible: true,
      });
      setConfirmDialog({ isOpen: false, id: null, message: "" });
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    setForm((f) => ({
      ...f,
      tags: [...(f.tags || []), trimmed],
    }));
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setForm((f) => ({
      ...f,
      tags: (f.tags || []).filter((t) => t !== tag),
    }));
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
          Media Library (Video & Audio)
        </h1>
      </div>

      {/* Form - Only show when showForm is true or editingId is set */}
      {(showForm || editingId) && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 relative">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-800 dark:text-gray-100">
            {editingId ? "Edit Media Item" : "Add New Media"}
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

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Type
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={form.type || "video"}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as MediaType }))
              }
            >
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Media URL
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
              value={form.url || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, url: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Thumbnail URL (optional)
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
              value={form.thumbnailUrl || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Duration (seconds, optional)
            </label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
              value={form.durationSeconds ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  durationSeconds: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Tags
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                className="flex-1 rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={addTag}
                className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {(form.tags || []).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <span>#{tag}</span>
                  <span>×</span>
                </button>
              ))}
            </div>
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
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Media"}
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
                placeholder="Search by title..."
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
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Tag
              </label>
              <input
                type="text"
                placeholder="Filter by tag..."
                value={tagFilter}
                onChange={(e) => {
                  setTagFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchFilter("");
                  setTypeFilter("");
                  setTagFilter("");
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
            Media Items ({items.length})
          </h2>
          <button
            onClick={handleAddClick}
            className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
          >
            + Add Media
          </button>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Tags</th>
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
              {!loading && items.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-xs text-gray-500" colSpan={5}>
                    No media yet. Add your first item above.
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr key={item._id}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.title}
                    </div>
                    <div className="text-xs text-blue-600 underline dark:text-blue-400">
                      {item.url}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 capitalize dark:text-gray-300">
                    {item.type}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    {item.durationSeconds ? `${item.durationSeconds}s` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    {item.tags.map((t) => `#${t}`).join(", ")}
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
        title="Delete Media Item"
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
      
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen && confirmDialog.action === "edit"}
        onClose={() => setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null })}
        onConfirm={handleEdit}
        title="Edit Media Item"
        message={confirmDialog.message}
        confirmText="Edit"
        cancelText="Cancel"
        variant="info"
      />
    </div>
  );
}



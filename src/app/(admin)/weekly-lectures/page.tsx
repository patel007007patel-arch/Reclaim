"use client";

import React, { useEffect, useState } from "react";
import Toast from "@/components/ui/toast/Toast";
import StatusToggle from "@/components/ui/status-toggle/StatusToggle";
import Pagination from "@/components/tables/Pagination";

interface WeeklyLecture {
  _id: string;
  title: string;
  imageUrl?: string;
  affirmationText: string;
  reflectionText: string;
  weekOf: string;
  published: boolean;
  archived: boolean;
}

export default function WeeklyLecturesPage() {
  const [items, setItems] = useState<WeeklyLecture[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<string>("");
  const [archivedFilter, setArchivedFilter] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info"; isVisible: boolean }>({
    message: "",
    type: "success",
    isVisible: false,
  });
  const [form, setForm] = useState<Partial<WeeklyLecture>>({
    title: "",
    imageUrl: "",
    affirmationText: "",
    reflectionText: "",
    weekOf: "",
    published: false,
    archived: false,
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (searchFilter) params.append("search", searchFilter);
      if (publishedFilter) params.append("published", publishedFilter);
      if (archivedFilter) params.append("archived", archivedFilter);

      const res = await fetch(`/api/admin/weekly-lectures?${params}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        if (data.pagination) {
          setTotalPages(data.pagination.pages || 1);
        }
      }
    } catch (e) {
      console.error("Failed to load weekly lectures", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, searchFilter, publishedFilter, archivedFilter]);

  const resetForm = () => {
    setForm({
      title: "",
      imageUrl: "",
      affirmationText: "",
      reflectionText: "",
      weekOf: "",
      published: false,
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
    if (!form.title || !form.affirmationText || !form.reflectionText || !form.weekOf)
      return;
    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId
        ? `/api/admin/weekly-lectures/${editingId}`
        : "/api/admin/weekly-lectures";

      const body: any = {
        title: form.title,
        imageUrl: form.imageUrl,
        affirmationText: form.affirmationText,
        reflectionText: form.reflectionText,
        weekOf: form.weekOf,
        published: !!form.published,
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
          message: editingId ? "Failed to update weekly lecture" : "Failed to create weekly lecture",
          type: "error",
          isVisible: true,
        });
      } else {
        await fetchItems();
        resetForm();
        setShowForm(false);
        setToast({
          message: editingId ? "Weekly lecture updated successfully" : "Weekly lecture created successfully",
          type: "success",
          isVisible: true,
        });
      }
    } catch (error) {
      console.error("Save error", error);
      setToast({
        message: editingId ? "Failed to update weekly lecture" : "Failed to create weekly lecture",
        type: "error",
        isVisible: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: WeeklyLecture) => {
    setEditingId(item._id);
    setShowForm(true);
    setForm({
      title: item.title,
      imageUrl: item.imageUrl || "",
      affirmationText: item.affirmationText,
      reflectionText: item.reflectionText,
      weekOf: item.weekOf.substring(0, 10),
      published: item.published,
      archived: item.archived,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this weekly lecture?")) return;
    try {
      const res = await fetch(`/api/admin/weekly-lectures/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchItems();
        setToast({
          message: "Weekly lecture deleted successfully",
          type: "success",
          isVisible: true,
        });
      } else {
        setToast({
          message: "Failed to delete weekly lecture",
          type: "error",
          isVisible: true,
        });
      }
    } catch (e) {
      console.error("Delete failed", e);
      setToast({
        message: "Failed to delete weekly lecture",
        type: "error",
        isVisible: true,
      });
    }
  };

  const togglePublished = async (item: WeeklyLecture) => {
    const newPublishedStatus = !item.published;
    const action = newPublishedStatus ? "publish" : "unpublish";
    if (!confirm(`Are you sure you want to ${action} this weekly lecture?`)) return;
    try {
      const res = await fetch(`/api/admin/weekly-lectures/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: newPublishedStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchItems();
        setToast({
          message: newPublishedStatus
            ? "Weekly lecture published successfully"
            : "Weekly lecture unpublished successfully",
          type: "success",
          isVisible: true,
        });
      } else {
        setToast({
          message: "Failed to update publish status",
          type: "error",
          isVisible: true,
        });
      }
    } catch (e) {
      console.error("Toggle published failed", e);
      setToast({
        message: "Failed to update publish status",
        type: "error",
        isVisible: true,
      });
    }
  };

  const toggleArchive = async (item: WeeklyLecture) => {
    const newArchivedStatus = !item.archived;
    const action = newArchivedStatus ? "archive" : "unarchive";
    if (!confirm(`Are you sure you want to ${action} this weekly lecture?`)) return;
    try {
      const res = await fetch(`/api/admin/weekly-lectures/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: newArchivedStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchItems();
        setToast({
          message: newArchivedStatus
            ? "Weekly lecture archived successfully"
            : "Weekly lecture unarchived successfully",
          type: "success",
          isVisible: true,
        });
      } else {
        setToast({
          message: "Failed to update archive status",
          type: "error",
          isVisible: true,
        });
      }
    } catch (e) {
      console.error("Toggle archive failed", e);
      setToast({
        message: "Failed to update archive status",
        type: "error",
        isVisible: true,
      });
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
          Weekly Lecture (Affirmation + Media)
        </h1>
      </div>

      {/* Form - Only show when showForm is true or editingId is set */}
      {(showForm || editingId) && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 relative">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-800 dark:text-gray-100">
            {editingId ? "Edit Weekly Lecture" : "Add New Weekly Lecture"}
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
              Image URL (optional)
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
              value={form.imageUrl || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, imageUrl: e.target.value }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Weekly Affirmation Text
            </label>
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
              rows={3}
              value={form.affirmationText || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, affirmationText: e.target.value }))
              }
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Weekly Reflection Text
            </label>
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
              rows={3}
              value={form.reflectionText || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, reflectionText: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Week Of (start date)
            </label>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={form.weekOf || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, weekOf: e.target.value }))
              }
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={form.published ?? false}
                onChange={(e) =>
                  setForm((f) => ({ ...f, published: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              Published
            </label>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={form.archived ?? false}
                onChange={(e) =>
                  setForm((f) => ({ ...f, archived: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              Archived
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
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Lecture"}
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
                placeholder="Search by title or content..."
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
                Published
              </label>
              <select
                value={publishedFilter}
                onChange={(e) => {
                  setPublishedFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All</option>
                <option value="true">Published</option>
                <option value="false">Unpublished</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Status
              </label>
              <select
                value={archivedFilter}
                onChange={(e) => {
                  setArchivedFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="false">Active</option>
                <option value="true">Archived</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchFilter("");
                  setPublishedFilter("");
                  setArchivedFilter("");
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
            Weekly Lectures ({items.length})
          </h2>
          <button
            onClick={handleAddClick}
            className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
          >
            + Add Lecture
          </button>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Week Of</th>
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
                    No weekly lectures yet. Create the first one above.
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr key={item._id}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {item.affirmationText}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    {new Date(item.weekOf).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-3">
                      <StatusToggle
                        active={item.published}
                        activeLabel="Published"
                        inactiveLabel="Draft"
                        onChange={(isPublished) => {
                          if (isPublished !== item.published) {
                            togglePublished(item);
                          }
                        }}
                      />
                      <StatusToggle
                        active={!item.archived}
                        activeLabel="Active"
                        inactiveLabel="Archived"
                        onChange={(isActive) => {
                          if (isActive !== !item.archived) {
                            toggleArchive(item);
                          }
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2 text-xs">
                      <button
                        onClick={() => handleEdit(item)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
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
    </div>
  );
}



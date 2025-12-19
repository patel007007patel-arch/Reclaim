"use client";

import React, { useEffect, useState } from "react";
import Toast from "@/components/ui/toast/Toast";
import StatusToggle from "@/components/ui/status-toggle/StatusToggle";
import Pagination from "@/components/tables/Pagination";

interface Quote {
  _id: string;
  text: string;
  author?: string;
  tags: string[];
  active: boolean;
}

export default function QuotesPage() {
  const [items, setItems] = useState<Quote[]>([]);
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
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info"; isVisible: boolean }>({
    message: "",
    type: "success",
    isVisible: false,
  });
  const [form, setForm] = useState<Partial<Quote>>({
    text: "",
    author: "",
    tags: [],
    active: true,
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (searchFilter) params.append("search", searchFilter);
      if (activeFilter) params.append("active", activeFilter);
      if (authorFilter) params.append("author", authorFilter);

      const res = await fetch(`/api/admin/quotes?${params}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        if (data.pagination) {
          setTotalPages(data.pagination.pages || 1);
        }
      }
    } catch (e) {
      console.error("Failed to load quotes", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, searchFilter, activeFilter, authorFilter]);

  const resetForm = () => {
    setForm({ text: "", author: "", tags: [], active: true });
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
    if (!form.text) return;
    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId
        ? `/api/admin/quotes/${editingId}`
        : "/api/admin/quotes";

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
          message: editingId ? "Quote updated successfully" : "Quote created successfully",
          type: "success",
          isVisible: true,
        });
      } else {
        setToast({
          message: editingId ? "Failed to update quote" : "Failed to create quote",
          type: "error",
          isVisible: true,
        });
      }
    } catch (e) {
      console.error("Save error", e);
      setToast({
        message: editingId ? "Failed to update quote" : "Failed to create quote",
        type: "error",
        isVisible: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (q: Quote) => {
    setEditingId(q._id);
    setShowForm(true);
    setForm({
      text: q.text,
      author: q.author,
      tags: q.tags,
      active: q.active,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quote?")) return;
    try {
      const res = await fetch(`/api/admin/quotes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchItems();
        setToast({
          message: "Quote deleted successfully",
          type: "success",
          isVisible: true,
        });
      } else {
        setToast({
          message: "Failed to delete quote",
          type: "error",
          isVisible: true,
        });
      }
    } catch (e) {
      console.error("Delete failed", e);
      setToast({
        message: "Failed to delete quote",
        type: "error",
        isVisible: true,
      });
    }
  };

  const toggleActive = async (q: Quote) => {
    const newActiveStatus = !q.active;
    const action = newActiveStatus ? "activate" : "deactivate";
    if (!confirm(`Are you sure you want to ${action} this quote?`)) return;
    try {
      const res = await fetch(`/api/admin/quotes/${q._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: newActiveStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchItems();
        setToast({
          message: newActiveStatus
            ? "Quote activated successfully"
            : "Quote deactivated successfully",
          type: "success",
          isVisible: true,
        });
      } else {
        setToast({
          message: "Failed to update quote status",
          type: "error",
          isVisible: true,
        });
      }
    } catch (e) {
      console.error("Toggle active failed", e);
      setToast({
        message: "Failed to update quote status",
        type: "error",
        isVisible: true,
      });
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
          Motivational Quotes
        </h1>
      </div>

      {/* Form - Only show when showForm is true or editingId is set */}
      {(showForm || editingId) && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 relative">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-800 dark:text-gray-100">
            {editingId ? "Edit Quote" : "Add New Quote"}
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
              Quote Text
            </label>
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
              rows={3}
              value={form.text || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, text: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Author (optional)
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
              value={form.author || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, author: e.target.value }))
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

          <div className="flex items-center gap-2">
            <input
              id="quote-active"
              type="checkbox"
              checked={form.active ?? true}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <label
              htmlFor="quote-active"
              className="text-xs font-medium text-gray-600 dark:text-gray-300"
            >
              Active
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
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Quote"}
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
                placeholder="Search by text or author..."
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
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Author
              </label>
              <input
                type="text"
                placeholder="Filter by author..."
                value={authorFilter}
                onChange={(e) => {
                  setAuthorFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchFilter("");
                  setActiveFilter("");
                  setAuthorFilter("");
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
            Quotes ({items.length})
          </h2>
          <button
            onClick={handleAddClick}
            className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
          >
            + Add Quote
          </button>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Quote</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Tags</th>
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
              {!loading && items.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-xs text-gray-500" colSpan={5}>
                    No quotes yet. Create your first quote above.
                  </td>
                </tr>
              )}
              {items.map((q) => (
                <tr key={q._id}>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {q.text}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    {q.author || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    {q.tags.map((t) => `#${t}`).join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusToggle
                      active={q.active}
                      activeLabel="Active"
                      inactiveLabel="Inactive"
                      onChange={(newActive) => {
                        if (newActive !== q.active) {
                          toggleActive(q);
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2 text-xs">
                      <button
                        onClick={() => handleEdit(q)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(q._id)}
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



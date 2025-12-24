"use client";

import React, { useEffect, useState } from "react";
import Toast from "@/components/ui/toast/Toast";
import StatusToggle from "@/components/ui/status-toggle/StatusToggle";
import Pagination from "@/components/tables/Pagination";
import ConfirmationDialog from "@/components/ui/confirmation-dialog/ConfirmationDialog";

type ResourceCategory = "journey" | "motivation" | "lesson";

interface Resource {
  _id: string;
  title: string;
  description?: string;
  content: string;
  category: ResourceCategory;
  imageUrl?: string;
  videoUrl?: string;
  order?: number;
  active: boolean;
  archived: boolean;
}

export default function ResourcesPage() {
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<ResourceCategory>("journey");
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
    item?: Resource | null;
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
  const [archivedFilter, setArchivedFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [form, setForm] = useState<Partial<Resource>>({
    title: "",
    description: "",
    content: "",
    category: "journey",
    imageUrl: "",
    videoUrl: "",
    active: true,
    archived: false,
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        category: activeTab,
      });
      if (searchFilter) params.append("search", searchFilter);
      if (archivedFilter) params.append("archived", archivedFilter);
      if (activeFilter) params.append("active", activeFilter);

      const res = await fetch(`/api/admin/resources?${params}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.resources);
        if (data.pagination) {
          setTotalPages(data.pagination.pages || 1);
        }
      }
    } catch (e) {
      console.error("Failed to load resources", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, searchFilter, archivedFilter, activeFilter, activeTab]);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      content: "",
      category: activeTab,
      imageUrl: "",
      videoUrl: "",
      active: true,
      archived: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleAddClick = () => {
    resetForm();
    setForm((prev) => ({ ...prev, category: activeTab }));
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId
        ? `/api/admin/resources/${editingId}`
        : "/api/admin/resources";

      const body: any = {
        title: form.title,
        description: form.description,
        content: form.content,
        category: form.category || activeTab,
        imageUrl: form.imageUrl,
        videoUrl: form.videoUrl,
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
          message: editingId ? "Failed to update resource" : "Failed to create resource",
          type: "error",
          isVisible: true,
        });
      } else {
        await fetchItems();
        resetForm();
        setShowForm(false);
        setToast({
          message: editingId ? "Resource updated successfully" : "Resource created successfully",
          type: "success",
          isVisible: true,
        });
      }
    } catch (error) {
      console.error("Save error", error);
      setToast({
        message: editingId ? "Failed to update resource" : "Failed to create resource",
        type: "error",
        isVisible: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (item: Resource) => {
    setConfirmDialog({
      isOpen: true,
      id: item._id,
      message: "Are you sure you want to edit this resource?",
      action: "edit",
      item: item,
      newStatus: undefined,
    });
  };

  const handleEdit = () => {
    if (confirmDialog.item) {
      const item = confirmDialog.item;
      setForm({
        title: item.title,
        description: item.description || "",
        content: item.content,
        category: item.category,
        imageUrl: item.imageUrl || "",
        videoUrl: item.videoUrl || "",
        active: item.active,
        archived: item.archived,
      });
      setEditingId(item._id);
      setShowForm(true);
      setActiveTab(item.category);
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      id,
      message: "Are you sure you want to delete this resource?",
      action: "delete",
      item: null,
      newStatus: undefined,
    });
  };

  const handleDelete = async () => {
    if (!confirmDialog.id) return;
    try {
      const res = await fetch(`/api/admin/resources/${confirmDialog.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await fetchItems();
        setToast({
          message: "Resource deleted successfully",
          type: "success",
          isVisible: true,
        });
      } else {
        setToast({
          message: "Failed to delete resource",
          type: "error",
          isVisible: true,
        });
      }
    } catch (error) {
      console.error("Delete error", error);
      setToast({
        message: "Failed to delete resource",
        type: "error",
        isVisible: true,
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/resources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchItems();
        setToast({
          message: `Resource ${!currentStatus ? "activated" : "deactivated"} successfully`,
          type: "success",
          isVisible: true,
        });
      }
    } catch (error) {
      console.error("Toggle error", error);
    }
  };

  const tabs: { label: string; value: ResourceCategory }[] = [
    { label: "Journey", value: "journey" },
    { label: "Motivation", value: "motivation" },
    { label: "Lesson", value: "lesson" },
  ];

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
          Resources
        </h1>
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Resource
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value);
              setPage(1);
              setForm((prev) => ({ ...prev, category: tab.value }));
            }}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === tab.value
                ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search resources..."
          value={searchFilter}
          onChange={(e) => {
            setSearchFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white flex-1"
        />
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select
          value={archivedFilter}
          onChange={(e) => {
            setArchivedFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        >
          <option value="">All</option>
          <option value="false">Not Archived</option>
          <option value="true">Archived</option>
        </select>
      </div>

      {/* Form */}
      {(showForm || editingId) && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 relative">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-800 dark:text-gray-100">
              {editingId ? "Edit Resource" : "Add New Resource"}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={form.category || activeTab}
                onChange={(e) => setForm({ ...form, category: e.target.value as ResourceCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
              >
                <option value="journey">Journey</option>
                <option value="motivation">Motivation</option>
                <option value="lesson">Lesson</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                rows={2}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content *
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                rows={4}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Video URL
              </label>
              <input
                type="url"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.archived}
                  onChange={(e) => setForm({ ...form, archived: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Archived</span>
              </label>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No resources found</div>
      ) : (
        <>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 capitalize">{item.category}</td>
                      <td className="px-4 py-3">
                        <StatusToggle
                          active={item.active}
                          activeLabel="Active"
                          inactiveLabel="Inactive"
                          onChange={() => handleToggleActive(item._id, item.active)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item._id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400"
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
          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={() => {
          if (confirmDialog.action === "delete") {
            handleDelete();
          } else if (confirmDialog.action === "edit") {
            handleEdit();
          }
        }}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
}


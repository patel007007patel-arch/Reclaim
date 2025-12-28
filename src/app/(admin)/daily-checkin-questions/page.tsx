"use client";

import React, { useEffect, useState } from "react";
import Toast from "@/components/ui/toast/Toast";
import StatusToggle from "@/components/ui/status-toggle/StatusToggle";
import ConfirmationDialog from "@/components/ui/confirmation-dialog/ConfirmationDialog";

type QuestionType = "single" | "multi" | "single-picker" | "text";
type TextInputType = "plain-text" | "number" | "price";

interface Option {
  _id?: string;
  label: string;
  value: string;
}

interface Question {
  _id: string;
  title: string;
  description?: string;
  type: QuestionType;
  options: Option[];
  textInputType?: TextInputType;
  order: number;
  active: boolean;
}

export default function DailyCheckinQuestionsPage() {
  const [items, setItems] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Question>>({
    title: "",
    description: "",
    type: "single",
    options: [],
    textInputType: undefined,
    active: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
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
    item?: Question | null;
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
  const [typeFilter, setTypeFilter] = useState<string>("");

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchFilter) params.append("search", searchFilter);
      if (activeFilter) params.append("active", activeFilter);
      if (typeFilter) params.append("type", typeFilter);

      const res = await fetch(`/api/admin/daily-checkin-questions?${params}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.questions);
      }
    } catch (e) {
      console.error("Failed to load daily check-in questions", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [searchFilter, activeFilter, typeFilter]);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      type: "single",
      options: [],
      textInputType: undefined,
      active: true,
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
    if (!form.title || !form.type) return;
    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId
        ? `/api/admin/daily-checkin-questions/${editingId}`
        : "/api/admin/daily-checkin-questions";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!data.success) {
        setToast({
          message: editingId ? "Failed to update question" : "Failed to create question",
          type: "error",
          isVisible: true,
        });
      } else {
        await fetchQuestions();
        resetForm();
        setShowForm(false);
        setToast({
          message: editingId ? "Question updated successfully" : "Question created successfully",
          type: "success",
          isVisible: true,
        });
      }
    } catch (error) {
      console.error("Save error", error);
      setToast({
        message: editingId ? "Failed to update question" : "Failed to create question",
        type: "error",
        isVisible: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (q: Question) => {
    setConfirmDialog({
      isOpen: true,
      id: q._id,
      message: "Are you sure you want to edit this question?",
      action: "edit",
      item: q,
      newStatus: undefined,
    });
  };

  const handleEdit = () => {
    if (!confirmDialog.item || confirmDialog.action !== "edit") return;
    const q = confirmDialog.item;
    setEditingId(q._id);
    setShowForm(true);
    setForm({
      title: q.title,
      description: q.description,
      type: q.type,
      options: q.options || [],
      textInputType: q.textInputType || (q.type === "text" ? "plain-text" : undefined),
      active: q.active,
    });
    setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null, newStatus: undefined });
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      id,
      message: "Are you sure you want to delete this question? This action cannot be undone.",
      action: "delete",
      item: null,
      newStatus: undefined,
    });
  };

  const handleDelete = async () => {
    if (!confirmDialog.id || confirmDialog.action !== "delete") return;
    try {
      const res = await fetch(`/api/admin/daily-checkin-questions/${confirmDialog.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await fetchQuestions();
        setToast({
          message: "Question deleted successfully",
          type: "success",
          isVisible: true,
        });
        setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null, newStatus: undefined });
      } else {
        setToast({
          message: "Failed to delete question",
          type: "error",
          isVisible: true,
        });
        setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null, newStatus: undefined });
      }
    } catch (e) {
      console.error("Delete failed", e);
      setToast({
        message: "Failed to delete question",
        type: "error",
        isVisible: true,
      });
      setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null, newStatus: undefined });
    }
  };

  const toggleActiveClick = (q: Question) => {
    const newActiveStatus = !q.active;
    const action = newActiveStatus ? "activate" : "deactivate";
    setConfirmDialog({
      isOpen: true,
      id: q._id,
      message: `Are you sure you want to ${action} this question?`,
      action: "toggle",
      item: q,
      newStatus: newActiveStatus,
    });
  };

  const toggleActive = async () => {
    if (!confirmDialog.id || !confirmDialog.item || confirmDialog.action !== "toggle") return;
    try {
      const res = await fetch(`/api/admin/daily-checkin-questions/${confirmDialog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: confirmDialog.newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchQuestions();
        setToast({
          message: confirmDialog.newStatus
            ? "Question activated successfully"
            : "Question deactivated successfully",
          type: "success",
          isVisible: true,
        });
        setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null, newStatus: undefined });
      } else {
        setToast({
          message: "Failed to update question status",
          type: "error",
          isVisible: true,
        });
        setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null, newStatus: undefined });
      }
    } catch (e) {
      console.error("Toggle active failed", e);
      setToast({
        message: "Failed to update question status",
        type: "error",
        isVisible: true,
      });
      setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null, newStatus: undefined });
    }
  };

  const handleReorder = async (questionId: string, direction: "up" | "down") => {
    const sortedItems = [...items].sort((a, b) => a.order - b.order);
    const currentIndex = sortedItems.findIndex((q) => q._id === questionId);
    
    if (currentIndex === -1) return;
    
    if (direction === "up" && currentIndex === 0) return; // Already at top
    if (direction === "down" && currentIndex === sortedItems.length - 1) return; // Already at bottom
    
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const newOrder = [...sortedItems];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
    
    try {
      const res = await fetch("/api/admin/daily-checkin-questions/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder.map((q) => q._id) }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchQuestions();
      }
    } catch (e) {
      console.error("Reorder failed", e);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, questionId: string) => {
    setDraggedId(questionId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", questionId);
  };

  const handleDragOver = (e: React.DragEvent, questionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(questionId);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetQuestionId: string) => {
    e.preventDefault();
    setDragOverId(null);
    
    if (!draggedId || draggedId === targetQuestionId) {
      setDraggedId(null);
      return;
    }

    const sortedItems = [...items].sort((a, b) => a.order - b.order);
    const draggedIndex = sortedItems.findIndex((q) => q._id === draggedId);
    const targetIndex = sortedItems.findIndex((q) => q._id === targetQuestionId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    const newOrder = [...sortedItems];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    try {
      const res = await fetch("/api/admin/daily-checkin-questions/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: newOrder.map((q) => q._id) }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchQuestions();
      }
    } catch (e) {
      console.error("Reorder failed", e);
    } finally {
      setDraggedId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
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
          Daily Check-In Questions
        </h1>
      </div>

      {/* Form - Only show when showForm is true or editingId is set */}
      {(showForm || editingId) && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 relative">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-800 dark:text-gray-100">
              {editingId ? "Edit Question" : "Add New Question"}
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
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Description (optional)
            </label>
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
              rows={2}
              value={form.description || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              Type
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={form.type || "single"}
              onChange={(e) => {
                const newType = e.target.value as QuestionType;
                // Reset options when changing type (except if switching between compatible types)
                let newOptions = form.options || [];
                let newTextInputType = form.textInputType;
                if (newType === "text" && form.type !== "text") {
                  newOptions = [];
                  newTextInputType = "plain-text"; // Default for text type
                } else if ((newType === "single" || newType === "multi") && form.type !== "single" && form.type !== "multi") {
                  newOptions = [];
                  newTextInputType = undefined;
                } else if (newType === "single-picker" && form.type !== "single-picker") {
                  newOptions = [];
                  newTextInputType = undefined; // No textInputType for single-picker
                } else if (newType !== "text") {
                  newTextInputType = undefined;
                }
                setForm((f) => ({ ...f, type: newType, options: newOptions, textInputType: newTextInputType }));
              }}
            >
              <option value="single">Single choice</option>
              <option value="multi">Multi choice</option>
              <option value="single-picker">Single Picker</option>
              <option value="text">Text</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="daily-active"
              type="checkbox"
              checked={form.active ?? true}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <label
              htmlFor="daily-active"
              className="text-xs font-medium text-gray-600 dark:text-gray-300"
            >
              Active
            </label>
          </div>

          {/* Options Management for Single/Multi Choice */}
          {(form.type === "single" || form.type === "multi") && (
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Options
              </label>
              <div className="space-y-2">
                {(form.options || []).map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Label"
                      className="flex-1 rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
                      value={opt.label}
                      onChange={(e) => {
                        const newOptions = [...(form.options || [])];
                        newOptions[idx] = { ...newOptions[idx], label: e.target.value };
                        setForm((f) => ({ ...f, options: newOptions }));
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      className="flex-1 rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
                      value={opt.value}
                      onChange={(e) => {
                        const newOptions = [...(form.options || [])];
                        newOptions[idx] = { ...newOptions[idx], value: e.target.value };
                        setForm((f) => ({ ...f, options: newOptions }));
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newOptions = (form.options || []).filter((_, i) => i !== idx);
                        setForm((f) => ({ ...f, options: newOptions }));
                      }}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800/70 dark:text-red-300 dark:hover:bg-red-900/40"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newOptions = [...(form.options || []), { label: "", value: "" }];
                    setForm((f) => ({ ...f, options: newOptions }));
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  + Add Option
                </button>
              </div>
            </div>
          )}

          {/* Single Picker Options Management */}
          {form.type === "single-picker" && (
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Single Picker Options
                </label>
                
                <div className="space-y-2 mt-2">
                  {/* Custom Options */}
                  {(form.options || []).map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Label (e.g., Monday, Tuesday)"
                        className="flex-1 rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
                        value={opt.label}
                        onChange={(e) => {
                          const newOptions = [...(form.options || [])];
                          newOptions[idx] = { ...newOptions[idx], label: e.target.value };
                          setForm((f) => ({ ...f, options: newOptions }));
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g., monday, tuesday)"
                        className="flex-1 rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
                        value={opt.value}
                        onChange={(e) => {
                          const newOptions = [...(form.options || [])];
                          newOptions[idx] = { ...newOptions[idx], value: e.target.value };
                          setForm((f) => ({ ...f, options: newOptions }));
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newOptions = (form.options || []).filter((_, i) => i !== idx);
                          setForm((f) => ({ ...f, options: newOptions }));
                        }}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800/70 dark:text-red-300 dark:hover:bg-red-900/40"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newOptions = [...(form.options || []), { label: "", value: "" }];
                      setForm((f) => ({ ...f, options: newOptions }));
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    + Add Option
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Text Type - Only Text Input Type Selection */}
          {form.type === "text" && (
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Text Input Type
              </label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                value={form.textInputType || "plain-text"}
                onChange={(e) => setForm((f) => ({ ...f, textInputType: e.target.value as TextInputType }))}
              >
                <option value="plain-text">Plain Text</option>
                <option value="number">Number</option>
                <option value="price">Price</option>
              </select>
            </div>
          )}

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
              {saving ? "Saving..." : editingId ? "Save Changes" : "Add Question"}
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
                placeholder="Search by title or description..."
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
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="single">Single Choice</option>
                <option value="multi">Multi Choice</option>
                <option value="single-picker">Single Picker</option>
                <option value="text">Text</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchFilter("");
                  setActiveFilter("");
                  setTypeFilter("");
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
            Questions ({items.length})
          </h2>
          <button
            onClick={handleAddClick}
            className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
          >
            + Add Question
          </button>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Order</th>
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
                    No questions yet. Create your first daily check-in question above.
                  </td>
                </tr>
              )}
              {items
                .sort((a, b) => a.order - b.order)
                .map((q) => (
                <tr
                  key={q._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, q._id)}
                  onDragOver={(e) => handleDragOver(e, q._id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, q._id)}
                  onDragEnd={handleDragEnd}
                  className={`cursor-move transition-colors ${
                    draggedId === q._id
                      ? "opacity-50 bg-gray-100 dark:bg-gray-800"
                      : dragOverId === q._id
                      ? "bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-500"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-gray-400 flex-shrink-0 cursor-grab active:cursor-grabbing"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8h16M4 16h16"
                        />
                      </svg>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {q.title}
                      </div>
                    </div>
                    {q.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                        {q.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs capitalize text-gray-600 dark:text-gray-300">
                    {q.type}
                    {q.type === "text" && q.textInputType && (
                      <span className="ml-2 text-gray-400 dark:text-gray-500">
                        ({q.textInputType})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-600 dark:text-gray-300 mr-2">
                        {q.order}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleReorder(q._id, "up")}
                          disabled={items.sort((a, b) => a.order - b.order)[0]?._id === q._id}
                          className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <svg
                            className="w-3 h-3 text-gray-600 dark:text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleReorder(q._id, "down")}
                          disabled={
                            items.sort((a, b) => a.order - b.order)[items.length - 1]?._id ===
                            q._id
                          }
                          className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <svg
                            className="w-3 h-3 text-gray-600 dark:text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusToggle
                      active={q.active}
                      activeLabel="Active"
                      inactiveLabel="Disabled"
                      onChange={(newActive) => {
                        if (newActive !== q.active) {
                          toggleActiveClick(q);
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2 text-xs">
                      <button
                        onClick={() => handleEditClick(q)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(q._id)}
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
        title="Delete Question"
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
      
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen && confirmDialog.action === "toggle"}
        onClose={() => setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null, newStatus: undefined })}
        onConfirm={toggleActive}
        title={confirmDialog.newStatus ? "Activate Question" : "Deactivate Question"}
        message={confirmDialog.message}
        confirmText="Confirm"
        cancelText="Cancel"
        variant="warning"
      />
      
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen && confirmDialog.action === "edit"}
        onClose={() => setConfirmDialog({ isOpen: false, id: null, message: "", action: undefined, item: null, newStatus: undefined })}
        onConfirm={handleEdit}
        title="Edit Question"
        message={confirmDialog.message}
        confirmText="Edit"
        cancelText="Cancel"
        variant="info"
      />
    </div>
  );
}



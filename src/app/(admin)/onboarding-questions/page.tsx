"use client";

import React, { useEffect, useState } from "react";
import Toast from "@/components/ui/toast/Toast";
import DatePicker from "@/components/form/date-picker";
import StatusToggle from "@/components/ui/status-toggle/StatusToggle";

type QuestionType = "single" | "multi" | "date" | "number" | "days" | "text";

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
  order: number;
  active: boolean;
}

export default function OnboardingQuestionsPage() {
  const [items, setItems] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Question>>({
    title: "",
    description: "",
    type: "multi",
    options: [],
    active: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info"; isVisible: boolean }>({
    message: "",
    type: "success",
    isVisible: false,
  });
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  
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

      const res = await fetch(`/api/admin/onboarding-questions?${params}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.questions);
      }
    } catch (e) {
      console.error("Failed to load onboarding questions", e);
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
      type: "multi",
      options: [],
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
        ? `/api/admin/onboarding-questions/${editingId}`
        : "/api/admin/onboarding-questions";

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

  const handleEdit = (q: Question) => {
    setEditingId(q._id);
    setShowForm(true);
    setForm({
      title: q.title,
      description: q.description,
      type: q.type,
      options: q.options || [],
      active: q.active,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`/api/admin/onboarding-questions/${id}`, {
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
      } else {
        setToast({
          message: "Failed to delete question",
          type: "error",
          isVisible: true,
        });
      }
    } catch (e) {
      console.error("Delete failed", e);
      setToast({
        message: "Failed to delete question",
        type: "error",
        isVisible: true,
      });
    }
  };

  const toggleActive = async (q: Question) => {
    const newActiveStatus = !q.active;
    const action = newActiveStatus ? "activate" : "deactivate";
    if (!confirm(`Are you sure you want to ${action} this question?`)) return;
    try {
      const res = await fetch(`/api/admin/onboarding-questions/${q._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: newActiveStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchQuestions();
        setToast({
          message: newActiveStatus
            ? "Question activated successfully"
            : "Question deactivated successfully",
          type: "success",
          isVisible: true,
        });
      } else {
        setToast({
          message: "Failed to update question status",
          type: "error",
          isVisible: true,
        });
      }
    } catch (e) {
      console.error("Toggle active failed", e);
      setToast({
        message: "Failed to update question status",
        type: "error",
        isVisible: true,
      });
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
      const res = await fetch("/api/admin/onboarding-questions/reorder", {
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
      const res = await fetch("/api/admin/onboarding-questions/reorder", {
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
          Onboarding Questions
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
              value={form.type || "multi"}
              onChange={(e) => {
                const newType = e.target.value as QuestionType;
                // Reset options when changing type (except if switching between compatible types)
                let newOptions = form.options || [];
                if ((newType === "text") || 
                    (newType === "date" && form.type !== "date") ||
                    (newType === "number" && form.type !== "number") ||
                    ((newType === "single" || newType === "multi") && form.type !== "single" && form.type !== "multi") ||
                    (newType === "days" && form.type !== "days")) {
                  newOptions = [];
                }
                setForm((f) => ({ ...f, type: newType, options: newOptions }));
              }}
            >
              <option value="single">Single choice</option>
              <option value="multi">Multi choice</option>
              <option value="date">Date</option>
              <option value="number">Number</option>
              <option value="days">Days per week</option>
              <option value="text">Text</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="onb-active"
              type="checkbox"
              checked={form.active ?? true}
              onChange={(e) =>
                setForm((f) => ({ ...f, active: e.target.checked }))
              }
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <label
              htmlFor="onb-active"
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

          {/* Days Options Management */}
          {form.type === "days" && (
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Days Options
              </label>
              <div className="space-y-2">
                {/* Preset Days Options */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "7 days", value: "7" },
                    { label: "14 days", value: "14" },
                    { label: "30 days", value: "30" },
                    { label: "60 days", value: "60" },
                    { label: "90 days", value: "90" },
                  ].map((preset) => {
                    const exists = (form.options || []).some((opt) => opt.value === preset.value);
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => {
                          if (exists) {
                            const newOptions = (form.options || []).filter(
                              (opt) => opt.value !== preset.value
                            );
                            setForm((f) => ({ ...f, options: newOptions }));
                          } else {
                            const newOptions = [...(form.options || []), preset];
                            setForm((f) => ({ ...f, options: newOptions }));
                          }
                        }}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          exists
                            ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200"
                            : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Days Options */}
                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Custom Days:
                  </div>
                  {(form.options || [])
                    .filter((opt) => !["7", "14", "30", "60", "90"].includes(opt.value))
                    .map((opt, idx) => {
                      const actualIdx = (form.options || []).findIndex((o) => o === opt);
                      return (
                        <div key={actualIdx} className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Number of days (e.g., 15)"
                            min="1"
                            className="flex-1 rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
                            value={opt.value}
                            onChange={(e) => {
                              const daysValue = e.target.value;
                              const newOptions = [...(form.options || [])];
                              newOptions[actualIdx] = {
                                ...newOptions[actualIdx],
                                value: daysValue,
                                label: daysValue ? `${daysValue} days` : "",
                              };
                              setForm((f) => ({ ...f, options: newOptions }));
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newOptions = (form.options || []).filter(
                                (_, i) => i !== actualIdx
                              );
                              setForm((f) => ({ ...f, options: newOptions }));
                            }}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800/70 dark:text-red-300 dark:hover:bg-red-900/40"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  <button
                    type="button"
                    onClick={() => {
                      const newOptions = [...(form.options || []), { label: " days", value: "" }];
                      setForm((f) => ({ ...f, options: newOptions }));
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    + Add Custom Days
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Date Range Options */}
          {form.type === "date" && (
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Date Range (optional)
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <DatePicker
                    id="start-date-picker"
                    label="Start Date"
                    placeholder="Select start date"
                    defaultDate={
                      (form.options || []).find((opt) => opt.value === "startDate")?.label
                        ? (form.options || []).find((opt) => opt.value === "startDate")?.label
                        : undefined
                    }
                    onChange={(selectedDates, dateStr) => {
                      const newOptions = (form.options || []).filter(
                        (opt) => opt.value !== "startDate"
                      );
                      if (dateStr) {
                        newOptions.push({ label: dateStr, value: "startDate" });
                      }
                      setForm((f) => ({ ...f, options: newOptions }));
                    }}
                  />
                </div>
                <div>
                  <DatePicker
                    id="end-date-picker"
                    label="End Date"
                    placeholder="Select end date"
                    defaultDate={
                      (form.options || []).find((opt) => opt.value === "endDate")?.label
                        ? (form.options || []).find((opt) => opt.value === "endDate")?.label
                        : undefined
                    }
                    onChange={(selectedDates, dateStr) => {
                      const newOptions = (form.options || []).filter(
                        (opt) => opt.value !== "endDate"
                      );
                      if (dateStr) {
                        newOptions.push({ label: dateStr, value: "endDate" });
                      }
                      setForm((f) => ({ ...f, options: newOptions }));
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Set optional date range limits for user input
              </p>
            </div>
          )}

          {/* Number Options Management */}
          {form.type === "number" && (
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                Number Options
              </label>
              <div className="space-y-2">
                {/* Preset Number Options */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "1", value: "1" },
                    { label: "5", value: "5" },
                    { label: "10", value: "10" },
                    { label: "25", value: "25" },
                    { label: "50", value: "50" },
                    { label: "100", value: "100" },
                  ].map((preset) => {
                    const exists = (form.options || []).some((opt) => opt.value === preset.value);
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => {
                          if (exists) {
                            const newOptions = (form.options || []).filter(
                              (opt) => opt.value !== preset.value
                            );
                            setForm((f) => ({ ...f, options: newOptions }));
                          } else {
                            const newOptions = [...(form.options || []), preset];
                            setForm((f) => ({ ...f, options: newOptions }));
                          }
                        }}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          exists
                            ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200"
                            : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Number Options */}
                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Custom Numbers:
                  </div>
                  {(form.options || [])
                    .filter((opt) => !["1", "5", "10", "25", "50", "100"].includes(opt.value))
                    .map((opt, idx) => {
                      const actualIdx = (form.options || []).findIndex((o) => o === opt);
                      return (
                        <div key={actualIdx} className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Enter number (e.g., 15)"
                            className="flex-1 rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
                            value={opt.value}
                            onChange={(e) => {
                              const numValue = e.target.value;
                              const newOptions = [...(form.options || [])];
                              newOptions[actualIdx] = {
                                ...newOptions[actualIdx],
                                value: numValue,
                                label: numValue || "",
                              };
                              setForm((f) => ({ ...f, options: newOptions }));
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newOptions = (form.options || []).filter(
                                (_, i) => i !== actualIdx
                              );
                              setForm((f) => ({ ...f, options: newOptions }));
                            }}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800/70 dark:text-red-300 dark:hover:bg-red-900/40"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  <button
                    type="button"
                    onClick={() => {
                      const newOptions = [...(form.options || []), { label: "", value: "" }];
                      setForm((f) => ({ ...f, options: newOptions }));
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    + Add Custom Number
                  </button>
                </div>
              </div>
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
                <option value="date">Date</option>
                <option value="number">Number</option>
                <option value="days">Days</option>
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
                    No questions yet. Create your first onboarding question above.
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
      </div>
    </div>
  );
}



"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Image from "next/image";
import Toast from "@/components/ui/toast/Toast";
import StatusToggle from "@/components/ui/status-toggle/StatusToggle";

interface User {
  _id: string;
  name: string;
  email: string;
  streak?: number;
  activity?: {
    lastCheckIn?: string;
    totalCheckIns?: number;
    totalPosts?: number;
  };
  onboardingAnswers?: Array<{
    questionId: string;
    questionTitle?: string; // Optional, populated by API
    answer: any;
    answeredAt: string;
  }>;
  dailyCheckinAnswers?: Array<{
    questionId: string;
    questionTitle?: string; // Optional, populated by API
    answer: any;
    answeredAt: string;
    checkInDate: string;
  }>;
  deviceSyncStatus?: {
    lastSync?: string;
    deviceId?: string;
    platform?: string;
  };
  active: boolean;
  createdAt: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info"; isVisible: boolean }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.append("search", search);
      if (activeFilter) params.append("active", activeFilter);

      const res = await fetch(`/api/admin/users?${params}`, {
        credentials: "include", // Include cookies for authentication
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setTotalPages(data.pagination.pages);
      }
    } catch (e) {
      console.error("Failed to load users", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, activeFilter]);

  const handleDeactivate = async (userId: string, currentActive: boolean) => {
    const newActiveStatus = !currentActive;
    const action = newActiveStatus ? "activate" : "deactivate";
    if (!confirm(`Are you sure you want to ${action} this user?`))
      return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({ active: newActiveStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchUsers();
        setToast({
          message: `User ${newActiveStatus ? "activated" : "deactivated"} successfully`,
          type: "success",
          isVisible: true,
        });
      } else {
        setToast({
          message: `Failed to ${action} user`,
          type: "error",
          isVisible: true,
        });
      }
    } catch (e) {
      console.error("Failed to update user", e);
      setToast({
        message: `Failed to ${action} user`,
        type: "error",
        isVisible: true,
      });
    }
  };

  const handleExport = async (userId: string) => {
    try {
      setToast({
        message: "Exporting user data...",
        type: "info",
        isVisible: true,
      });

      const res = await fetch(`/api/admin/users/${userId}/export`, {
        credentials: "include", // Include cookies for authentication
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(errorData.message || `Export failed: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      if (data.success && data.data) {
        const jsonString = JSON.stringify(data.data, null, 2);
        const blob = new Blob([jsonString], {
          type: "application/json;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `user-export-${userId}-${new Date().toISOString().split("T")[0]}.json`;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        
        // Clean up after a short delay
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        setToast({
          message: "User data exported successfully",
          type: "success",
          isVisible: true,
        });
      } else {
        throw new Error(data.message || "Export failed: Invalid response");
      }
    } catch (e: any) {
      console.error("Failed to export user", e);
      setToast({
        message: e.message || "Failed to export user data",
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
          Users Management
        </h1>
      </div>

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
          <div className="p-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
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
                <option value="">All Users</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearch("");
                  setActiveFilter("");
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
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Streak</th>
                <th className="px-4 py-3">Activity</th>
                <th className="px-4 py-3">Device Sync</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading && (
                <tr>
                  <td className="px-4 py-4 text-xs text-gray-500" colSpan={6}>
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-xs text-gray-500" colSpan={6}>
                    No users found.
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {user.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    {user.streak || 0} days
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    <div>Check-ins: {user.activity?.totalCheckIns || 0}</div>
                    <div>Posts: {user.activity?.totalPosts || 0}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    {user.deviceSyncStatus?.lastSync
                      ? new Date(user.deviceSyncStatus.lastSync).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusToggle
                      active={user.active}
                      activeLabel="Active"
                      inactiveLabel="Inactive"
                      onChange={(newActive) => handleDeactivate(user._id, !newActive)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2 text-xs">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => handleExport(user._id)}
                        className="rounded-lg border border-blue-200 px-2.5 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50 dark:border-blue-800/70 dark:text-blue-300 dark:hover:bg-blue-900/40"
                      >
                        Export
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-800">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                User Profile: {selectedUser.name}
              </h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Basic Info
                </h3>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Email: {selectedUser.email}</div>
                  <div>Streak: {selectedUser.streak || 0} days</div>
                  <div>Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Activity
                </h3>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Total Check-ins: {selectedUser.activity?.totalCheckIns || 0}</div>
                  <div>Total Posts: {selectedUser.activity?.totalPosts || 0}</div>
                  <div>
                    Last Check-in:{" "}
                    {selectedUser.activity?.lastCheckIn
                      ? new Date(selectedUser.activity.lastCheckIn).toLocaleString()
                      : "Never"}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Device Sync Status
                </h3>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Platform: {selectedUser.deviceSyncStatus?.platform || "N/A"}</div>
                  <div>
                    Last Sync:{" "}
                    {selectedUser.deviceSyncStatus?.lastSync
                      ? new Date(selectedUser.deviceSyncStatus.lastSync).toLocaleString()
                      : "Never"}
                  </div>
                </div>
              </div>
              {selectedUser.onboardingAnswers && selectedUser.onboardingAnswers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Onboarding Answers
                  </h3>
                  <div className="space-y-2">
                    {selectedUser.onboardingAnswers.map((answer, idx) => (
                      <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 border-l-2 border-gray-200 pl-2">
                        <div className="font-medium">{answer.questionTitle}</div>
                        <div className="mt-1">
                          {typeof answer.answer === "object"
                            ? JSON.stringify(answer.answer)
                            : answer.answer}
                        </div>
                        <div className="mt-1 text-gray-500 dark:text-gray-500">
                          Answered: {new Date(answer.answeredAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedUser.dailyCheckinAnswers && selectedUser.dailyCheckinAnswers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Daily Check-In Answers
                  </h3>
                  <div className="space-y-3">
                    {/* Group answers by check-in date */}
                    {(() => {
                      const groupedByDate = selectedUser.dailyCheckinAnswers.reduce((acc: any, answer) => {
                        const dateKey = new Date(answer.checkInDate).toLocaleDateString();
                        if (!acc[dateKey]) {
                          acc[dateKey] = [];
                        }
                        acc[dateKey].push(answer);
                        return acc;
                      }, {});

                      return Object.entries(groupedByDate)
                        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                        .map(([date, answers]: [string, any]) => (
                          <div key={date} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                            <div className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
                              {date}
                            </div>
                            <div className="space-y-2">
                              {answers.map((answer: any, idx: number) => (
                                <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 border-l-2 border-blue-200 dark:border-blue-800 pl-2">
                                  <div className="font-medium">{answer.questionTitle || `Question ID: ${answer.questionId}`}</div>
                                  <div className="mt-1">
                                    {typeof answer.answer === "object"
                                      ? JSON.stringify(answer.answer)
                                      : answer.answer}
                                  </div>
                                  <div className="mt-1 text-gray-500 dark:text-gray-500">
                                    Answered: {new Date(answer.answeredAt).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ));
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

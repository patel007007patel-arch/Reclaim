"use client";

import React, { useEffect, useState } from "react";
import Toast from "@/components/ui/toast/Toast";
import StatusToggle from "@/components/ui/status-toggle/StatusToggle";
import Pagination from "@/components/tables/Pagination";

interface Post {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  status: "pending" | "approved" | "rejected";
  published?: boolean;
  visibility: "public" | "private";
  flagged: boolean;
  createdAt: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
}

export default function CommunityPostsPage() {
  const [items, setItems] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info"; isVisible: boolean }>({
    message: "",
    type: "success",
    isVisible: false,
  });
  
  // Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [publishedFilter, setPublishedFilter] = useState<string>("");
  const [flaggedFilter, setFlaggedFilter] = useState<string>("");

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (searchFilter) params.append("search", searchFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (publishedFilter) params.append("published", publishedFilter);
      if (flaggedFilter) params.append("flagged", flaggedFilter);

      const res = await fetch(`/api/admin/posts?${params}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.posts || data.items || []);
        if (data.pagination) {
          setTotalPages(data.pagination.pages || 1);
        }
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error("Failed to load posts", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, searchFilter, statusFilter, publishedFilter, flaggedFilter]);

  const updatePost = async (id: string, payload: Partial<Post>) => {
    // Determine action for confirmation
    let confirmMessage = "";
    if (payload.status === "approved") confirmMessage = "Are you sure you want to approve this post?";
    else if (payload.status === "rejected") confirmMessage = "Are you sure you want to reject this post?";
    else if (payload.published === true) confirmMessage = "Are you sure you want to publish this post?";
    else if (payload.published === false) confirmMessage = "Are you sure you want to unpublish this post?";
    else if (payload.flagged === true) confirmMessage = "Are you sure you want to flag this post?";
    else if (payload.flagged === false) confirmMessage = "Are you sure you want to unflag this post?";
    
    if (confirmMessage && !confirm(confirmMessage)) {
      return;
    }

    // Optimistic update
    setItems((prevItems) =>
      prevItems.map((item) =>
        item._id === id ? { ...item, ...payload } : item
      )
    );

    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh to get the latest data from server
        await fetchItems();
        let message = "Post updated successfully";
        if (payload.status === "approved") message = "Post approved successfully";
        else if (payload.status === "rejected") message = "Post rejected successfully";
        else if (payload.published === true) message = "Post published successfully";
        else if (payload.published === false) message = "Post unpublished successfully";
        else if (payload.flagged === true) message = "Post flagged successfully";
        else if (payload.flagged === false) message = "Post unflagged successfully";
        
        setToast({
          message,
          type: "success",
          isVisible: true,
        });
      } else {
        // Revert optimistic update on error
        await fetchItems();
        setToast({
          message: "Failed to update post",
          type: "error",
          isVisible: true,
        });
      }
    } catch (e) {
      console.error("Update failed", e);
      // Revert optimistic update on error
      await fetchItems();
      setToast({
        message: "Failed to update post",
        type: "error",
        isVisible: true,
      });
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchItems();
        setToast({
          message: "Post deleted successfully",
          type: "success",
          isVisible: true,
        });
      } else {
        setToast({
          message: "Failed to delete post",
          type: "error",
          isVisible: true,
        });
      }
    } catch (e) {
      console.error("Delete failed", e);
      setToast({
        message: "Failed to delete post",
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
          Community / Public Posts
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
          <div className="p-4 grid gap-4 md:grid-cols-5">
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
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
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
                <option value="false">Draft</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Flagged
              </label>
              <select
                value={flaggedFilter}
                onChange={(e) => {
                  setFlaggedFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">All</option>
                <option value="true">Flagged</option>
                <option value="false">Not Flagged</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchFilter("");
                  setStatusFilter("");
                  setPublishedFilter("");
                  setFlaggedFilter("");
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

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h2 className="text-sm font-medium text-gray-800 dark:text-gray-100">
            Posts ({items?.length || 0})
          </h2>
        </div>
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Post</th>
                <th className="px-4 py-3">Moderation</th>
                <th className="px-4 py-3">Publication</th>
                <th className="px-4 py-3">Flags</th>
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
              {!loading && items.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-xs text-gray-500" colSpan={6}>
                    No posts yet.
                  </td>
                </tr>
              )}
              {items.map((p) => (
                <tr key={p._id}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {p.user?.name || "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {p.user?.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {p.title}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                      {p.content}
                    </div>
                    {p.imageUrl && (
                      <div className="mt-1 text-[11px] text-blue-600 underline dark:text-blue-400">
                        {p.imageUrl}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      <StatusToggle
                        active={p.status === "approved"}
                        activeLabel="Approve"
                        inactiveLabel="Reject"
                        onChange={(isApproved) =>
                          updatePost(p._id, { status: isApproved ? "approved" : "rejected" })
                        }
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      <StatusToggle
                        active={!!p.published}
                        activeLabel="Published"
                        inactiveLabel="Draft"
                        onChange={(isPublished) => {
                          updatePost(p._id, { published: isPublished });
                        }}
                      />
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {p.visibility === "public" ? "Public" : "Private"}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    {p.flagged ? "Flagged" : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex flex-wrap items-center justify-end gap-2 text-xs">
                      <button
                        onClick={() => updatePost(p._id, { flagged: !p.flagged })}
                        className="rounded-lg border border-yellow-200 px-2.5 py-1 text-[11px] font-medium text-yellow-700 hover:bg-yellow-50 dark:border-yellow-800/70 dark:text-yellow-200 dark:hover:bg-yellow-900/40"
                      >
                        {p.flagged ? "Unflag" : "Flag"}
                      </button>
                      <button
                        onClick={() => deletePost(p._id)}
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



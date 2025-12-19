"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface Admin {
  id: string;
  email: string;
  name: string;
}

export default function AdminProfile() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdmin();
  }, []);

  const fetchAdmin = async () => {
    try {
      const res = await fetch("/api/admin/me");
      const data = await res.json();
      if (data.success) {
        setAdmin(data.admin);
        setFormData({
          name: data.admin.name || "",
          email: data.admin.email || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch admin", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name }),
      });
      const data = await res.json();
      if (data.success) {
        setAdmin(data.admin);
        setEditing(false);
      } else {
        alert(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Admin Profile
        </h1>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-800">
            <div className="relative w-24 h-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <Image
                width={96}
                height={96}
                src="/images/user/owner.jpg"
                alt={admin.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Email cannot be changed
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          name: admin.name || "",
                          email: admin.email || "",
                        });
                      }}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {admin.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {admin.email}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Profile Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
              <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Account Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Email:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {admin.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Name:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {admin.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Role:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Administrator
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
              <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Security
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Password:
                  </span>
                  <button className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                    Change Password
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Two-Factor:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Not enabled
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

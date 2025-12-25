"use client";

import React, { useEffect, useState } from "react";
import { GroupIcon, BoxIconLine } from "@/icons";
import { getIconComponent } from "@/utils/iconUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(
  () => import("react-apexcharts").then((mod) => mod.default || mod).catch(() => {
    // Return a placeholder component if import fails
    const Placeholder = () => null;
    return { default: Placeholder };
  }),
  {
    ssr: false,
  }
);

interface DashboardStats {
  activeUsers: number;
  recentSignups: number;
  recentPosts: number;
  upcomingContent: number;
  totalPosts: number;
  pendingPosts: number;
  flaggedPosts: number;
  totalUsers: number;
}

interface RecentUser {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface RecentPost {
  _id: string;
  title: string;
  user?: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface FlaggedPost {
  _id: string;
  title: string;
  flagCount?: number;
  archived: boolean;
  user?: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface ChartData {
  monthly: {
    categories: string[];
    userSignups: number[];
    posts: number[];
    approvedPosts: number[];
  };
  daily: {
    categories: string[];
    userSignups: number[];
    posts: number[];
  };
}

interface DailyAffirmation {
  _id: string;
  title?: string;
  text: string;
  reflectionPrompt?: string;
  scheduledFor?: string;
  active: boolean;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [todayAffirmation, setTodayAffirmation] = useState<DailyAffirmation | null>(null);
  const [nextDayAffirmation, setNextDayAffirmation] = useState<DailyAffirmation | null>(null);
  const [editingAffirmation, setEditingAffirmation] = useState<string | null>(null); // "today" | "next" | null
  const [affirmationText, setAffirmationText] = useState("");
  const [savingAffirmation, setSavingAffirmation] = useState(false);
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);
  const [updatingPost, setUpdatingPost] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch on client side
    if (typeof window !== 'undefined') {
      fetchDashboardData();
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch("/api/admin/dashboard/stats");
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Fetch chart data
      const chartsRes = await fetch("/api/admin/dashboard/charts");
      const chartsData = await chartsRes.json();
      if (chartsData.success) {
        setChartData(chartsData);
      }

      // Fetch recent users (limit 10)
      const usersRes = await fetch("/api/admin/users?limit=10");
      const usersData = await usersRes.json();
      if (usersData.success) {
        setRecentUsers(usersData.users?.slice(0, 10) || []);
      }

      // Fetch recent posts (limit 10)
      const postsRes = await fetch("/api/admin/posts?limit=10");
      const postsData = await postsRes.json();
      if (postsData.success) {
        setRecentPosts((postsData.posts || []).slice(0, 10));
      }

      // Fetch today's affirmation
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(tomorrow.getDate() + 1);

      const todayRes = await fetch(`/api/admin/daily-affirmations?active=true&scheduledFor=${today.toISOString()}`);
      const todayData = await todayRes.json();
      if (todayData.success && todayData.affirmations?.length > 0) {
        setTodayAffirmation(todayData.affirmations[0]);
        setAffirmationText(todayData.affirmations[0].text);
      } else {
        // Try to get any active affirmation
        const anyRes = await fetch("/api/admin/daily-affirmations?active=true&limit=1");
        const anyData = await anyRes.json();
        if (anyData.success && anyData.affirmations?.length > 0) {
          setTodayAffirmation(anyData.affirmations[0]);
          setAffirmationText(anyData.affirmations[0].text);
        }
      }

      // Fetch next day affirmation
      const nextRes = await fetch(`/api/admin/daily-affirmations?active=true&scheduledFor=${tomorrow.toISOString()}`);
      const nextData = await nextRes.json();
      if (nextData.success && nextData.affirmations?.length > 0) {
        setNextDayAffirmation(nextData.affirmations[0]);
      }

      // Fetch flagged posts (latest 10)
      const flaggedRes = await fetch("/api/admin/posts?flagged=true&limit=10");
      const flaggedData = await flaggedRes.json();
      if (flaggedData.success) {
        setFlaggedPosts((flaggedData.posts || []).slice(0, 10));
      }
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchivePost = async (postId: string, archived: boolean) => {
    setUpdatingPost(postId);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });
      const data = await res.json();
      if (data.success) {
        setFlaggedPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, archived } : p))
        );
      }
    } catch (error) {
      console.error("Failed to update post", error);
    } finally {
      setUpdatingPost(null);
    }
  };

  const handleSaveAffirmation = async (type: "today" | "next") => {
    if (!affirmationText.trim()) {
      alert("Affirmation text cannot be empty");
      return;
    }
    setSavingAffirmation(true);
    try {
      const targetDate = new Date();
      if (type === "next") {
        targetDate.setDate(targetDate.getDate() + 1);
      }
      targetDate.setHours(0, 0, 0, 0);

      if (type === "today" && todayAffirmation) {
        // Update existing today's affirmation
        const res = await fetch(`/api/admin/daily-affirmations/${todayAffirmation._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: affirmationText }),
        });
        const data = await res.json();
        if (data.success) {
          setTodayAffirmation(data.affirmation);
          setEditingAffirmation(null);
          await fetchDashboardData(); // Refresh to get updated data
        } else {
          alert("Failed to update affirmation");
        }
      } else if (type === "next" && nextDayAffirmation) {
        // Update existing next day's affirmation
        const res = await fetch(`/api/admin/daily-affirmations/${nextDayAffirmation._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: affirmationText }),
        });
        const data = await res.json();
        if (data.success) {
          setNextDayAffirmation(data.affirmation);
          setEditingAffirmation(null);
          await fetchDashboardData(); // Refresh to get updated data
        } else {
          alert("Failed to update affirmation");
        }
      } else {
        // Create new affirmation
        const res = await fetch("/api/admin/daily-affirmations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: affirmationText,
            scheduledFor: targetDate.toISOString(),
            active: true,
          }),
        });
        const data = await res.json();
        if (data.success) {
          if (type === "today") {
            setTodayAffirmation(data.affirmation);
          } else {
            setNextDayAffirmation(data.affirmation);
          }
          setEditingAffirmation(null);
          await fetchDashboardData(); // Refresh to get updated data
        } else {
          alert("Failed to create affirmation");
        }
      }
    } catch (error) {
      console.error("Failed to save affirmation", error);
      alert("Failed to save affirmation");
    } finally {
      setSavingAffirmation(false);
    }
  };

  // Bar Chart Options
  const barChartOptions: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 300,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: chartData?.monthly.categories || [],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: "Count",
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
  };

  const barChartSeries = [
    {
      name: "User Signups",
      data: chartData?.monthly.userSignups || [],
    },
  ];

  // Line Chart Options
  const lineChartOptions: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF", "#10B981"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 300,
      type: "area",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "smooth",
      width: [2, 2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.4,
        opacityTo: 0.1,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
    },
    xaxis: {
      categories: chartData?.monthly.categories || [],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
      },
      title: {
        text: "Count",
      },
    },
  };

  const lineChartSeries = [
    {
      name: "Total Posts",
      data: chartData?.monthly.posts || [],
    },
    {
      name: "Approved Posts",
      data: chartData?.monthly.approvedPosts || [],
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Today's Affirmation || Next Day Affirmation Card */}
      <div className="col-span-12">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {/* Today's Affirmation (or Next Day if Today not found) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {todayAffirmation ? "Today's Affirmation" : "Next Day Affirmation"}
              </h3>
              {editingAffirmation !== (todayAffirmation ? "today" : "next") && (
                <button
                  onClick={() => {
                    const targetType = todayAffirmation ? "today" : "next";
                    setEditingAffirmation(targetType);
                    setAffirmationText(todayAffirmation?.text || nextDayAffirmation?.text || "");
                  }}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  {(todayAffirmation || nextDayAffirmation) ? "Edit" : "+ Add Affirmation"}
                </button>
              )}
            </div>
            {editingAffirmation === (todayAffirmation ? "today" : "next") ? (
              <div className="space-y-3">
                <textarea
                  value={affirmationText}
                  onChange={(e) => setAffirmationText(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
                  rows={4}
                  placeholder="Enter affirmation text..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveAffirmation(todayAffirmation ? "today" : "next")}
                    disabled={savingAffirmation}
                    className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                  >
                    {savingAffirmation ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingAffirmation(null);
                      setAffirmationText(todayAffirmation?.text || nextDayAffirmation?.text || "");
                    }}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-700 dark:text-gray-300 min-h-[100px]">
                {todayAffirmation?.text || nextDayAffirmation?.text || "No affirmation scheduled"}
              </div>
            )}
          </div>

          {/* Next Day Affirmation (if Today exists) OR Add Affirmation (if neither exists) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {todayAffirmation ? "Next Day Affirmation" : "+ Add Affirmation"}
              </h3>
              {editingAffirmation !== (todayAffirmation ? "next" : "today") && (
                <button
                  onClick={() => {
                    const targetType = todayAffirmation ? "next" : "today";
                    setEditingAffirmation(targetType);
                    setAffirmationText(nextDayAffirmation?.text || "");
                  }}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  {nextDayAffirmation ? "Edit" : "+ Add Affirmation"}
                </button>
              )}
            </div>
            {editingAffirmation === (todayAffirmation ? "next" : "today") ? (
              <div className="space-y-3">
                <textarea
                  value={affirmationText}
                  onChange={(e) => setAffirmationText(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white"
                  rows={4}
                  placeholder="Enter affirmation text..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveAffirmation(todayAffirmation ? "next" : "today")}
                    disabled={savingAffirmation}
                    className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                  >
                    {savingAffirmation ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingAffirmation(null);
                      setAffirmationText(todayAffirmation && nextDayAffirmation ? nextDayAffirmation.text : "");
                    }}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-700 dark:text-gray-300 min-h-[100px]">
                {todayAffirmation && nextDayAffirmation?.text ? nextDayAffirmation.text : todayAffirmation ? "No next day affirmation scheduled" : "Click '+ Add Affirmation' to create one"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="col-span-12 grid grid-cols-1 gap-4 xl:grid-cols-2 md:gap-6">
        {/* User Signups Chart */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            User Signups (Monthly)
          </h3>
          {chartData && ReactApexChart && typeof ReactApexChart !== 'undefined' && (
            <div className="max-w-full overflow-x-auto custom-scrollbar">
              <div className="min-w-[600px]">
                <ReactApexChart
                  options={barChartOptions}
                  series={barChartSeries}
                  type="bar"
                  height={300}
                />
              </div>
            </div>
          )}
        </div>

        {/* Posts Overview Chart */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Posts Overview (Monthly)
          </h3>
          {chartData && ReactApexChart && typeof ReactApexChart !== 'undefined' && (
            <div className="max-w-full overflow-x-auto custom-scrollbar">
              <div className="min-w-[600px]">
                <ReactApexChart
                  options={lineChartOptions}
                  series={lineChartSeries}
                  type="area"
                  height={300}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Total Users || Total Posts */}
      <div className="col-span-12 grid grid-cols-1 gap-4 xl:grid-cols-2 md:grid-cols-2 xs:grid-cols-1 md:gap-6">
        {/* Total Users */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            {(() => {
              try {
                const Icon = getIconComponent(GroupIcon);
                if (!Icon) {
                  console.warn('GroupIcon is not a valid component:', GroupIcon);
                  return null;
                }
                return <Icon className="text-gray-800 size-6 dark:text-white/90" />;
              } catch (error) {
                console.error('Error rendering GroupIcon:', error);
                return null;
              }
            })()}
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total Users
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {stats?.totalUsers || 0}
              </h4>
            </div>
          </div>
        </div>

        {/* Total Posts */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
            {(() => {
              try {
                const Icon = getIconComponent(BoxIconLine);
                if (!Icon) {
                  console.warn('BoxIconLine is not a valid component:', BoxIconLine);
                  return null;
                }
                return <Icon className="text-gray-800 dark:text-white/90" />;
              } catch (error) {
                console.error('Error rendering BoxIconLine:', error);
                return null;
              }
            })()}
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Total Posts
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {stats?.totalPosts || 0}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Flagged Posts || Recent Community Posts */}
      <div className="col-span-12 grid grid-cols-1 gap-4 xl:grid-cols-2 md:gap-6">
        {/* Flagged Posts - Tapable */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Flagged Posts to review
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats?.flaggedPosts || 0} total flagged
              </p>
            </div>
            <Link
              href="/community-posts?flagged=true"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              View all
            </Link>
          </div>
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Title
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Flags
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400"
                  >
                    Action
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {flaggedPosts.length === 0 ? (
                  <TableRow>
                    <td colSpan={4} className="py-4 text-center text-gray-500">
                      No flagged posts
                    </td>
                  </TableRow>
                ) : (
                  flaggedPosts.slice(0, 10).map((post) => (
                    <TableRow key={post._id}>
                      <TableCell className="py-3 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        <div className="max-w-[200px] truncate" title={post.title}>
                          {post.title}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          {post.flagCount || 0}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {post.archived ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400">Archived</span>
                        ) : (
                          <span className="text-xs text-red-600 dark:text-red-400">Active</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <button
                          onClick={() => handleArchivePost(post._id, !post.archived)}
                          disabled={updatingPost === post._id}
                          className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 disabled:opacity-60"
                        >
                          {updatingPost === post._id
                            ? "Updating..."
                            : post.archived
                            ? "Unarchive"
                            : "Archive"}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Recent Community Posts */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Recent Community Posts
              </h3>
            </div>
            <Link
              href="/community-posts"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              See all
            </Link>
          </div>
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Title
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    User
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Date
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentPosts.length === 0 ? (
                  <TableRow>
                    <td colSpan={3} className="py-4 text-center text-gray-500">
                      No recent posts
                    </td>
                  </TableRow>
                ) : (
                  recentPosts.slice(0, 10).map((post) => (
                    <TableRow key={post._id}>
                      <TableCell className="py-3 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {post.title}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {post.user?.name || "Unknown"}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Recent Signups */}
      <div className="col-span-12 xl:col-span-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
          <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Recent Signups
              </h3>
            </div>
            <Link
              href="/users"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            >
              See all
            </Link>
          </div>
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Email
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Joined
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentUsers.length === 0 ? (
                  <TableRow>
                    <td colSpan={3} className="py-4 text-center text-gray-500">
                      No recent signups
                    </td>
                  </TableRow>
                ) : (
                  recentUsers.slice(0, 10).map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="py-3 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {user.name}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {user.email}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  () => import("react-apexcharts"),
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

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);

  useEffect(() => {
    fetchDashboardData();
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

      // Fetch recent users
      const usersRes = await fetch("/api/admin/users?limit=10");
      const usersData = await usersRes.json();
      if (usersData.success) {
        setRecentUsers(usersData.users);
      }

      // Fetch recent posts
      const postsRes = await fetch("/api/admin/posts?limit=10");
      const postsData = await postsRes.json();
      if (postsData.success) {
        setRecentPosts(postsData.posts || []);
      }
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
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
      {/* Stats Cards */}
      <div className="col-span-12 space-y-6 xl:col-span-12">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4 md:grid-cols-2 xs:grid-cols-1 md:gap-6">
          {/* Active Users */}
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
                  Active Users
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {stats?.activeUsers || 0}
                </h4>
              </div>
            </div>
          </div>

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

          {/* Recent Signups */}
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
                  Recent Signups (7d)
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {stats?.recentSignups || 0}
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

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4 md:grid-cols-2 xs:grid-cols-1 md:gap-6">
          {/* Recent Posts */}
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
                  Recent Posts (7d)
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {stats?.recentPosts || 0}
                </h4>
              </div>
            </div>
          </div>

          {/* Pending Posts */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-xl dark:bg-yellow-900/30">
              {(() => {
                const Icon = getIconComponent(BoxIconLine);
                return Icon ? <Icon className="text-yellow-600 dark:text-yellow-400" /> : null;
              })()}
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Pending Posts
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {stats?.pendingPosts || 0}
                </h4>
              </div>
            </div>
          </div>

          {/* Flagged Posts */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl dark:bg-red-900/30">
              {(() => {
                const Icon = getIconComponent(BoxIconLine);
                return Icon ? <Icon className="text-red-600 dark:text-red-400" /> : null;
              })()}
            </div>
            <div className="flex items-end justify-between mt-5">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Flagged Posts
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {stats?.flaggedPosts || 0}
                </h4>
              </div>
            </div>
          </div>

          {/* Upcoming Content */}
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
                  Upcoming Content
                </span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {stats?.upcomingContent || 0}
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="col-span-12 xl:col-span-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Monthly User Signups
          </h3>
          {chartData && (
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
      </div>

      <div className="col-span-12 xl:col-span-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Posts Overview (Monthly)
          </h3>
          {chartData && ReactApexChart && (
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

      {/* Recent Signups Table */}
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
                  recentUsers.map((user) => (
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

      {/* Recent Posts Table */}
      <div className="col-span-12 xl:col-span-6">
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
                  recentPosts.map((post) => (
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
    </div>
  );
}

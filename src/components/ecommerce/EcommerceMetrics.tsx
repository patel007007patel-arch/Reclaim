"use client";
import React from "react";
import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon, BoxIconLine, GroupIcon } from "@/icons";
import { getIconComponent } from "@/utils/iconUtils";

export const EcommerceMetrics = () => {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 md:grid-cols-2 xs:grid-cols-1 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          {(() => {
            const Icon = getIconComponent(GroupIcon);
            return Icon ? <Icon className="text-gray-800 size-6 dark:text-white/90" /> : null;
          })()}
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total users
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              3,782
            </h4>
          </div>
          <Badge color="success">
            {(() => {
              const Icon = getIconComponent(ArrowUpIcon);
              return Icon ? <Icon /> : null;
            })()}
            11.01%
          </Badge>
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          {(() => {
            const Icon = getIconComponent(GroupIcon);
            return Icon ? <Icon className="text-gray-800 size-6 dark:text-white/90" /> : null;
          })()}
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Active users
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              3,782
            </h4>
          </div>
          <Badge color="success">
            {(() => {
              const Icon = getIconComponent(ArrowUpIcon);
              return Icon ? <Icon /> : null;
            })()}
            11.01%
          </Badge>
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          {(() => {
            const Icon = getIconComponent(GroupIcon);
            return Icon ? <Icon className="text-gray-800 size-6 dark:text-white/90" /> : null;
          })()}
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Recent signups
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              3,782
            </h4>
          </div>
          <Badge color="success">
            {(() => {
              const Icon = getIconComponent(ArrowUpIcon);
              return Icon ? <Icon /> : null;
            })()}
            11.01%
          </Badge>
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          {(() => {
            const Icon = getIconComponent(GroupIcon);
            return Icon ? <Icon className="text-gray-800 size-6 dark:text-white/90" /> : null;
          })()}
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Recent community posts
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              3,782
            </h4>
          </div>
          <Badge color="success">
            {(() => {
              const Icon = getIconComponent(ArrowUpIcon);
              return Icon ? <Icon /> : null;
            })()}
            11.01%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          {(() => {
            const Icon = getIconComponent(BoxIconLine);
            return Icon ? <Icon className="text-gray-800 dark:text-white/90" /> : null;
          })()}
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Upcoming scheduled content
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              5,359
            </h4>
          </div>

          <Badge color="error">
            {(() => {
              const Icon = getIconComponent(ArrowDownIcon);
              return Icon ? <Icon className="text-error-500" /> : null;
            })()}
            9.05%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
};

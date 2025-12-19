"use client";

import React from "react";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Switch = require("react-switch").default as React.ComponentType<any>;

interface StatusToggleProps {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  onChange: (active: boolean) => void;
  disabled?: boolean;
}

export default function StatusToggle({
  active,
  activeLabel,
  inactiveLabel,
  onChange,
  disabled = false,
}: StatusToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`text-sm font-semibold transition-colors ${
          active
            ? "text-gray-900 dark:text-white"
            : "text-gray-400 dark:text-gray-500"
        }`}
      >
        {activeLabel}
      </span>
      <Switch
        checked={active}
        onChange={onChange}
        disabled={disabled}
        onColor="#10b981"
        offColor="#d1d5db"
        checkedIcon={false}
        uncheckedIcon={false}
        height={28}
        width={56}
        handleDiameter={24}
        className="react-switch"
      />
      <span
        className={`text-sm font-semibold transition-colors ${
          !active
            ? "text-gray-900 dark:text-white"
            : "text-gray-400 dark:text-gray-500"
        }`}
      >
        {inactiveLabel}
      </span>
    </div>
  );
}


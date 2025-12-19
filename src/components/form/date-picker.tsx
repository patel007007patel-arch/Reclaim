'use client';

import { useEffect, useRef } from 'react';
import Label from './Label';
import { CalenderIcon } from '../../icons';
import { getIconComponent } from '../../utils/iconUtils';
import 'flatpickr/dist/flatpickr.css';

// Type definitions for flatpickr
type Hook = (selectedDates: Date[], dateStr: string, instance: any) => void;
type DateOption = string | Date | number | (string | Date | number)[];

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  defaultDate?: DateOption;
  label?: string;
  placeholder?: string;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  placeholder,
}: PropsType) {
  const flatpickrInstance = useRef<any>(null);

  useEffect(() => {
    // Dynamically import flatpickr only on client side
    const initFlatpickr = async () => {
      if (typeof window === 'undefined') return;

      const flatpickr = (await import('flatpickr')).default;

      // Destroy existing instance if any
      if (flatpickrInstance.current) {
        if (!Array.isArray(flatpickrInstance.current)) {
          flatpickrInstance.current.destroy();
        }
        flatpickrInstance.current = null;
      }

      // Initialize flatpickr
      flatpickrInstance.current = flatpickr(`#${id}`, {
        mode: mode || "single",
        static: true,
        monthSelectorType: "static",
        dateFormat: "Y-m-d",
        defaultDate,
        onChange,
      });
    };

    initFlatpickr();

    return () => {
      if (flatpickrInstance.current) {
        if (!Array.isArray(flatpickrInstance.current)) {
          flatpickrInstance.current.destroy();
        }
        flatpickrInstance.current = null;
      }
    };
  }, [mode, onChange, id, defaultDate]);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700  dark:focus:border-brand-800"
        />

        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          {(() => {
            const Icon = getIconComponent(CalenderIcon);
            return Icon ? <Icon className="size-6" /> : null;
          })()}
        </span>
      </div>
    </div>
  );
}

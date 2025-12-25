'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Dynamically import flatpickr only on client side
    const initFlatpickr = async () => {
      if (typeof window === 'undefined' || !mounted) return;

      try {
        const flatpickr = (await import('flatpickr')).default;

        // Check if element exists
        const element = document.getElementById(id);
        if (!element) {
          console.warn(`DatePicker: Element with id "${id}" not found`);
          return;
        }

        // Destroy existing instance if any
        if (flatpickrInstance.current) {
          try {
            if (!Array.isArray(flatpickrInstance.current) && typeof flatpickrInstance.current.destroy === 'function') {
              flatpickrInstance.current.destroy();
            }
          } catch (e) {
            console.warn('Error destroying flatpickr instance:', e);
          }
          flatpickrInstance.current = null;
        }

        // Initialize flatpickr with year and month navigation
        flatpickrInstance.current = flatpickr(`#${id}`, {
          mode: mode || "single",
          static: true,
          monthSelectorType: "static",
          dateFormat: "Y-m-d",
          defaultDate,
          onChange: onChange || undefined,
          // Enable year and month dropdowns for quick navigation
          enableTime: false,
          clickOpens: true,
          // Allow quick year selection by clicking on year
          onReady: function(selectedDates, dateStr, instance) {
            try {
              // Make year clickable to show year picker
              const yearInput = instance.calendarContainer?.querySelector('.flatpickr-current-month .flatpickr-monthDropdown-months');
              if (yearInput) {
                yearInput.addEventListener('click', function() {
                  instance.changeMonth(0);
                });
              }
            } catch (e) {
              console.warn('Error in flatpickr onReady:', e);
            }
          },
        });
      } catch (error) {
        console.error('Error initializing flatpickr:', error);
      }
    };

    if (mounted) {
      initFlatpickr();
    }

    return () => {
      if (flatpickrInstance.current) {
        try {
          if (!Array.isArray(flatpickrInstance.current) && typeof flatpickrInstance.current.destroy === 'function') {
            flatpickrInstance.current.destroy();
          }
        } catch (e) {
          console.warn('Error destroying flatpickr instance in cleanup:', e);
        }
        flatpickrInstance.current = null;
      }
    };
  }, [mode, onChange, id, defaultDate, mounted]);

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

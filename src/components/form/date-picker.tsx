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

        // Initialize flatpickr with custom month/year picker
      flatpickrInstance.current = flatpickr(`#${id}`, {
        mode: mode || "single",
        static: true,
        monthSelectorType: "static",
        dateFormat: "Y-m-d",
        defaultDate,
          onChange: onChange || undefined,
          enableTime: false,
          clickOpens: true,
          onReady: function(selectedDates, dateStr, instance) {
            try {
              // Create custom month/year picker overlay
              const calendarContainer = instance.calendarContainer;
              if (!calendarContainer) return;

              // Check if dark mode is active
              const isDarkMode = document.documentElement.classList.contains('dark');
              
              // Add custom styles for scrollable lists with theme support
              const style = document.createElement('style');
              style.id = `flatpickr-custom-styles-${id}`;
              if (document.getElementById(style.id)) {
                document.getElementById(style.id)?.remove();
              }
              
              const darkBg = '#1d2939';
              const darkBgDarker = '#101828';
              const darkBorder = '#344054';
              const darkText = '#d0d5dd';
              const darkHover = '#1d2939';
              const brandBlue = '#465fff';
              const brandBlueDark = '#3641f5';
              
              const lightBg = '#ffffff';
              const lightBgSecondary = '#f9fafb';
              const lightBorder = '#e4e7ec';
              const lightText = '#344054';
              const lightHover = '#f2f4f7';
              const lightSelected = '#ecf3ff';
              
              style.textContent = `
                .flatpickr-month-year-picker {
                  position: fixed;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: ${isDarkMode ? 'rgba(16, 24, 40, 0.85)' : 'rgba(0, 0, 0, 0.6)'};
                  display: none;
                  z-index: 9999999 !important;
                  align-items: center;
                  justify-content: center;
                  backdrop-filter: blur(8px) saturate(180%);
                  -webkit-backdrop-filter: blur(8px) saturate(180%);
                }
                .flatpickr-month-year-picker.active {
                  display: flex;
                }
                .flatpickr-picker-container {
                  background: ${isDarkMode ? darkBg : lightBg};
                  border-radius: 16px;
                  padding: 0;
                  max-width: 90%;
                  width: 420px;
                  max-height: 85vh;
                  display: flex;
                  flex-direction: column;
                  border: 1px solid ${isDarkMode ? darkBorder : lightBorder};
                  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                  overflow: hidden;
                }
                .flatpickr-picker-header {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 8px;
                  background: ${brandBlue};
                  color: #ffffff;
                  font-weight: 600;
                  font-size: 16px;
                  padding: 16px 20px;
                  margin: 0;
                  border: none;
                }
                .flatpickr-picker-header svg {
                  width: 12px;
                  height: 12px;
                }
                .flatpickr-picker-lists {
                  display: flex;
                  gap: 0;
                  margin: 0;
                  padding: 16px;
                  flex: 1;
                  min-height: 0;
                  background: ${isDarkMode ? darkBgDarker : lightBgSecondary};
                }
                .flatpickr-list-container {
                  flex: 1;
                  max-height: 320px;
                  overflow-y: auto;
                  overflow-x: hidden;
                  border-radius: 8px;
                  background: ${isDarkMode ? darkBgDarker : lightBg};
                  scrollbar-width: thin;
                  scrollbar-color: ${isDarkMode ? darkBorder : lightBorder} ${isDarkMode ? darkBgDarker : lightBg};
                  border: 1px solid ${isDarkMode ? darkBorder : lightBorder};
                }
                .flatpickr-list-container:first-child {
                  margin-right: 8px;
                }
                .flatpickr-list-container:last-child {
                  margin-left: 8px;
                }
                .flatpickr-list-container::-webkit-scrollbar {
                  width: 6px;
                }
                .flatpickr-list-container::-webkit-scrollbar-track {
                  background: ${isDarkMode ? darkBgDarker : lightBg};
                  border-radius: 8px;
                }
                .flatpickr-list-container::-webkit-scrollbar-thumb {
                  background: ${isDarkMode ? darkBorder : lightBorder};
                  border-radius: 8px;
                }
                .flatpickr-list-container::-webkit-scrollbar-thumb:hover {
                  background: ${isDarkMode ? '#475467' : '#d0d5dd'};
                }
                .flatpickr-list-item {
                  padding: 14px 16px;
                  color: ${isDarkMode ? darkText : lightText};
                  cursor: pointer;
                  text-align: center;
                  transition: all 0.15s ease;
                  font-size: 14px;
                  user-select: none;
                  border-radius: 6px;
                  margin: 2px 4px;
                }
                .flatpickr-list-item:hover {
                  background: ${isDarkMode ? darkHover : lightHover};
                }
                .flatpickr-list-item.selected {
                  background: ${brandBlue};
                  color: #ffffff;
                  font-weight: 600;
                  margin: 2px 0;
                }
                .flatpickr-picker-actions {
                  display: flex;
                  gap: 12px;
                  justify-content: space-between;
                  align-items: center;
                  padding: 16px 20px;
                  background: ${isDarkMode ? darkBg : lightBg};
                  border-top: 1px solid ${isDarkMode ? darkBorder : lightBorder};
                }
                .flatpickr-btn {
                  border: none;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 500;
                  transition: all 0.2s;
                }
                .flatpickr-btn-reset {
                  background: ${isDarkMode ? darkBg : lightBgSecondary};
                  color: ${isDarkMode ? '#ffffff' : lightText};
                  padding: 10px 20px;
                  border-radius: 8px;
                  border: 1px solid ${isDarkMode ? darkBorder : lightBorder};
                }
                .flatpickr-btn-reset:hover {
                  background: ${isDarkMode ? darkHover : lightHover};
                }
                .flatpickr-btn-confirm {
                  background: ${brandBlue};
                  color: #ffffff;
                  border-radius: 50%;
                  width: 44px;
                  height: 44px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 0;
                  flex-shrink: 0;
                  box-shadow: 0 4px 6px -1px rgba(70, 95, 255, 0.3);
                }
                .flatpickr-btn-confirm:hover {
                  background: ${brandBlueDark};
                  box-shadow: 0 6px 8px -1px rgba(70, 95, 255, 0.4);
                  transform: scale(1.05);
                }
                .flatpickr-btn-confirm svg {
                  width: 20px;
                  height: 20px;
                }
                .flatpickr-month-year-trigger {
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  gap: 4px;
                }
              `;
              if (!document.getElementById(style.id)) {
                document.head.appendChild(style);
              }

              // Listen for theme changes and update styles
              const updateStylesForTheme = () => {
                const isDark = document.documentElement.classList.contains('dark');
                const styleElement = document.getElementById(style.id);
                if (styleElement) {
                  const darkBg = '#1d2939';
                  const darkBgDarker = '#101828';
                  const darkBorder = '#344054';
                  const darkText = '#d0d5dd';
                  const darkHover = '#1d2939';
                  const brandBlue = '#465fff';
                  const brandBlueDark = '#3641f5';
                  
                  const lightBg = '#ffffff';
                  const lightBgSecondary = '#f9fafb';
                  const lightBorder = '#e4e7ec';
                  const lightText = '#344054';
                  const lightHover = '#f2f4f7';
                  
                  styleElement.textContent = `
                  .flatpickr-month-year-picker {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: ${isDark ? 'rgba(16, 24, 40, 0.85)' : 'rgba(0, 0, 0, 0.6)'};
                    display: none;
                    z-index: 9999999 !important;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(8px) saturate(180%);
                    -webkit-backdrop-filter: blur(8px) saturate(180%);
                  }
                    .flatpickr-month-year-picker.active {
                      display: flex;
                    }
                    .flatpickr-picker-container {
                      background: ${isDark ? darkBg : lightBg};
                      border-radius: 16px;
                      padding: 0;
                      max-width: 90%;
                      width: 420px;
                      max-height: 85vh;
                      display: flex;
                      flex-direction: column;
                      border: 1px solid ${isDark ? darkBorder : lightBorder};
                      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                      overflow: hidden;
                    }
                    .flatpickr-picker-header {
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      gap: 8px;
                      background: ${brandBlue};
                      color: #ffffff;
                      font-weight: 600;
                      font-size: 16px;
                      padding: 16px 20px;
                      margin: 0;
                      border: none;
                    }
                    .flatpickr-picker-header svg {
                      width: 12px;
                      height: 12px;
                    }
                    .flatpickr-picker-lists {
                      display: flex;
                      gap: 0;
                      margin: 0;
                      padding: 16px;
                      flex: 1;
                      min-height: 0;
                      background: ${isDark ? darkBgDarker : lightBgSecondary};
                    }
                    .flatpickr-list-container {
                      flex: 1;
                      max-height: 320px;
                      overflow-y: auto;
                      overflow-x: hidden;
                      border-radius: 8px;
                      background: ${isDark ? darkBgDarker : lightBg};
                      scrollbar-width: thin;
                      scrollbar-color: ${isDark ? darkBorder : lightBorder} ${isDark ? darkBgDarker : lightBg};
                      border: 1px solid ${isDark ? darkBorder : lightBorder};
                    }
                    .flatpickr-list-container:first-child {
                      margin-right: 8px;
                    }
                    .flatpickr-list-container:last-child {
                      margin-left: 8px;
                    }
                    .flatpickr-list-container::-webkit-scrollbar {
                      width: 6px;
                    }
                    .flatpickr-list-container::-webkit-scrollbar-track {
                      background: ${isDark ? darkBgDarker : lightBg};
                      border-radius: 8px;
                    }
                    .flatpickr-list-container::-webkit-scrollbar-thumb {
                      background: ${isDark ? darkBorder : lightBorder};
                      border-radius: 8px;
                    }
                    .flatpickr-list-container::-webkit-scrollbar-thumb:hover {
                      background: ${isDark ? '#475467' : '#d0d5dd'};
                    }
                    .flatpickr-list-item {
                      padding: 14px 16px;
                      color: ${isDark ? darkText : lightText};
                      cursor: pointer;
                      text-align: center;
                      transition: all 0.15s ease;
                      font-size: 14px;
                      user-select: none;
                      border-radius: 6px;
                      margin: 2px 4px;
                    }
                    .flatpickr-list-item:hover {
                      background: ${isDark ? darkHover : lightHover};
                    }
                    .flatpickr-list-item.selected {
                      background: ${brandBlue};
                      color: #ffffff;
                      font-weight: 600;
                      margin: 2px 0;
                    }
                    .flatpickr-picker-actions {
                      display: flex;
                      gap: 12px;
                      justify-content: space-between;
                      align-items: center;
                      padding: 16px 20px;
                      background: ${isDark ? darkBg : lightBg};
                      border-top: 1px solid ${isDark ? darkBorder : lightBorder};
                    }
                    .flatpickr-btn {
                      border: none;
                      cursor: pointer;
                      font-size: 14px;
                      font-weight: 500;
                      transition: all 0.2s;
                    }
                    .flatpickr-btn-reset {
                      background: ${isDark ? darkBg : lightBgSecondary};
                      color: ${isDark ? '#ffffff' : lightText};
                      padding: 10px 20px;
                      border-radius: 8px;
                      border: 1px solid ${isDark ? darkBorder : lightBorder};
                    }
                    .flatpickr-btn-reset:hover {
                      background: ${isDark ? darkHover : lightHover};
                    }
                    .flatpickr-btn-confirm {
                      background: ${brandBlue};
                      color: #ffffff;
                      border-radius: 50%;
                      width: 44px;
                      height: 44px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      padding: 0;
                      flex-shrink: 0;
                      box-shadow: 0 4px 6px -1px rgba(70, 95, 255, 0.3);
                    }
                    .flatpickr-btn-confirm:hover {
                      background: ${brandBlueDark};
                      box-shadow: 0 6px 8px -1px rgba(70, 95, 255, 0.4);
                      transform: scale(1.05);
                    }
                    .flatpickr-btn-confirm svg {
                      width: 20px;
                      height: 20px;
                    }
                    .flatpickr-month-year-trigger {
                      cursor: pointer;
                      display: flex;
                      align-items: center;
                      gap: 4px;
                    }
                  `;
                }
              };

              // Watch for theme changes
              const themeObserver = new MutationObserver(() => {
                updateStylesForTheme();
              });
              themeObserver.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class']
              });

              // Create month/year picker overlay - append to body to ensure it covers everything
              let pickerOverlay = document.querySelector(`.flatpickr-month-year-picker[data-picker-id="${id}"]`) as HTMLElement;
              if (!pickerOverlay) {
                pickerOverlay = document.createElement('div');
                pickerOverlay.className = 'flatpickr-month-year-picker';
                pickerOverlay.setAttribute('data-picker-id', id);
                pickerOverlay.innerHTML = `
                  <div class="flatpickr-picker-container">
                    <div class="flatpickr-picker-header">
                      <span class="flatpickr-selected-month-year"></span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 9L2 5H10L6 9Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <div class="flatpickr-picker-lists">
                      <div class="flatpickr-list-container" id="${id}-month-list"></div>
                      <div class="flatpickr-list-container" id="${id}-year-list"></div>
                    </div>
                    <div class="flatpickr-picker-actions">
                      <button class="flatpickr-btn flatpickr-btn-reset" type="button">Reset</button>
                      <button class="flatpickr-btn flatpickr-btn-confirm" type="button" aria-label="Confirm selection">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16.7071 5.29289C17.0976 5.68342 17.0976 6.31658 16.7071 6.70711L8.70711 14.7071C8.31658 15.0976 7.68342 15.0976 7.29289 14.7071L3.29289 10.7071C2.90237 10.3166 2.90237 9.68342 3.29289 9.29289C3.68342 8.90237 4.31658 8.90237 4.70711 9.29289L8 12.5858L15.2929 5.29289C15.6834 4.90237 16.3166 4.90237 16.7071 5.29289Z" fill="currentColor"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                `;
                document.body.appendChild(pickerOverlay);
              }

              const monthList = pickerOverlay.querySelector(`#${id}-month-list`) as HTMLElement;
              const yearList = pickerOverlay.querySelector(`#${id}-year-list`) as HTMLElement;
              const selectedMonthYear = pickerOverlay.querySelector('.flatpickr-selected-month-year') as HTMLElement;
              const resetBtn = pickerOverlay.querySelector('.flatpickr-btn-reset') as HTMLElement;
              const confirmBtn = pickerOverlay.querySelector('.flatpickr-btn-confirm') as HTMLElement;

              let selectedMonth = instance.currentMonth;
              let selectedYear = instance.currentYear;

              // Generate months list
              const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
              const renderLists = () => {
                if (!monthList || !yearList || !selectedMonthYear) return;

                // Render months
                monthList.innerHTML = '';
                months.forEach((month, index) => {
                  const item = document.createElement('div');
                  item.className = `flatpickr-list-item ${index === selectedMonth ? 'selected' : ''}`;
                  item.textContent = month;
                  item.onclick = () => {
                    selectedMonth = index;
                    renderLists();
                    updateHeader();
                    // Update calendar immediately when month is selected
                    updateCalendar();
                  };
                  monthList.appendChild(item);
                });

                // Render years (current year ± 50 years)
                yearList.innerHTML = '';
                const currentYear = new Date().getFullYear();
                for (let year = currentYear - 50; year <= currentYear + 50; year++) {
                  const item = document.createElement('div');
                  item.className = `flatpickr-list-item ${year === selectedYear ? 'selected' : ''}`;
                  item.textContent = year.toString();
                  item.onclick = () => {
                    selectedYear = year;
                    renderLists();
                    updateHeader();
                    // Update calendar immediately when year is selected
                    updateCalendar();
                  };
                  yearList.appendChild(item);
                }

                // Scroll to selected items
                const selectedMonthItem = monthList.querySelector('.selected') as HTMLElement;
                const selectedYearItem = yearList.querySelector('.selected') as HTMLElement;
                if (selectedMonthItem) {
                  selectedMonthItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
                if (selectedYearItem) {
                  selectedYearItem.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }

                updateHeader();
              };

              const updateHeader = () => {
                if (selectedMonthYear) {
                  selectedMonthYear.textContent = `${months[selectedMonth]} ${selectedYear}`;
                }
              };

              // Function to update the calendar
              const updateCalendar = () => {
                // Create target date
                const targetDate = new Date(selectedYear, selectedMonth, 1);
                
                // Try to use jumpToDate if available (flatpickr method)
                if (instance.jumpToDate && typeof instance.jumpToDate === 'function') {
                  instance.jumpToDate(targetDate);
                } else {
                  // Calculate months difference from current position
                  const currentTotalMonths = instance.currentYear * 12 + instance.currentMonth;
                  const targetTotalMonths = selectedYear * 12 + selectedMonth;
                  const monthsDiff = targetTotalMonths - currentTotalMonths;
                  
                  // Update the calendar using changeMonth
                  if (monthsDiff !== 0) {
                    instance.changeMonth(monthsDiff);
                  }
                }
                
                // Force update the calendar display after a short delay
                setTimeout(() => {
                  // Update the month/year display in the calendar header
                  if (instance.calendarContainer) {
                    const monthNav = instance.calendarContainer.querySelector('.flatpickr-current-month');
                    if (monthNav) {
                      const monthText = months[selectedMonth];
                      const yearText = selectedYear.toString();
                      
                      // Try to update the display elements
                      const monthSelect = monthNav.querySelector('.flatpickr-monthDropdown-months');
                      const yearInput = monthNav.querySelector('.numInputWrapper input') as HTMLInputElement;
                      
                      if (monthSelect) {
                        monthSelect.textContent = monthText;
                      }
                      if (yearInput) {
                        yearInput.value = yearText;
                        // Trigger input event to update flatpickr
                        yearInput.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                    }
                    
                    // Try to redraw if method exists
                    if (instance.redraw && typeof instance.redraw === 'function') {
                      instance.redraw();
                    }
                  }
                }, 50);
              };

              // Reset button
              resetBtn.onclick = () => {
                const today = new Date();
                selectedMonth = today.getMonth();
                selectedYear = today.getFullYear();
                renderLists();
                updateCalendar();
              };

              // Confirm button - update calendar and keep it open
              confirmBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Update the calendar first
                updateCalendar();
                
                // Wait a bit for the calendar to update, then close only the month/year picker overlay
                setTimeout(() => {
                  pickerOverlay.classList.remove('active');
                  // Ensure the main calendar stays open
                  if (instance.calendarContainer && !instance.calendarContainer.classList.contains('open')) {
                    instance.open();
                  }
                }, 100);
              };

              // Make month/year header clickable to show picker
              const monthYearElement = calendarContainer.querySelector('.flatpickr-current-month');
              if (monthYearElement) {
                monthYearElement.classList.add('flatpickr-month-year-trigger');
                monthYearElement.addEventListener('click', (e) => {
                  e.stopPropagation();
                  // Sync with current calendar state
                  selectedMonth = instance.currentMonth;
                  selectedYear = instance.currentYear;
                  renderLists();
                  pickerOverlay.classList.add('active');
                });
              }

              // Also make the year clickable if it exists separately
              const yearElement = calendarContainer.querySelector('.flatpickr-current-month .numInputWrapper');
              if (yearElement) {
                yearElement.addEventListener('click', (e) => {
                  e.stopPropagation();
                  selectedMonth = instance.currentMonth;
                  selectedYear = instance.currentYear;
                  renderLists();
                  pickerOverlay.classList.add('active');
                });
              }

              // Listen for calendar month changes to keep picker in sync
              const originalChangeMonth = instance.changeMonth;
              instance.changeMonth = function(offset: number) {
                const result = originalChangeMonth.call(this, offset);
                // Update selected values if picker is not open
                if (!pickerOverlay.classList.contains('active')) {
                  selectedMonth = this.currentMonth;
                  selectedYear = this.currentYear;
                }
                return result;
              };

              // Close picker when clicking outside
              pickerOverlay.addEventListener('click', (e) => {
                if (e.target === pickerOverlay) {
                  pickerOverlay.classList.remove('active');
                }
              });
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
      
      // Clean up overlay from body
      const overlay = document.querySelector(`.flatpickr-month-year-picker[data-picker-id="${id}"]`);
      if (overlay) {
        overlay.remove();
      }
      
      // Clean up styles
      const styleElement = document.getElementById(`flatpickr-custom-styles-${id}`);
      if (styleElement) {
        styleElement.remove();
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

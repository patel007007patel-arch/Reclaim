"use client";

import React, { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type = "success",
  isVisible,
  onClose,
  duration = 3000,
}: ToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (isVisible && duration > 0) {
      setProgress(100);
      
      // Animate progress bar
      const interval = setInterval(() => {
        setProgress((prev) => {
          const decrement = (100 / (duration / 50)); // Update every 50ms
          const newProgress = prev - decrement;
          return newProgress <= 0 ? 0 : newProgress;
        });
      }, 50);

      // Auto close after duration
      const timer = setTimeout(() => {
        clearInterval(interval);
        onClose();
      }, duration);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    } else {
      setProgress(100);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible || !message) return null;

  const bgColor =
    type === "success"
      ? "bg-emerald-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500";

  const iconColor =
    type === "success"
      ? "text-emerald-100"
      : type === "error"
      ? "text-red-100"
      : "text-blue-100";

  return (
    <div 
      className="fixed top-4 right-4 z-[99999] pointer-events-auto"
      style={{ 
        animation: "slideInRight 0.3s ease-out"
      }}
    >
      <div
        className={`${bgColor} text-white rounded-lg shadow-2xl overflow-hidden min-w-[300px] max-w-md backdrop-blur-sm`}
      >
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 ${iconColor}`}>
            {type === "success" && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {type === "error" && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {type === "info" && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          
          <div className="flex-1 text-sm font-medium">{message}</div>
          
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors flex-shrink-0 opacity-80 hover:opacity-100"
            aria-label="Close"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-black/20 relative overflow-hidden">
          <div
            className="h-full bg-white/30 transition-all ease-linear"
            style={{
              width: `${progress}%`,
              transition: "width 50ms linear"
            }}
          />
        </div>
      </div>
    </div>
  );
}


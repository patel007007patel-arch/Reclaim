"use client";
import React from "react";
import { Modal } from "../modal";
import Button from "../button/Button";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const buttonColors = {
    danger: "bg-error-500 hover:bg-error-600 text-white",
    warning: "bg-warning-500 hover:bg-warning-600 text-white",
    info: "bg-blue-light-500 hover:bg-blue-light-600 text-white",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[500px] p-6 lg:p-8"
      showCloseButton={true}
    >
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          {variant === "danger" && (
            <div className="flex items-center justify-center w-16 h-16 bg-error-100 rounded-full dark:bg-error-500/20">
              <svg
                className="w-8 h-8 text-error-600 dark:text-error-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          )}
          {variant === "warning" && (
            <div className="flex items-center justify-center w-16 h-16 bg-warning-100 rounded-full dark:bg-warning-500/20">
              <svg
                className="w-8 h-8 text-warning-600 dark:text-warning-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          )}
          {variant === "info" && (
            <div className="flex items-center justify-center w-16 h-16 bg-blue-light-100 rounded-full dark:bg-blue-light-500/20">
              <svg
                className="w-8 h-8 text-blue-light-600 dark:text-blue-light-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}
        </div>

        <h4 className="mb-3 text-xl font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h4>
        <p className="mb-6 text-sm leading-6 text-gray-500 dark:text-gray-400">
          {message}
        </p>

        <div className="flex items-center justify-center w-full gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {cancelText}
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`min-w-[100px] ${buttonColors[variant]}`}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;


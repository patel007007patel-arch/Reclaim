"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { getIconComponent } from "@/utils/iconUtils";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Alert from "../ui/alert/Alert";

type Step = "email" | "otp" | "password";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "admin"; // admin or user
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const endpoint =
        type === "admin"
          ? "/api/admin/forgot-password"
          : "/api/users/forgot-password";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("OTP has been sent to your email");
        setStep("otp");
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (error: any) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const endpoint =
        type === "admin" ? "/api/admin/verify-otp" : "/api/users/verify-otp";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("OTP verified successfully");
        setStep("password");
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (error: any) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const endpoint =
        type === "admin"
          ? "/api/admin/reset-password"
          : "/api/users/reset-password";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess("Password reset successfully! Redirecting to sign in...");
        setTimeout(() => {
          router.push(type === "admin" ? "/signin" : "/signin");
        }, 2000);
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (error: any) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Reset Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {step === "email" && "Enter your email to receive an OTP"}
              {step === "otp" && "Enter the OTP sent to your email"}
              {step === "password" && "Enter your new password"}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === "email"
                    ? "bg-brand-500 text-white"
                    : "bg-brand-100 text-brand-500 dark:bg-brand-900 dark:text-brand-400"
                }`}
              >
                1
              </div>
              <div
                className={`w-16 h-1 mx-2 ${
                  step !== "email"
                    ? "bg-brand-500"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === "otp"
                    ? "bg-brand-500 text-white"
                    : step === "password"
                    ? "bg-brand-100 text-brand-500 dark:bg-brand-900 dark:text-brand-400"
                    : "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                }`}
              >
                2
              </div>
              <div
                className={`w-16 h-1 mx-2 ${
                  step === "password"
                    ? "bg-brand-500"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === "password"
                    ? "bg-brand-500 text-white"
                    : "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                }`}
              >
                3
              </div>
            </div>
          </div>

          <div>
            {/* Step 1: Email */}
            {step === "email" && (
              <form onSubmit={handleSendOTP}>
                <div className="space-y-6">
                  <div>
                    <Label>
                      Email <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                    />
                  </div>
                  <div>
                    <Button
                      type="submit"
                      className="w-full"
                      size="sm"
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Send OTP"}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* Step 2: OTP */}
            {step === "otp" && (
              <form onSubmit={handleVerifyOTP}>
                <div className="space-y-6">
                  <div>
                    <Label>
                      OTP <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                        setError("");
                      }}
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      OTP sent to {email}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      onClick={() => {
                        setStep("email");
                        setOtp("");
                        setError("");
                        setSuccess("");
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      size="sm"
                      disabled={loading || otp.length !== 6}
                    >
                      {loading ? "Verifying..." : "Verify OTP"}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* Step 3: New Password */}
            {step === "password" && (
              <form onSubmit={handleResetPassword}>
                <div className="space-y-6">
                  <div>
                    <Label>
                      New Password <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setError("");
                        }}
                      />
                      <span
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {(() => {
                          const Icon = getIconComponent(
                            showNewPassword ? EyeIcon : EyeCloseIcon
                          );
                          return Icon ? (
                            <Icon className="fill-gray-500 dark:fill-gray-400" />
                          ) : null;
                        })()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label>
                      Confirm Password <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError("");
                        }}
                      />
                      <span
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {(() => {
                          const Icon = getIconComponent(
                            showConfirmPassword ? EyeIcon : EyeCloseIcon
                          );
                          return Icon ? (
                            <Icon className="fill-gray-500 dark:fill-gray-400" />
                          ) : null;
                        })()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      onClick={() => {
                        setStep("otp");
                        setNewPassword("");
                        setConfirmPassword("");
                        setError("");
                        setSuccess("");
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      size="sm"
                      disabled={loading}
                    >
                      {loading ? "Resetting..." : "Reset Password"}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* Error/Success Messages */}
            {error && (
              <div className="mt-4">
                <Alert variant="error" title="Error" message={error} />
              </div>
            )}
            {success && (
              <div className="mt-4">
                <Alert variant="success" title="Success" message={success} />
              </div>
            )}

            {/* Back to Sign In */}
            <div className="mt-6 text-center">
              <Link
                href="/signin"
                className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


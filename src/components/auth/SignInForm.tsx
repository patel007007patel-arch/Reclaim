"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { getIconComponent } from "@/utils/iconUtils";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "../ui/alert/Alert";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [inputEmail, setInputEmail] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  
  const router = useRouter();

  const email = "admin@gmail.com";
  const password = "admin123";

const handleSignIn = async (e: any) => {
  e.preventDefault();

  if (!inputEmail || !inputPassword) {
    setInvalid(true);
    setAlertMessage("Email and Password are required");
    return;
  }

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inputEmail,
        password: inputPassword,
        keepLoggedIn: isChecked
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setInvalid(true);
      setAlertMessage(data.error || "Invalid credentials");
      return;
    }

    // 🎉 SUCCESS → Backend already set HttpOnly cookie
    setInvalid(false);
    router.push("/");

  } catch (error: any) {
    setInvalid(true);
    setAlertMessage("Something went wrong. Try again.");
  }
};


  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      {/* <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div> */}
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>
          <div>
            <form onSubmit={handleSignIn}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input onChange={(e) => {
                    setInputEmail(e.target.value)
                        setInvalid(false);
                    
                    }} placeholder="info@gmail.com" type="email" />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      onChange={(e) => {
                        setInputPassword(e.target.value)
                        setInvalid(false);
                      }}
                    />
                    <span
                      onClick={() => {
                        setShowPassword(!showPassword)
                      }}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {(() => {
                        const Icon = getIconComponent(showPassword ? EyeIcon : EyeCloseIcon);
                        return Icon ? <Icon className="fill-gray-500 dark:fill-gray-400" /> : null;
                      })()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    href="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div>
                  <Button type="submit" className="w-full" size="sm">
                    Sign in
                  </Button>
                </div>
              </div>
            </form>
            {invalid && (
  <Alert
    variant="error"
    title="Invalid Credentials"
    message={alertMessage}
  />
)}

          </div>
        </div>
      </div>
    </div>
  );
}

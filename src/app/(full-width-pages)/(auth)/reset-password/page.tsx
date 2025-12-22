import { Metadata } from "next";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password | ReclaimAdmin - Next.js Dashboard Template",
  description: "Reset your password for ReclaimAdmin Dashboard Template",
};

export default function ResetPassword() {
  return <ResetPasswordForm />;
}


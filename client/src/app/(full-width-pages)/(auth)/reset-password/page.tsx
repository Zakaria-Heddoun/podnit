import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Reset Password | Podnit - Creative Design Platform",
  description: "Create a new password for your Podnit account",
};

export default function ResetPassword() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

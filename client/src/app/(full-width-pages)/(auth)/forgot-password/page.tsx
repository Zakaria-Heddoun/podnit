import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | Podnit - Creative Design Platform",
  description: "Reset your Podnit account password",
};

export default function ForgotPassword() {
  return <ForgotPasswordForm />;
}

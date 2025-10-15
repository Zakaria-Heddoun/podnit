import SignUpForm from "@/components/auth/SignUpForm";
import AuthRedirect from "./AuthRedirect";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js SignUp Page | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js SignUp Page TailAdmin Dashboard Template",
  // other metadata
};

export default function SignUp() {
  return (
    <AuthRedirect>
      <SignUpForm />
    </AuthRedirect>
  );
}

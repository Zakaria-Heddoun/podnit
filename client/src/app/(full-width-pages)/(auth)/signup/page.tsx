import SignUpForm from "@/components/auth/SignUpForm";
import AuthRedirect from "./AuthRedirect";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Podnit - Creative Design Platform",
  description: "Create your Podnit account to start designing and selling custom products",
  // other metadata
};

export default function SignUp() {
  return (
    <AuthRedirect>
      <SignUpForm />
    </AuthRedirect>
  );
}

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <img src="/images/logo/podnit.png" alt="Podnit" className="h-12" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#how-it-works" className="text-white/90 hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#features" className="text-white/90 hover:text-white transition-colors">
              Features
            </a>
            <a href="#catalog" className="text-white/90 hover:text-white transition-colors">
              Catalog
            </a>
            <a href="#pricing" className="text-white/90 hover:text-white transition-colors">
              Pricing
            </a>
          </div>

          {/* CTA Buttons - Now visible on all screen sizes */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="bg-black text-white hover:bg-black/90"
              asChild
            >
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button
              className="bg-black text-white hover:bg-black/90"
              asChild
            >
              <Link href="/signup">Start Selling</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
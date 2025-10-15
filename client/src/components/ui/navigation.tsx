import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 py-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="text-2xl font-bold text-white">
            PODNIT
          </div>

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

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10"
              asChild
            >
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button
              className="bg-white text-primary hover:bg-white/90"
              asChild
            >
              <Link href="/signup">Start Selling</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-white hover:bg-white/10"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="flex flex-col space-y-4">
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
              <div className="pt-4 border-t border-white/20">
                <Button
                  variant="ghost"
                  className="w-full mb-2 text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/signin">Sign In</Link>
                </Button>
                <Button
                  className="w-full bg-white text-primary hover:bg-white/90"
                  asChild
                >
                  <Link href="/signup">Start Selling</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
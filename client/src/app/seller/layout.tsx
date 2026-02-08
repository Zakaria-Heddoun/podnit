"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import SellerSidebar from "@/layout/SellerSidebar";
import Backdrop from "@/layout/Backdrop";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import React from "react";
import { usePathname } from "next/navigation";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();

  // Check if we're in the studio
  const isStudioPage = pathname?.includes('/studio');

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <ProtectedRoute requiredRole="seller">
      {/* If we're in studio, render fullscreen layout */}
      {isStudioPage ? (
        <div className="min-h-screen">
          {children}
        </div>
      ) : (
        <div className="min-h-screen xl:flex">
          {/* Sidebar and Backdrop */}
          <SellerSidebar />
          <Backdrop />
          {/* Main Content Area */}
          <div
            className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
          >
            {/* Header */}
            <AppHeader />
            {/* Page Content */}
            <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import Backdrop from "@/layout/Backdrop";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import React from "react";
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { user, hasPermission } = useAuth();

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <ProtectedRoute requiredRole="employee">
      <div className="min-h-screen xl:flex">
        {/* Sidebar - Permission-aware employee sidebar */}
        <div className="hidden lg:block fixed left-0 top-0 h-full w-[90px] lg:w-[290px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 transition-all duration-300">
          <div className="p-4">
            <h2 className="text-lg font-semibold">Employee</h2>
          </div>

          <nav className="mt-4 p-4">
            {/* Define mapping from permission key -> label and route */}
            {(
              [
                { key: 'view_dashboard', label: 'Dashboard', href: '/employee/dashboard' },
                { key: 'view_orders', label: 'Orders', href: '/employee/orders' },
                { key: 'view_products', label: 'Products', href: '/employee/products' },
                { key: 'manage_templates', label: 'Templates', href: '/employee/templates' },
                { key: 'approve_templates', label: 'Approve Templates', href: '/employee/templates/approvals' },
                { key: 'approve_designs', label: 'Approve Designs', href: '/employee/designs/approvals' },
                { key: 'view_users', label: 'Users', href: '/employee/users' },
              ]
            ).map((item) => (
              hasPermission(item.key) ? (
                <div key={item.key} className="mb-2">
                  <Link href={item.href} className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium">
                    {item.label}
                  </Link>
                </div>
              ) : null
            ))}

            {/* If no permitted links, show a small message */}
            {!user?.permissions || user.permissions.length === 0 ? (
              <div className="mt-4 text-sm text-gray-500">No pages assigned. Contact admin.</div>
            ) : null}
          </nav>
        </div>
        <Backdrop />
        {/* Main Content Area */}
        <div
          className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
        >
          {/* Header */}
          <AppHeader />
          {/* Page Content */}
          <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}


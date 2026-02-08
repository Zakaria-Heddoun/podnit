'use client';

import { useAuth } from '@/context/AuthContext';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermissions: string | string[]; // Single permission or array - user needs at least one
  fallback?: React.ReactNode;
}

/**
 * PermissionGuard Component
 * 
 * Conditionally renders children based on user permissions.
 * Used to restrict access to specific page features or entire pages.
 * 
 * Usage:
 * <PermissionGuard requiredPermissions="manage_products">
 *   <ProductForm />
 * </PermissionGuard>
 * 
 * With multiple permissions (user needs at least one):
 * <PermissionGuard requiredPermissions={['manage_orders', 'view_orders']}>
 *   <OrdersList />
 * </PermissionGuard>
 * 
 * With fallback UI:
 * <PermissionGuard 
 *   requiredPermissions="approve_templates"
 *   fallback={<AccessDenied />}
 * >
 *   <ApprovalPanel />
 * </PermissionGuard>
 */
export default function PermissionGuard({ 
  children, 
  requiredPermissions,
  fallback = null 
}: PermissionGuardProps) {
  const { user, isAuthenticated, hasPermission, isAdmin } = useAuth();

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  // Admin has all permissions
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check if user has required permission(s)
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
  const hasRequiredPermission = permissions.some((perm) => hasPermission(perm));

  if (!hasRequiredPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

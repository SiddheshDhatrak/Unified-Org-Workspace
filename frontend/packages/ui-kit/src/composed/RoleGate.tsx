import React from 'react';
import { usePermission } from '@workspace/hooks';
import { PermissionAction } from '@workspace/types';

interface RoleGateProps {
  permission: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Client-Side UX RBAC Permission Wrapper (§7.2 / §7.3)
 * Never an independent security boundary; reflects server-confirmed role claims from useSession().
 */
export const RoleGate: React.FC<RoleGateProps> = ({ permission, children, fallback = null }) => {
  const hasAccess = usePermission(permission);
  if (!hasAccess) return <>{fallback}</>;
  return <>{children}</>;
};

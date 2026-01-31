"use client";

import { useAuth } from "./useAuth";
import { useAccount } from "wagmi";
import { UserRole, Permission, rolePermissions, hasPermission } from "@/lib/roles";

// Mapping wallet address ke role
// Di production, ini harus diambil dari database atau smart contract
const walletToRoleMapping: Record<string, UserRole> = {
  // Format: "0xaddress": UserRole.ROLE_NAME
  // Contoh:
  // "0x1234567890123456789012345678901234567890": UserRole.SME_OWNER,
  // "0x0987654321098765432109876543210987654321": UserRole.SUPPLIER,
};

export function useRole() {
  const { user } = useAuth();
  const { address } = useAccount();

  // Tentukan role berdasarkan prioritas:
  // 1. Role dari mapping wallet (hardcoded untuk sekarang)
  // 2. Role dari user profile (dari auth hook)
  // 3. Default ke SUPPLIER
  const getUserRole = (): UserRole | null => {
    if (!address) return null;

    // Check wallet mapping dulu
    const mappedRole = walletToRoleMapping[address.toLowerCase()];
    if (mappedRole) return mappedRole;

    // Check user profile role
    if (user?.role) {
      const normalizedRole = user.role.toUpperCase().replace(" ", "_");
      if (Object.values(UserRole).includes(normalizedRole as UserRole)) {
        return normalizedRole as UserRole;
      }
    }

    // Default
    return UserRole.SUPPLIER;
  };

  const role = getUserRole();

  return {
    role,
    address,
    isAdmin: role === UserRole.ADMIN,
    isSMEOwner: role === UserRole.SME_OWNER,
    isSupplier: role === UserRole.SUPPLIER,
    hasPermission: (permission: Permission) => hasPermission(role, permission),
    hasAnyPermission: (permissions: Permission[]) => {
      if (!role) return false;
      return permissions.some((p) => hasPermission(role, p));
    },
    hasAllPermissions: (permissions: Permission[]) => {
      if (!role) return false;
      return permissions.every((p) => hasPermission(role, p));
    },
  };
}

// Helper hook untuk check specific permission
export function usePermission(permission: Permission) {
  const { hasPermission: checkPermission } = useRole();
  return checkPermission(permission);
}

// Helper hook untuk check multiple permissions
export function usePermissions(permissions: Permission[]) {
  const { hasAnyPermission, hasAllPermissions } = useRole();
  return {
    hasAny: hasAnyPermission(permissions),
    hasAll: hasAllPermissions(permissions),
  };
}

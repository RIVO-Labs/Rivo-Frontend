// Role definitions
export enum UserRole {
  ADMIN = "ADMIN",
  SME_OWNER = "SME_OWNER",
  SUPPLIER = "SUPPLIER",
}

// Permission definitions
export enum Permission {
  ADD_SUPPLIER = "ADD_SUPPLIER",
  ADD_EMPLOYEE = "ADD_EMPLOYEE",
  GENERATE_QR_INVOICE = "GENERATE_QR_INVOICE",
  PAY_INVOICE = "PAY_INVOICE",
  EXECUTE_PAYROLL = "EXECUTE_PAYROLL",
  VIEW_DASHBOARD = "VIEW_DASHBOARD",
}

// Role to Permissions mapping
export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.ADD_SUPPLIER,
    Permission.ADD_EMPLOYEE,
    Permission.GENERATE_QR_INVOICE,
    Permission.PAY_INVOICE,
    Permission.EXECUTE_PAYROLL,
    Permission.VIEW_DASHBOARD,
  ],
  [UserRole.SME_OWNER]: [
    Permission.ADD_SUPPLIER,
    Permission.ADD_EMPLOYEE,
    Permission.GENERATE_QR_INVOICE,
    Permission.PAY_INVOICE,
    Permission.EXECUTE_PAYROLL,
    Permission.VIEW_DASHBOARD,
  ],
  [UserRole.SUPPLIER]: [
    Permission.GENERATE_QR_INVOICE,
    Permission.VIEW_DASHBOARD,
  ],
};

// Helper functions
export const hasPermission = (role: UserRole | null, permission: Permission): boolean => {
  if (!role) return false;
  return rolePermissions[role]?.includes(permission) ?? false;
};

export const hasAnyPermission = (role: UserRole | null, permissions: Permission[]): boolean => {
  if (!role) return false;
  return permissions.some((permission) => hasPermission(role, permission));
};

export const hasAllPermissions = (role: UserRole | null, permissions: Permission[]): boolean => {
  if (!role) return false;
  return permissions.every((permission) => hasPermission(role, permission));
};

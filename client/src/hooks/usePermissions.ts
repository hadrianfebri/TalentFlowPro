import { useAuth } from "./useAuth";

export interface UserRole {
  role: "admin" | "hr" | "employee";
  employeeId?: number;
  companyId: string;
}

export function usePermissions() {
  const { user } = useAuth();

  const userRole: UserRole = {
    role: (user as any)?.role || "employee",
    employeeId: (user as any)?.employeeId,
    companyId: (user as any)?.companyId || "",
  };

  const hasPermission = (action: string, resource: string): boolean => {
    const permissions: Record<string, Record<string, string[]>> = {
      admin: {
        employees: ["create", "read", "update", "delete"],
        attendance: ["create", "read", "update", "delete"],
        payroll: ["create", "read", "update", "delete"],
        leaves: ["create", "read", "update", "delete", "approve"],
        documents: ["create", "read", "update", "delete"],
        reimbursements: ["create", "read", "update", "delete", "approve"],
        performance: ["create", "read", "update", "delete"],
        recruitment: ["create", "read", "update", "delete"],
        dashboard: ["read"],
      },
      hr: {
        employees: ["create", "read", "update"],
        attendance: ["read", "update"],
        payroll: ["create", "read", "update"],
        leaves: ["read", "approve"],
        documents: ["create", "read", "update"],
        reimbursements: ["read", "approve"],
        performance: ["create", "read", "update"],
        recruitment: ["create", "read", "update"],
        dashboard: ["read"],
      },
      employee: {
        employees: ["read_own"],
        attendance: ["create_own", "read_own"],
        payroll: ["read_own"],
        leaves: ["create_own", "read_own"],
        documents: ["read_own"],
        reimbursements: ["create_own", "read_own"],
        performance: ["read_own"],
        recruitment: [],
        dashboard: ["read_own"],
      },
    };

    const userPermissions = permissions[userRole.role];
    if (!userPermissions) return false;

    const resourcePermissions = userPermissions[resource];
    if (!resourcePermissions) return false;

    return resourcePermissions.includes(action);
  };

  const isAdmin = () => userRole.role === "admin";
  const isHR = () => userRole.role === "hr";
  const isEmployee = () => userRole.role === "employee";
  const isAdminOrHR = () => userRole.role === "admin" || userRole.role === "hr";

  const canCreate = (resource: string) => hasPermission("create", resource);
  const canRead = (resource: string) => hasPermission("read", resource);
  const canUpdate = (resource: string) => hasPermission("update", resource);
  const canDelete = (resource: string) => hasPermission("delete", resource);
  const canApprove = (resource: string) => hasPermission("approve", resource);

  return {
    userRole,
    hasPermission,
    isAdmin,
    isHR,
    isEmployee,
    isAdminOrHR,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canApprove,
  };
}
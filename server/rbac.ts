import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

export interface AuthenticatedRequest extends Request {
  user: {
    claims: {
      sub: string;
    };
  };
  userProfile?: {
    id: string;
    role: string;
    employeeId?: number;
    companyId: string;
  };
}

// Middleware untuk mengambil profile user dengan role
export const getUserProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.userProfile = {
      id: user.id,
      role: user.role || "employee",
      employeeId: user.employeeId ?? undefined,
      companyId: user.companyId || "",
    };

    next();
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({ message: "Failed to get user profile" });
  }
};

// Middleware untuk memeriksa apakah user adalah Admin atau HR
export const requireAdminOrHR = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const role = req.userProfile?.role;
  
  if (role !== "admin" && role !== "hr") {
    return res.status(403).json({ 
      message: "Access denied. Admin or HR role required." 
    });
  }
  
  next();
};

// Middleware untuk memeriksa apakah user adalah Admin
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const role = req.userProfile?.role;
  
  if (role !== "admin") {
    return res.status(403).json({ 
      message: "Access denied. Admin role required." 
    });
  }
  
  next();
};

// Middleware untuk employee yang hanya bisa akses data mereka sendiri
export const requireEmployeeAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const role = req.userProfile?.role;
  const employeeId = req.userProfile?.employeeId;
  const requestedEmployeeId = parseInt(req.params.employeeId || req.params.id || "0");

  // Admin dan HR bisa akses semua data
  if (role === "admin" || role === "hr") {
    return next();
  }

  // Employee hanya bisa akses data mereka sendiri
  if (role === "employee") {
    if (!employeeId || employeeId !== requestedEmployeeId) {
      return res.status(403).json({ 
        message: "Access denied. You can only access your own data." 
      });
    }
  }

  next();
};

// Helper function untuk check permissions
export const hasPermission = (userRole: string, action: string, resource: string): boolean => {
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

  const userPermissions = permissions[userRole];
  if (!userPermissions) return false;

  const resourcePermissions = userPermissions[resource];
  if (!resourcePermissions) return false;

  return resourcePermissions.includes(action);
};
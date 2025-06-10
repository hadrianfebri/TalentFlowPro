import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupSwagger } from "./swagger";
import { getUserProfile, requireAdminOrHR, requireAdmin, requireEmployeeAccess, AuthenticatedRequest } from "./rbac";
import {
  insertEmployeeSchema,
  insertAttendanceSchema,
  insertLeaveRequestSchema,
  insertPayrollSchema,
  insertDocumentSchema,
  insertReimbursementSchema,
  insertPerformanceReviewSchema,
  insertJobSchema,
  insertJobApplicationSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Swagger documentation
  setupSwagger(app);
  
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  /**
   * @swagger
   * /auth/user:
   *   get:
   *     summary: Mendapatkan informasi user yang sedang login dengan role
   *     tags: [Authentication]
   *     security:
   *       - ReplitAuth: []
   *     responses:
   *       200:
   *         description: Data user berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 email:
   *                   type: string
   *                 firstName:
   *                   type: string
   *                 lastName:
   *                   type: string
   *                 role:
   *                   type: string
   *                   enum: [admin, hr, employee]
   *                 employeeId:
   *                   type: integer
   *                 companyId:
   *                   type: string
   *       401:
   *         description: Unauthorized - User belum login
   *       500:
   *         description: Server error
   */
  app.get('/api/auth/user', isAuthenticated, getUserProfile, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json({
        ...user,
        permissions: req.userProfile?.role
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard API
  /**
   * @swagger
   * /dashboard/stats:
   *   get:
   *     summary: Mendapatkan statistik dashboard perusahaan
   *     tags: [Dashboard]
   *     security:
   *       - ReplitAuth: []
   *     responses:
   *       200:
   *         description: Statistik dashboard berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 totalEmployees:
   *                   type: integer
   *                 attendanceToday:
   *                   type: integer
   *                 pendingLeaves:
   *                   type: integer
   *                 monthlyPayroll:
   *                   type: number
   *       400:
   *         description: User tidak terkait dengan perusahaan
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const stats = await storage.getDashboardStats(user.companyId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const activities = await storage.getRecentActivities(user.companyId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get('/api/dashboard/ai-insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const insights = await storage.getAIInsights(user.companyId);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching AI insights:", error);
      res.status(500).json({ message: "Failed to fetch AI insights" });
    }
  });

  // Employee Management API
  /**
   * @swagger
   * /employees:
   *   get:
   *     summary: Mendapatkan daftar semua karyawan
   *     tags: [Employee Management]
   *     security:
   *       - ReplitAuth: []
   *     responses:
   *       200:
   *         description: Daftar karyawan berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Employee'
   *       400:
   *         description: User tidak terkait dengan perusahaan
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   *   post:
   *     summary: Menambah karyawan baru
   *     tags: [Employee Management]
   *     security:
   *       - ReplitAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - employeeId
   *               - firstName
   *               - lastName
   *               - email
   *               - position
   *               - hireDate
   *             properties:
   *               employeeId:
   *                 type: string
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               email:
   *                 type: string
   *               phone:
   *                 type: string
   *               position:
   *                 type: string
   *               department:
   *                 type: string
   *               hireDate:
   *                 type: string
   *                 format: date
   *               salary:
   *                 type: string
   *     responses:
   *       201:
   *         description: Karyawan berhasil ditambahkan
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Employee'
   *       400:
   *         description: Data tidak valid atau user tidak terkait dengan perusahaan
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  app.get('/api/employees', isAuthenticated, getUserProfile, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.userProfile?.companyId;
      const userRole = req.userProfile?.role;
      const employeeId = req.userProfile?.employeeId;

      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      let employees;
      if (userRole === "admin" || userRole === "hr") {
        // Admin dan HR bisa lihat semua karyawan
        employees = await storage.getEmployees(companyId);
      } else {
        // Employee hanya bisa lihat data mereka sendiri
        if (!employeeId) {
          return res.status(403).json({ message: "Employee profile not found" });
        }
        const employee = await storage.getEmployee(employeeId);
        employees = employee ? [employee] : [];
      }

      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post('/api/employees', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.userProfile?.companyId;

      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const validatedData = insertEmployeeSchema.parse({
        ...req.body,
        companyId: companyId,
      });
      
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.get('/api/employees/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const employee = await storage.getEmployee(parseInt(id));
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.put('/api/employees/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertEmployeeSchema.partial().parse(req.body);
      
      const employee = await storage.updateEmployee(parseInt(id), validatedData);
      res.json(employee);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  // Attendance API
  app.get('/api/attendance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const { date, employeeId } = req.query;
      const attendance = await storage.getAttendance(
        user.companyId,
        date as string,
        employeeId ? parseInt(employeeId as string) : undefined
      );
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post('/api/attendance/checkin', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.checkIn(validatedData);
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Error recording check-in:", error);
      res.status(500).json({ message: "Failed to record check-in" });
    }
  });

  app.put('/api/attendance/:id/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { checkOut, checkOutLocation, checkOutPhoto } = req.body;
      
      const attendance = await storage.checkOut(parseInt(id), {
        checkOut: new Date(checkOut),
        checkOutLocation,
        checkOutPhoto,
      });
      res.json(attendance);
    } catch (error) {
      console.error("Error recording check-out:", error);
      res.status(500).json({ message: "Failed to record check-out" });
    }
  });

  // Leave Management API
  app.get('/api/leaves', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const leaves = await storage.getLeaveRequests(user.companyId);
      res.json(leaves);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      res.status(500).json({ message: "Failed to fetch leave requests" });
    }
  });

  app.post('/api/leaves', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertLeaveRequestSchema.parse(req.body);
      const leave = await storage.createLeaveRequest(validatedData);
      res.status(201).json(leave);
    } catch (error) {
      console.error("Error creating leave request:", error);
      res.status(500).json({ message: "Failed to create leave request" });
    }
  });

  app.put('/api/leaves/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const leave = await storage.approveLeaveRequest(parseInt(id), userId);
      res.json(leave);
    } catch (error) {
      console.error("Error approving leave request:", error);
      res.status(500).json({ message: "Failed to approve leave request" });
    }
  });

  app.put('/api/leaves/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const userId = req.user.claims.sub;
      
      const leave = await storage.rejectLeaveRequest(parseInt(id), userId, rejectionReason);
      res.json(leave);
    } catch (error) {
      console.error("Error rejecting leave request:", error);
      res.status(500).json({ message: "Failed to reject leave request" });
    }
  });

  // Payroll API
  app.get('/api/payroll', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const { period } = req.query;
      const payroll = await storage.getPayroll(user.companyId, period as string);
      res.json(payroll);
    } catch (error) {
      console.error("Error fetching payroll:", error);
      res.status(500).json({ message: "Failed to fetch payroll" });
    }
  });

  app.post('/api/payroll/calculate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const { period, employeeId } = req.body;
      const payroll = await storage.calculatePayroll(user.companyId, period, employeeId);
      res.json(payroll);
    } catch (error) {
      console.error("Error calculating payroll:", error);
      res.status(500).json({ message: "Failed to calculate payroll" });
    }
  });

  app.post('/api/payroll/:id/generate-slip', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const slipPath = await storage.generatePayslip(parseInt(id));
      res.json({ slipPath });
    } catch (error) {
      console.error("Error generating payslip:", error);
      res.status(500).json({ message: "Failed to generate payslip" });
    }
  });

  // Document Management API
  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const documents = await storage.getDocuments(user.companyId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const validatedData = insertDocumentSchema.parse({
        ...req.body,
        companyId: user.companyId,
        createdBy: userId,
      });
      
      const document = await storage.createDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // Reimbursement API
  app.get('/api/reimbursements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const reimbursements = await storage.getReimbursements(user.companyId);
      res.json(reimbursements);
    } catch (error) {
      console.error("Error fetching reimbursements:", error);
      res.status(500).json({ message: "Failed to fetch reimbursements" });
    }
  });

  app.post('/api/reimbursements', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertReimbursementSchema.parse(req.body);
      const reimbursement = await storage.createReimbursement(validatedData);
      res.status(201).json(reimbursement);
    } catch (error) {
      console.error("Error creating reimbursement:", error);
      res.status(500).json({ message: "Failed to create reimbursement" });
    }
  });

  // Performance API
  app.get('/api/performance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const performance = await storage.getPerformanceReviews(user.companyId);
      res.json(performance);
    } catch (error) {
      console.error("Error fetching performance reviews:", error);
      res.status(500).json({ message: "Failed to fetch performance reviews" });
    }
  });

  app.post('/api/performance', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertPerformanceReviewSchema.parse(req.body);
      const performance = await storage.createPerformanceReview(validatedData);
      res.status(201).json(performance);
    } catch (error) {
      console.error("Error creating performance review:", error);
      res.status(500).json({ message: "Failed to create performance review" });
    }
  });

  // Recruitment API
  app.get('/api/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const jobs = await storage.getJobs(user.companyId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.post('/api/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const validatedData = insertJobSchema.parse({
        ...req.body,
        companyId: user.companyId,
        createdBy: userId,
      });
      
      const job = await storage.createJob(validatedData);
      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  app.get('/api/job-applications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const applications = await storage.getJobApplications(user.companyId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching job applications:", error);
      res.status(500).json({ message: "Failed to fetch job applications" });
    }
  });

  app.post('/api/job-applications', async (req, res) => {
    try {
      const validatedData = insertJobApplicationSchema.parse(req.body);
      const application = await storage.createJobApplication(validatedData);
      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating job application:", error);
      res.status(500).json({ message: "Failed to create job application" });
    }
  });

  // AI Integration API
  app.post('/api/ai/generate-insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const insights = await storage.generateAIInsights(user.companyId);
      res.json(insights);
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ message: "Failed to generate AI insights" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

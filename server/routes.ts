import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import { db } from "./db";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupSwagger } from "./swagger";
import { getUserProfile, requireAdminOrHR, requireAdmin, requireEmployeeAccess, AuthenticatedRequest } from "./rbac";
import { i18nMiddleware, detectLanguage, getApiMessage } from "./i18n";
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
  insertEmployeeSalaryComponentSchema,
  insertSalaryComponentSchema,
  hrLoginSchema,
  employeeLoginSchema,
  employees,
  attendance,
  payroll,
  jobs,
  jobApplications,
} from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { eq, and } from "drizzle-orm";
import multer from "multer";
import fs from "fs";
import path from "path";

// Configure multer for file uploads
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: multerStorage,
  fileFilter: (req, file, cb) => {
    // Allow images for attendance photos
    if (file.fieldname === 'photo' && file.mimetype.startsWith('image/')) {
      cb(null, true);
    }
    // Allow PDFs and Word documents for CV uploads
    else if ((file.fieldname === 'cv_file' || file.fieldname === 'resume_file') && 
             (file.mimetype === 'application/pdf' || 
              file.mimetype.includes('document') || 
              file.mimetype.includes('word'))) {
      cb(null, true);
    }
    // Allow images for profile photos in applicant management
    else if (file.fieldname === 'photo_file' && file.mimetype.startsWith('image/')) {
      cb(null, true);
    }
    // Allow general document uploads
    else if (file.fieldname === 'file' && 
             (file.mimetype === 'application/pdf' || 
              file.mimetype.includes('document') || 
              file.mimetype.includes('word') ||
              file.mimetype.startsWith('image/'))) {
      cb(null, true);
    }
    else {
      cb(new Error(`File type ${file.mimetype} not allowed for field ${file.fieldname}`), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for CV files
  }
});

// Simple slip gaji generator
function generateSimplePayrollSlip(payroll: any, employee: any): Buffer {
  const slipContent = `
=====================================
         SLIP GAJI KARYAWAN
=====================================

Nama Karyawan    : ${employee.firstName} ${employee.lastName}
ID Karyawan      : ${employee.employeeId}
Periode          : ${payroll.period}
Tanggal Cetak    : ${new Date().toLocaleDateString('id-ID')}

-------------------------------------
         RINCIAN GAJI
-------------------------------------

Gaji Pokok       : Rp ${Number(payroll.basicSalary || 0).toLocaleString('id-ID')}
Lembur           : Rp ${Number(payroll.overtimePay || 0).toLocaleString('id-ID')}
Tunjangan        : Rp ${JSON.stringify(payroll.allowances) !== '{}' ? '500,000' : '0'}

GAJI KOTOR       : Rp ${Number(payroll.grossSalary || 0).toLocaleString('id-ID')}

-------------------------------------
         POTONGAN
-------------------------------------

BPJS Kesehatan   : Rp ${Number(payroll.bpjsHealth || 0).toLocaleString('id-ID')}
BPJS Ketenagakerjaan : Rp ${Number(payroll.bpjsEmployment || 0).toLocaleString('id-ID')}
PPh 21           : Rp ${Number(payroll.pph21 || 0).toLocaleString('id-ID')}

TOTAL POTONGAN   : Rp ${(Number(payroll.bpjsHealth || 0) + Number(payroll.bpjsEmployment || 0) + Number(payroll.pph21 || 0)).toLocaleString('id-ID')}

=====================================
GAJI BERSIH      : Rp ${Number(payroll.netSalary || 0).toLocaleString('id-ID')}
=====================================

Slip ini dicetak secara otomatis oleh sistem TalentWhiz.ai
  `;
  
  return Buffer.from(slipContent, 'utf-8');
}

// Helper function to parse CSV data
function parseCSV(csvContent: string): any[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length === headers.length) {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || null;
      });
      data.push(row);
    }
  }
  
  return data;
}

// AI Insights Generation Function
async function generateAttendanceInsights(attendanceRecords: any[], employees: any[], period: string) {
  const insights = [];
  
  try {
    // Analysis 1: Late Arrival Pattern
    const lateRecords = attendanceRecords.filter(record => record.status === 'late');
    if (lateRecords.length > 0) {
      const lateEmployees = lateRecords.map(record => 
        `${record.employee?.firstName || ''} ${record.employee?.lastName || ''}`.trim()
      ).filter(name => name.length > 0);
      
      insights.push({
        type: 'late_pattern',
        title: 'Pola Keterlambatan Terdeteksi',
        description: `${lateRecords.length} karyawan menunjukkan pola keterlambatan pada tanggal ${period}`,
        severity: lateRecords.length > 3 ? 'high' : 'medium',
        actionable: true,
        employees: lateEmployees,
        recommendation: 'Pertimbangkan untuk mengadakan counseling atau review jadwal kerja untuk karyawan yang sering terlambat.'
      });
    }

    // Analysis 2: Attendance Rate
    const totalEmployees = employees.length;
    const presentEmployees = attendanceRecords.filter(record => record.checkIn || record.status === 'present').length;
    const attendanceRate = totalEmployees > 0 ? (presentEmployees / totalEmployees) * 100 : 0;
    
    if (attendanceRate < 85) {
      insights.push({
        type: 'low_attendance',
        title: 'Tingkat Kehadiran Rendah',
        description: `Tingkat kehadiran hanya ${attendanceRate.toFixed(1)}%, di bawah standar optimal 85%`,
        severity: attendanceRate < 70 ? 'high' : 'medium',
        actionable: true,
        recommendation: 'Evaluasi kebijakan absensi dan identifikasi faktor-faktor yang mempengaruhi kehadiran karyawan.'
      });
    }

    // Analysis 3: Working Hours Pattern
    const workingHoursRecords = attendanceRecords.filter(record => 
      record.checkIn && record.checkOut && record.workingHours
    );
    
    if (workingHoursRecords.length > 0) {
      const avgHours = workingHoursRecords.reduce((sum, record) => 
        sum + parseFloat(record.workingHours || '0'), 0
      ) / workingHoursRecords.length;
      
      const shortHourEmployees = workingHoursRecords
        .filter(record => parseFloat(record.workingHours || '0') < 7)
        .map(record => `${record.employee?.firstName || ''} ${record.employee?.lastName || ''}`.trim())
        .filter(name => name.length > 0);
      
      if (shortHourEmployees.length > 0) {
        insights.push({
          type: 'short_working_hours',
          title: 'Jam Kerja Di Bawah Standar',
          description: `${shortHourEmployees.length} karyawan bekerja kurang dari 7 jam pada ${period}`,
          severity: shortHourEmployees.length > 2 ? 'medium' : 'low',
          actionable: true,
          employees: shortHourEmployees,
          recommendation: 'Review penyebab jam kerja pendek - apakah karena keperluan pribadi, kondisi kesehatan, atau masalah operasional.'
        });
      }
    }

    // Analysis 4: Check-in Location Anomaly
    const locationRecords = attendanceRecords.filter(record => record.checkInLocation);
    if (locationRecords.length > 0) {
      insights.push({
        type: 'location_compliance',
        title: 'Kepatuhan Lokasi Check-in',
        description: `${locationRecords.length} dari ${attendanceRecords.length} check-in memiliki data lokasi GPS`,
        severity: 'low',
        actionable: false,
        recommendation: 'Pastikan semua karyawan mengaktifkan GPS saat melakukan check-in untuk meningkatkan akurasi data.'
      });
    }

    // Analysis 5: Overall Productivity Insight
    if (attendanceRate > 90 && workingHoursRecords.length > 0) {
      const avgHours = workingHoursRecords.reduce((sum, record) => 
        sum + parseFloat(record.workingHours || '0'), 0
      ) / workingHoursRecords.length;
      
      if (avgHours >= 8) {
        insights.push({
          type: 'high_performance',
          title: 'Kinerja Kehadiran Optimal',
          description: `Tim menunjukkan tingkat kehadiran ${attendanceRate.toFixed(1)}% dengan rata-rata jam kerja ${avgHours.toFixed(1)} jam`,
          severity: 'low',
          actionable: false,
          recommendation: 'Pertahankan momentum positif ini dengan program recognition dan reward untuk tim yang konsisten.'
        });
      }
    }

    return insights;
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return [{
      type: 'error',
      title: 'Error dalam Analisis AI',
      description: 'Terjadi kesalahan saat menganalisis data absensi',
      severity: 'medium' as const,
      actionable: false,
      recommendation: 'Silakan coba lagi atau hubungi administrator sistem.'
    }];
  }
}

// AI Payroll Insights Generation Function
import { JobPlatformManager, JobData } from './integrations/jobPlatforms';

// Initialize platform manager
const platformManager = new JobPlatformManager();

// External platform integration function
async function postToExternalPlatform(platform: string, jobData: any) {
  const platformJobData: JobData = {
    title: jobData.title,
    description: jobData.description || '',
    requirements: jobData.requirements || '',
    location: jobData.location || '',
    salaryRange: jobData.salaryRange || '',
    type: jobData.type,
    openings: jobData.openings,
    companyName: process.env.COMPANY_NAME || 'TalentFlow Company',
    companyDescription: process.env.COMPANY_DESCRIPTION || 'Leading HR solutions provider',
    contactEmail: process.env.COMPANY_EMAIL || 'hr@company.com',
    benefits: ['Asuransi kesehatan', 'Tunjangan transport', 'Bonus kinerja']
  };

  // Check if platform is configured
  if (!platformManager.isConfigured(platform)) {
    throw new Error(`Platform ${platform} tidak terkonfigurasi. Silakan tambahkan API credentials.`);
  }

  // Post to single platform
  const results = await platformManager.postToMultiplePlatforms([platform], platformJobData);
  return results[0];
}

async function generatePayrollInsights(payrollRecords: any[], employees: any[], period: string) {
  const insights = [];
  
  try {
    // Analysis 1: Salary Distribution Analysis
    if (payrollRecords.length > 0) {
      const salaries = payrollRecords.map(record => parseFloat(record.netSalary));
      const avgSalary = salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length;
      const maxSalary = Math.max(...salaries);
      const minSalary = Math.min(...salaries);
      const salaryGap = maxSalary - minSalary;
      
      if (salaryGap > avgSalary * 2) {
        insights.push({
          type: 'salary_disparity',
          title: 'Kesenjangan Gaji Terdeteksi',
          description: `Terdapat kesenjangan gaji yang signifikan antara ${formatCurrency(minSalary)} hingga ${formatCurrency(maxSalary)}`,
          severity: salaryGap > avgSalary * 3 ? 'high' : 'medium',
          value: salaryGap,
          trend: 'stable',
          recommendation: 'Review struktur gaji untuk memastikan keadilan internal. Pertimbangkan implementasi salary grade yang lebih terstruktur.'
        });
      }
    }

    // Analysis 2: Overtime Cost Analysis
    const overtimeRecords = payrollRecords.filter(record => parseFloat(record.overtimePay) > 0);
    if (overtimeRecords.length > 0) {
      const totalOvertimeCost = overtimeRecords.reduce((sum, record) => sum + parseFloat(record.overtimePay), 0);
      const avgOvertimeCost = totalOvertimeCost / overtimeRecords.length;
      const overtimePercentage = (overtimeRecords.length / payrollRecords.length) * 100;
      
      if (overtimePercentage > 30) {
        insights.push({
          type: 'high_overtime',
          title: 'Biaya Lembur Tinggi',
          description: `${overtimePercentage.toFixed(1)}% karyawan memiliki lembur dengan total biaya ${formatCurrency(totalOvertimeCost)}`,
          severity: overtimePercentage > 50 ? 'high' : 'medium',
          value: totalOvertimeCost,
          trend: 'up',
          recommendation: 'Evaluasi beban kerja dan distribusi tugas. Pertimbangkan penambahan karyawan atau optimalisasi proses kerja.'
        });
      }
    }

    // Analysis 3: Tax and Deduction Compliance
    const taxRecords = payrollRecords.filter(record => parseFloat(record.tax) > 0);
    const totalTax = taxRecords.reduce((sum, record) => sum + parseFloat(record.tax), 0);
    const totalBPJS = payrollRecords.reduce((sum, record) => 
      sum + parseFloat(record.bpjsHealth) + parseFloat(record.bpjsEmployment), 0
    );
    
    insights.push({
      type: 'compliance_status',
      title: 'Status Kepatuhan Pajak & BPJS',
      description: `Total pajak PPh21: ${formatCurrency(totalTax)}, Total BPJS: ${formatCurrency(totalBPJS)}`,
      severity: 'low',
      value: totalTax + totalBPJS,
      trend: 'stable',
      recommendation: 'Pastikan semua perhitungan pajak dan BPJS sesuai dengan regulasi terbaru. Lakukan review berkala.'
    });

    // Analysis 4: Payroll Cost Trend
    const totalPayrollCost = payrollRecords.reduce((sum, record) => sum + parseFloat(record.netSalary), 0);
    const avgSalaryPerEmployee = payrollRecords.length > 0 ? totalPayrollCost / payrollRecords.length : 0;
    
    insights.push({
      type: 'cost_analysis',
      title: 'Analisis Biaya Total Payroll',
      description: `Total biaya payroll periode ${period}: ${formatCurrency(totalPayrollCost)} dengan rata-rata ${formatCurrency(avgSalaryPerEmployee)} per karyawan`,
      severity: 'low',
      value: totalPayrollCost,
      trend: 'stable',
      recommendation: 'Monitor trend biaya payroll secara konsisten. Bandingkan dengan budget dan proyeksi pertumbuhan perusahaan.'
    });

    // Analysis 5: Department Cost Distribution
    const departmentCosts = {};
    payrollRecords.forEach(record => {
      const dept = record.employee?.department || 'Tidak Ditentukan';
      if (!departmentCosts[dept]) {
        departmentCosts[dept] = { total: 0, count: 0 };
      }
      departmentCosts[dept].total += parseFloat(record.netSalary);
      departmentCosts[dept].count += 1;
    });

    const departments = Object.keys(departmentCosts);
    if (departments.length > 1) {
      const costByDept = departments.map(dept => ({
        department: dept,
        total: departmentCosts[dept].total,
        average: departmentCosts[dept].total / departmentCosts[dept].count,
        count: departmentCosts[dept].count
      })).sort((a, b) => b.total - a.total);

      const highestCostDept = costByDept[0];
      insights.push({
        type: 'department_analysis',
        title: 'Distribusi Biaya per Departemen',
        description: `Departemen ${highestCostDept.department} memiliki biaya payroll tertinggi: ${formatCurrency(highestCostDept.total)} untuk ${highestCostDept.count} karyawan`,
        severity: 'low',
        value: highestCostDept.total,
        trend: 'stable',
        recommendation: 'Analisis ROI per departemen untuk optimalisasi alokasi budget dan evaluasi produktivitas.'
      });
    }

    // Analysis 6: Salary Benchmarking Insight
    if (payrollRecords.length > 5) {
      const medianSalary = [...payrollRecords.map(r => parseFloat(r.netSalary))].sort((a, b) => a - b)[Math.floor(payrollRecords.length / 2)];
      const avgSalary = payrollRecords.reduce((sum, r) => sum + parseFloat(r.netSalary), 0) / payrollRecords.length;
      
      insights.push({
        type: 'salary_benchmarking',
        title: 'Benchmarking Struktur Gaji',
        description: `Median gaji: ${formatCurrency(medianSalary)}, Rata-rata: ${formatCurrency(avgSalary)}`,
        severity: 'low',
        value: avgSalary,
        trend: Math.abs(medianSalary - avgSalary) > avgSalary * 0.15 ? 'up' : 'stable',
        recommendation: 'Lakukan survey gaji industri untuk memastikan kompetitivitas kompensasi. Pertimbangkan adjustments berkala.'
      });
    }

    return insights;
  } catch (error) {
    console.error('Error generating payroll AI insights:', error);
    return [{
      type: 'error',
      title: 'Error dalam Analisis Payroll AI',
      description: 'Terjadi kesalahan saat menganalisis data payroll',
      severity: 'medium' as const,
      recommendation: 'Silakan coba lagi atau hubungi administrator sistem.'
    }];
  }
}

// Helper function for currency formatting in insights
function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
}

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication endpoints
 *   - name: Dashboard
 *     description: Dashboard and analytics endpoints
 *   - name: Employees
 *     description: Employee management endpoints
 *   - name: Attendance
 *     description: Attendance tracking endpoints
 *   - name: Leave
 *     description: Leave request management endpoints
 *   - name: Payroll
 *     description: Payroll management endpoints
 *   - name: Documents
 *     description: Document management endpoints
 *   - name: Reimbursements
 *     description: Reimbursement management endpoints
 *   - name: Performance
 *     description: Performance review endpoints
 *   - name: Jobs
 *     description: Job posting endpoints
 *   - name: Job Applications
 *     description: Job application management endpoints
 *   - name: AI Matching
 *     description: AI-powered job matching endpoints
 *   - name: Salary Components
 *     description: Salary component management endpoints
 *   - name: Integration
 *     description: External platform integration endpoints
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Swagger documentation
  setupSwagger(app);
  
  // Auth middleware
  await setupAuth(app);

  // Debug endpoint for session
  app.get('/api/debug/session', (req: any, res) => {
    res.json({
      session: req.session,
      user: req.user,
      authUser: req.session?.authUser
    });
  });

  // Local authentication routes
  app.post('/api/auth/login-hr', i18nMiddleware, async (req: any, res) => {
    try {
      const validatedData = hrLoginSchema.parse(req.body);
      const auth = await dbStorage.authenticateHR(validatedData.email, validatedData.password);
      
      if (!auth) {
        const language = detectLanguage(req);
        return res.status(401).json({ 
          message: getApiMessage(language, 'auth', 'invalid_credentials')
        });
      }

      // Set session
      req.session.authUser = {
        id: auth.id,
        email: auth.email,
        role: auth.role,
        companyId: auth.companyId,
        employeeId: auth.employeeId
      };

      // Save session explicitly
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }
        

        res.json({
          success: true,
          user: {
            id: auth.id,
            email: auth.email,
            role: auth.role,
            companyId: auth.companyId
          }
        });
      });
    } catch (error) {
      console.error("HR login error:", error);
      const language = detectLanguage(req);
      res.status(400).json({ 
        message: getApiMessage(language, 'auth', 'login_failed')
      });
    }
  });

  app.post('/api/auth/login-employee', i18nMiddleware, async (req: any, res) => {
    try {
      const validatedData = employeeLoginSchema.parse(req.body);
      const auth = await dbStorage.authenticateEmployee(validatedData.employeeId, validatedData.password);
      
      if (!auth) {
        const language = detectLanguage(req);
        return res.status(401).json({ 
          message: getApiMessage(language, 'auth', 'invalid_credentials')
        });
      }

      // Set session
      req.session.authUser = {
        id: auth.id,
        email: auth.email,
        role: auth.role,
        companyId: auth.companyId,
        employeeId: auth.employeeId
      };

      // Save session explicitly
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }
        

        res.json({
          success: true,
          user: {
            id: auth.id,
            email: auth.email,
            role: auth.role,
            companyId: auth.companyId,
            employeeId: auth.employeeId
          }
        });
      });
    } catch (error) {
      console.error("Employee login error:", error);
      const language = detectLanguage(req);
      res.status(400).json({ 
        message: getApiMessage(language, 'auth', 'login_failed')
      });
    }
  });

  app.post('/api/auth/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

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
  // Get current user session for local auth
  app.get('/api/auth/user', (req: any, res) => {
    try {

      
      if (!req.session?.authUser) {
        console.log("No auth user found in session");
        return res.status(401).json({ message: "Not authenticated" });
      }
      

      res.json(req.session.authUser);
    } catch (error) {
      console.error("Error fetching user session:", error);
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
  app.get('/api/dashboard/stats', isAuthenticated, getUserProfile, async (req: any, res) => {
    try {
      const companyId = req.userProfile?.companyId;
      const role = req.userProfile?.role;
      const employeeId = req.userProfile?.employeeId;
      
      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      let stats;
      if (role === 'employee' && employeeId) {
        // Employee-specific stats
        stats = await dbStorage.getEmployeeStats(employeeId, companyId);
      } else {
        // Admin/HR company-wide stats
        stats = await dbStorage.getDashboardStats(companyId);
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  /**
   * @swagger
   * /dashboard/activities:
   *   get:
   *     summary: Mendapatkan aktivitas terbaru perusahaan
   *     tags: [Dashboard]
   *     security:
   *       - ReplitAuth: []
   *     responses:
   *       200:
   *         description: Daftar aktivitas terbaru
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id: { type: string }
   *                   type: { type: string }
   *                   title: { type: string }
   *                   description: { type: string }
   *                   timestamp: { type: string, format: date-time }
   *       400:
   *         description: User tidak terkait dengan perusahaan
   *       500:
   *         description: Server error
   */
  app.get('/api/dashboard/activities', isAuthenticated, getUserProfile, async (req: any, res) => {
    try {
      const companyId = req.userProfile?.companyId;
      const role = req.userProfile?.role;
      const employeeId = req.userProfile?.employeeId;
      
      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      let activities;
      if (role === 'employee' && employeeId) {
        // Employee-specific activities
        activities = await dbStorage.getEmployeeRecentActivities(employeeId, companyId);
      } else {
        // Admin/HR company-wide activities
        activities = await dbStorage.getRecentActivities(companyId);
      }
      
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get('/api/dashboard/ai-insights', isAuthenticated, getUserProfile, async (req: any, res) => {
    try {
      const companyId = req.userProfile?.companyId;
      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const insights = await dbStorage.getAIInsights(companyId);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching AI insights:", error);
      res.status(500).json({ message: "Failed to fetch AI insights" });
    }
  });

  // Employee Profile API
  app.get('/api/employee/profile', isAuthenticated, getUserProfile, async (req: any, res) => {
    try {
      const employeeId = req.userProfile?.employeeId;
      const role = req.userProfile?.role;
      
      if (role !== 'employee' || !employeeId) {
        return res.status(403).json({ message: "Access denied. Employee only." });
      }

      const employee = await dbStorage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const profile = {
        id: employee.id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.personalEmail || employee.workEmail || '',
        phone: employee.phone || '',
        position: employee.position,
        department: 'IT Department',
        hireDate: employee.hireDate,
        salary: Number(employee.basicSalary) || 5000000,
        status: employee.status,
        address: employee.homeAddress || '',
        emergencyContact: typeof employee.emergencyContact === 'object' && employee.emergencyContact ? 
          (employee.emergencyContact as any).name || '' : '',
        emergencyPhone: typeof employee.emergencyContact === 'object' && employee.emergencyContact ? 
          (employee.emergencyContact as any).phone || '' : '',
      };

      res.json(profile);
    } catch (error) {
      console.error("Error fetching employee profile:", error);
      res.status(500).json({ message: "Failed to fetch employee profile" });
    }
  });

  // Employee Payroll History API
  app.get('/api/employee/payroll-history', isAuthenticated, getUserProfile, async (req: any, res) => {
    try {
      const employeeId = req.userProfile?.employeeId;
      const role = req.userProfile?.role;
      
      if (role !== 'employee' || !employeeId) {
        return res.status(403).json({ message: "Access denied. Employee only." });
      }

      const payrollHistory = await dbStorage.getEmployeePayrollHistory(employeeId);
      res.json(payrollHistory);
    } catch (error) {
      console.error("Error fetching payroll history:", error);
      res.status(500).json({ message: "Failed to fetch payroll history" });
    }
  });

  // Employee Payroll Slip Download API
  app.get('/api/employee/payroll/:payrollId/download', isAuthenticated, getUserProfile, async (req: any, res) => {
    try {
      const { payrollId } = req.params;
      const employeeId = req.userProfile?.employeeId;
      const role = req.userProfile?.role;
      

      
      if (role !== 'employee' || !employeeId) {
        return res.status(403).json({ message: "Access denied. Employee only." });
      }

      // Get payroll record and verify it belongs to the employee
      const payroll = await dbStorage.getPayrollById(parseInt(payrollId));
      if (!payroll || payroll.employeeId !== employeeId) {
        return res.status(404).json({ message: "Payroll record not found or access denied" });
      }

      // Get employee details for the slip
      const employee = await dbStorage.getEmployee(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Generate PDF slip
      const { generatePayrollSlipPDF } = await import('./pdfGenerator');
      const pdfBuffer = await generatePayrollSlipPDF(payroll, employee);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="slip-gaji-${payroll.period}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error downloading payroll slip:", error);
      res.status(500).json({ message: "Failed to download payroll slip" });
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
  app.get('/api/employees', isAuthenticated, getUserProfile, async (req: any, res) => {
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
        employees = await dbStorage.getEmployees(companyId);
      } else {
        // Employee hanya bisa lihat data mereka sendiri
        if (!employeeId) {
          return res.status(403).json({ message: "Employee profile not found" });
        }
        const employee = await dbStorage.getEmployee(employeeId);
        employees = employee ? [employee] : [];
      }

      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post('/api/employees', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const companyId = req.userProfile?.companyId;

      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const validatedData = insertEmployeeSchema.parse({
        ...req.body,
        companyId: companyId,
      });
      
      const employee = await dbStorage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.get('/api/employees/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Check if this is actually an employee ID string (like "EMP003")
      if (id.startsWith('EMP') || isNaN(parseInt(id))) {
        const employee = await dbStorage.getEmployeeByEmployeeId(id);
        
        if (!employee) {
          return res.status(404).json({ message: "Employee not found" });
        }
        
        return res.json(employee);
      }
      
      // Handle numeric ID
      const employee = await dbStorage.getEmployee(parseInt(id));
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  /**
   * @swagger
   * /employees/{id}:
   *   put:
   *     summary: Update data karyawan
   *     tags: [Employees]
   *     security:
   *       - ReplitAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID karyawan
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
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
   *       200:
   *         description: Data karyawan berhasil diupdate
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Employee'
   *       400:
   *         description: Data tidak valid
   *       404:
   *         description: Karyawan tidak ditemukan
   *       500:
   *         description: Server error
   *   delete:
   *     summary: Hapus karyawan
   *     tags: [Employees]
   *     security:
   *       - ReplitAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID karyawan
   *     responses:
   *       200:
   *         description: Karyawan berhasil dihapus
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Employee deleted successfully"
   *       404:
   *         description: Karyawan tidak ditemukan
   *       500:
   *         description: Server error
   */
  app.put('/api/employees/:id', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertEmployeeSchema.partial().parse(req.body);
      
      const employee = await dbStorage.updateEmployee(parseInt(id), validatedData);
      res.json(employee);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete('/api/employees/:id', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      await dbStorage.deleteEmployee(parseInt(id));
      res.json({ message: "Employee deleted successfully" });
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  /**
   * @swagger
   * /attendance:
   *   get:
   *     summary: Mendapatkan data kehadiran karyawan
   *     tags: [Attendance]
   *     security:
   *       - ReplitAuth: []
   *     parameters:
   *       - in: query
   *         name: employeeId
   *         schema:
   *           type: integer
   *         description: ID karyawan spesifik (opsional)
   *     responses:
   *       200:
   *         description: Data kehadiran berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Attendance'
   *       400:
   *         description: User tidak terkait dengan perusahaan
   *       500:
   *         description: Server error
   */
  app.get('/api/attendance', (req: any, res) => {
    try {
      if (!req.session?.authUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const authUser = req.session.authUser;
      
      // For employee users, get their attendance data
      if (authUser.role === 'employee') {
        const { date } = req.query;
        const attendanceDate = date ? new Date(date as string) : new Date();
        
        // Return employee's own attendance for the date
        dbStorage.getEmployeeAttendance(authUser.employeeId, attendanceDate.toISOString().split('T')[0])
          .then(attendance => {
            res.json(attendance);
          })
          .catch(error => {
            console.error("Error fetching employee attendance:", error);
            res.status(500).json({ message: "Failed to fetch attendance" });
          });
      } else {
        // For admin/HR users, get all attendance data
        const { date, employeeId } = req.query;
        dbStorage.getAttendance(
          authUser.companyId,
          date as string,
          employeeId ? parseInt(employeeId as string) : undefined
        ).then(attendance => {
          res.json(attendance);
        }).catch(error => {
          console.error("Error fetching attendance:", error);
          res.status(500).json({ message: "Failed to fetch attendance" });
        });
      }
    } catch (error) {
      console.error("Error in attendance endpoint:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });



  /**
   * @swagger
   * /attendance/{id}/checkout:
   *   put:
   *     summary: Melakukan check-out kehadiran
   *     tags: [Attendance]
   *     security:
   *       - ReplitAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID record attendance
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - checkOut
   *             properties:
   *               checkOut:
   *                 type: string
   *                 format: date-time
   *                 description: Waktu check-out
   *               checkOutLocation:
   *                 type: string
   *                 description: Lokasi check-out
   *               checkOutPhoto:
   *                 type: string
   *                 description: Path foto check-out
   *     responses:
   *       200:
   *         description: Check-out berhasil
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Attendance'
   *       500:
   *         description: Server error
   */
  app.put('/api/attendance/:id/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { checkOut, checkOutLocation, checkOutPhoto } = req.body;
      
      const attendance = await dbStorage.checkOut(parseInt(id), {
        checkOut: new Date(checkOut),
        checkOutLocation,
        checkOutPhoto,
      });
      
      // Return clean JSON response without circular references
      return res.json({
        id: attendance.id,
        employeeId: attendance.employeeId,
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        checkInLocation: attendance.checkInLocation,
        checkOutLocation: attendance.checkOutLocation,
        status: attendance.status,
        message: "Check-out successful"
      });
    } catch (error) {
      console.error("Error recording check-out:", error);
      return res.status(500).json({ message: "Failed to record check-out" });
    }
  });

  // Attendance Statistics API
  app.get('/api/attendance/stats', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const companyId = req.userProfile?.companyId;
      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const { date } = req.query;
      const selectedDate = date || new Date().toISOString().split('T')[0];
      
      // Get all employees for the company
      const employees = await dbStorage.getEmployees(companyId);
      const totalEmployees = employees.length;
      
      // Get attendance records for the selected date
      const attendanceRecords = await dbStorage.getAttendance(companyId, selectedDate);
      
      // Calculate statistics
      const presentToday = attendanceRecords.filter((record: any) => record.status === 'present' || record.checkIn).length;
      const absentToday = totalEmployees - presentToday;
      const lateToday = attendanceRecords.filter((record: any) => record.status === 'late').length;
      
      // Calculate attendance rate
      const attendanceRate = totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0;
      
      // Calculate average working hours
      const workingHoursRecords = attendanceRecords.filter((record: any) => record.workingHours);
      const avgWorkingHours = workingHoursRecords.length > 0 
        ? workingHoursRecords.reduce((sum: number, record: any) => sum + parseFloat(record.workingHours || '0'), 0) / workingHoursRecords.length
        : 0;

      const stats = {
        totalEmployees,
        presentToday,
        absentToday,
        lateToday,
        attendanceRate,
        avgWorkingHours: Math.round(avgWorkingHours * 10) / 10
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching attendance statistics:", error);
      res.status(500).json({ message: "Failed to fetch attendance statistics" });
    }
  });

  // AI Insights for Attendance
  app.post('/api/attendance/ai-insights', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const companyId = req.userProfile?.companyId;
      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const { period } = req.body;
      
      // Get attendance data for analysis
      const attendanceRecords = await dbStorage.getAttendance(companyId, period);
      const employees = await dbStorage.getEmployees(companyId);
      
      // Generate AI insights using DeepSeek-like analysis
      const insights = await generateAttendanceInsights(attendanceRecords, employees, period);
      
      res.json(insights);
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ message: "Failed to generate AI insights" });
    }
  });

  // Payroll Statistics API
  app.get('/api/payroll/stats', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const companyId = req.userProfile?.companyId;
      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const { period } = req.query;
      const selectedPeriod = period || format(new Date(), "yyyy-MM");
      
      // Get payroll records for the period
      const payrollRecords = await dbStorage.getPayroll(companyId, selectedPeriod);
      
      // Calculate statistics
      const totalEmployees = await dbStorage.getEmployees(companyId).then(emp => emp.length);
      const totalGrossSalary = payrollRecords.reduce((sum, record) => 
        sum + parseFloat(record.basicSalary) + parseFloat(record.allowances) + parseFloat(record.overtimePay), 0
      );
      const totalNetSalary = payrollRecords.reduce((sum, record) => sum + parseFloat(record.netSalary), 0);
      const totalDeductions = payrollRecords.reduce((sum, record) => sum + parseFloat(record.deductions), 0);
      const totalTax = payrollRecords.reduce((sum, record) => sum + parseFloat(record.tax), 0);
      
      const processed = payrollRecords.filter(record => record.status === 'processed' || record.status === 'approved' || record.status === 'paid').length;
      const pending = payrollRecords.filter(record => record.status === 'draft' || record.status === 'pending').length;
      const paid = payrollRecords.filter(record => record.status === 'paid').length;

      const stats = {
        totalEmployees,
        totalGrossSalary,
        totalNetSalary,
        totalDeductions,
        totalTax,
        processed,
        pending,
        paid
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching payroll statistics:", error);
      res.status(500).json({ message: "Failed to fetch payroll statistics" });
    }
  });

  // Process Payroll API
  app.post('/api/payroll/process', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const companyId = req.userProfile?.companyId;
      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const { period, employeeIds } = req.body;
      
      // Calculate payroll for specified employees or all employees
      const payrollRecords = await dbStorage.calculatePayroll(companyId, period, employeeIds);
      
      res.json(payrollRecords);
    } catch (error) {
      console.error("Error processing payroll:", error);
      res.status(500).json({ message: "Failed to process payroll" });
    }
  });

  // Update Payroll Status API
  app.patch('/api/payroll/:id/status', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const [updatedPayroll] = await db
        .update(payroll)
        .set({ 
          status: status,
          updatedAt: new Date(),
          ...(status === 'processed' ? { processedAt: new Date() } : {})
        })
        .where(eq(payroll.id, parseInt(id)))
        .returning();
      
      res.json(updatedPayroll);
    } catch (error) {
      console.error("Error updating payroll status:", error);
      res.status(500).json({ message: "Failed to update payroll status" });
    }
  });

  // Add Overtime Hours API for Payroll
  app.patch('/api/payroll/:id/overtime', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { overtimeHours } = req.body;
      
      // Get employee data to calculate overtime rate based on their hourly rate
      const employeeData = await db
        .select()
        .from(payroll)
        .where(eq(payroll.id, parseInt(id)))
        .limit(1);
      
      if (employeeData.length === 0) {
        return res.status(404).json({ message: "Payroll record not found" });
      }
      
      // Calculate hourly rate from basic salary (assuming 8 hours/day, 22 working days/month)
      const basicSalary = parseFloat(employeeData[0].basicSalary);
      const hourlyRate = basicSalary / (8 * 22); // Monthly salary to hourly rate
      const overtimeMultiplier = 1.5; // 1.5x regular hourly rate for overtime
      const hourlyOvertimeRate = hourlyRate * overtimeMultiplier;
      const overtimePay = (overtimeHours * hourlyOvertimeRate).toString();
      
      const [updatedPayroll] = await db
        .update(payroll)
        .set({ 
          overtimePay: overtimePay,
          updatedAt: new Date()
        })
        .where(eq(payroll.id, parseInt(id)))
        .returning();
      
      // Recalculate net salary
      const currentBasicSalary = parseFloat(updatedPayroll.basicSalary);
      const allowances = parseFloat(updatedPayroll.allowances as string) || 0;
      const newOvertimePay = parseFloat(overtimePay);
      const deductions = parseFloat(updatedPayroll.deductions as string) || 0;
      const grossSalary = currentBasicSalary + allowances + newOvertimePay;
      const netSalary = grossSalary - deductions;
      
      // Update with recalculated values
      const [finalPayroll] = await db
        .update(payroll)
        .set({ 
          grossSalary: grossSalary.toString(),
          netSalary: netSalary.toString()
        })
        .where(eq(payroll.id, parseInt(id)))
        .returning();
      
      res.json(finalPayroll);
    } catch (error) {
      console.error("Error updating overtime hours:", error);
      res.status(500).json({ message: "Failed to update overtime hours" });
    }
  });

  // Add Overtime Hours API for Attendance
  app.patch('/api/attendance/:id/overtime', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { overtimeHours } = req.body;
      
      const [updatedAttendance] = await db
        .update(attendance)
        .set({ 
          overtimeHours: overtimeHours.toString(),
          updatedAt: new Date()
        })
        .where(eq(attendance.id, parseInt(id)))
        .returning();
      
      res.json(updatedAttendance);
    } catch (error) {
      console.error("Error updating overtime hours:", error);
      res.status(500).json({ message: "Failed to update overtime hours" });
    }
  });

  // Generate Payslip API
  app.get('/api/payroll/:id/payslip', isAuthenticated, getUserProfile, async (req: any, res) => {
    try {
      const { id } = req.params;
      const companyId = req.userProfile?.companyId;
      
      // Get payroll record with employee details
      const payrollRecord = await db
        .select()
        .from(payroll)
        .innerJoin(employees, eq(payroll.employeeId, employees.id))
        .where(and(
          eq(payroll.id, parseInt(id)),
          eq(employees.companyId, companyId)
        ))
        .limit(1);
      
      if (payrollRecord.length === 0) {
        return res.status(404).json({ message: "Payroll record not found" });
      }
      
      const record = {
        id: payrollRecord[0].payroll.id,
        employeeId: payrollRecord[0].payroll.employeeId,
        period: payrollRecord[0].payroll.period,
        basicSalary: payrollRecord[0].payroll.basicSalary,
        allowances: payrollRecord[0].payroll.allowances,
        overtimePay: payrollRecord[0].payroll.overtimePay,
        grossSalary: payrollRecord[0].payroll.grossSalary,
        deductions: payrollRecord[0].payroll.deductions,
        netSalary: payrollRecord[0].payroll.netSalary,
        status: payrollRecord[0].payroll.status,
        employee: {
          firstName: payrollRecord[0].employees.firstName,
          lastName: payrollRecord[0].employees.lastName,
          employeeId: payrollRecord[0].employees.employeeId,
          position: payrollRecord[0].employees.position,
          department: payrollRecord[0].employees.department,
        }
      };
      
      // Generate HTML payslip
      const payslipHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Slip Gaji - ${record.employee.firstName} ${record.employee.lastName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; }
        .slip-title { font-size: 18px; margin-top: 10px; }
        .employee-info { margin-bottom: 20px; }
        .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .salary-table th, .salary-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .salary-table th { background-color: #f2f2f2; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature-box { text-align: center; width: 200px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">TalentFlow.ai</div>
        <div class="slip-title">SLIP GAJI</div>
        <div>Periode: ${record.period}</div>
    </div>
    
    <div class="employee-info">
        <table style="width: 100%;">
            <tr>
                <td><strong>Nama Karyawan:</strong></td>
                <td>${record.employee.firstName} ${record.employee.lastName}</td>
                <td><strong>ID Karyawan:</strong></td>
                <td>${record.employee.employeeId}</td>
            </tr>
            <tr>
                <td><strong>Jabatan:</strong></td>
                <td>${record.employee.position}</td>
                <td><strong>Departemen:</strong></td>
                <td>${record.employee.department || 'N/A'}</td>
            </tr>
        </table>
    </div>
    
    <table class="salary-table">
        <thead>
            <tr>
                <th>Keterangan</th>
                <th style="text-align: right;">Jumlah (Rp)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Gaji Pokok</td>
                <td style="text-align: right;">${formatCurrency(record.basicSalary)}</td>
            </tr>
            ${Object.entries(record.allowances as any || {}).map(([key, value]) => 
              `<tr><td>Tunjangan ${key}</td><td style="text-align: right;">${formatCurrency(value)}</td></tr>`
            ).join('')}
            <tr>
                <td>Uang Lembur</td>
                <td style="text-align: right;">${formatCurrency(record.overtimePay)}</td>
            </tr>
            <tr class="total-row">
                <td><strong>Total Kotor</strong></td>
                <td style="text-align: right;"><strong>${formatCurrency(record.grossSalary)}</strong></td>
            </tr>
            <tr>
                <td colspan="2"><strong>POTONGAN:</strong></td>
            </tr>
            <tr><td>BPJS Kesehatan</td><td style="text-align: right;">${formatCurrency((record.deductions as any)?.bpjsHealth || 0)}</td></tr>
            <tr><td>BPJS Ketenagakerjaan</td><td style="text-align: right;">${formatCurrency((record.deductions as any)?.bpjsEmployment || 0)}</td></tr>
            <tr><td>PPh21</td><td style="text-align: right;">${formatCurrency((record.deductions as any)?.tax || 0)}</td></tr>
            <tr class="total-row">
                <td><strong>Total Potongan</strong></td>
                <td style="text-align: right;"><strong>${formatCurrency((record.deductions as any)?.total || 0)}</strong></td>
            </tr>
            <tr class="total-row" style="background-color: #e8f5e8;">
                <td><strong>GAJI BERSIH</strong></td>
                <td style="text-align: right;"><strong>${formatCurrency(record.netSalary)}</strong></td>
            </tr>
        </tbody>
    </table>
    
    <div class="signature-section">
        <div class="signature-box">
            <p>Karyawan</p>
            <br><br><br>
            <p>_________________</p>
            <p>${record.employee.firstName} ${record.employee.lastName}</p>
        </div>
        <div class="signature-box">
            <p>HRD</p>
            <br><br><br>
            <p>_________________</p>
            <p>Dept. HRD</p>
        </div>
    </div>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(payslipHtml);
    } catch (error) {
      console.error("Error generating payslip:", error);
      res.status(500).json({ message: "Failed to generate payslip" });
    }
  });

  // AI Insights for Payroll
  app.post('/api/payroll/ai-insights', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const companyId = req.userProfile?.companyId;
      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const { period } = req.body;
      
      // Get payroll data for analysis
      const payrollRecords = await dbStorage.getPayroll(companyId, period);
      const employees = await dbStorage.getEmployees(companyId);
      
      // Generate AI insights using DeepSeek-like analysis
      const insights = await generatePayrollInsights(payrollRecords, employees, period);
      
      res.json(insights);
    } catch (error) {
      console.error("Error generating payroll AI insights:", error);
      res.status(500).json({ message: "Failed to generate payroll AI insights" });
    }
  });

  /**
   * @swagger
   * /leaves/{id}:
   *   put:
   *     summary: Update pengajuan cuti
   *     tags: [Leave]
   *     security:
   *       - ReplitAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID pengajuan cuti
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               leaveTypeId:
   *                 type: integer
   *               startDate:
   *                 type: string
   *                 format: date
   *               endDate:
   *                 type: string
   *                 format: date
   *               reason:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [pending, approved, rejected]
   *     responses:
   *       200:
   *         description: Pengajuan cuti berhasil diupdate
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LeaveRequest'
   *       400:
   *         description: Data tidak valid
   *       404:
   *         description: Pengajuan cuti tidak ditemukan
   *       500:
   *         description: Server error
   *   delete:
   *     summary: Hapus pengajuan cuti
   *     tags: [Leave]
   *     security:
   *       - ReplitAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID pengajuan cuti
   *     responses:
   *       200:
   *         description: Pengajuan cuti berhasil dihapus
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Leave request deleted successfully"
   *       404:
   *         description: Pengajuan cuti tidak ditemukan
   *       500:
   *         description: Server error
   * /leaves/{id}/approve:
   *   patch:
   *     summary: Approve pengajuan cuti
   *     tags: [Leave]
   *     security:
   *       - ReplitAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID pengajuan cuti
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               approverNotes:
   *                 type: string
   *                 description: Catatan dari approver
   *     responses:
   *       200:
   *         description: Pengajuan cuti berhasil diapprove
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LeaveRequest'
   *       404:
   *         description: Pengajuan cuti tidak ditemukan
   *       500:
   *         description: Server error
   * /leaves/{id}/reject:
   *   patch:
   *     summary: Reject pengajuan cuti
   *     tags: [Leave]
   *     security:
   *       - ReplitAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID pengajuan cuti
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - reason
   *             properties:
   *               reason:
   *                 type: string
   *                 description: Alasan penolakan
   *     responses:
   *       200:
   *         description: Pengajuan cuti berhasil ditolak
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LeaveRequest'
   *       404:
   *         description: Pengajuan cuti tidak ditemukan
   *       500:
   *         description: Server error
   * /leaves:
   *   get:
   *     summary: Mendapatkan daftar semua pengajuan cuti
   *     tags: [Leave]
   *     security:
   *       - ReplitAuth: []
   *     responses:
   *       200:
   *         description: Daftar pengajuan cuti berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/LeaveRequest'
   *       400:
   *         description: User tidak terkait dengan perusahaan
   *       500:
   *         description: Server error
   */
  app.get('/api/leaves', isAuthenticated, async (req: any, res) => {
    try {
      let companyId: string;
      
      // Handle both Replit auth and local auth
      if (req.session?.authUser) {
        // Local auth (employee/HR login)
        companyId = req.session.authUser.companyId;
      } else if (req.user?.claims?.sub) {
        // Replit auth
        const userId = req.user.claims.sub;
        const user = await dbStorage.getUser(userId);
        if (!user?.companyId) {
          return res.status(400).json({ message: "User not associated with company" });
        }
        companyId = user.companyId;
      } else {
        return res.status(401).json({ message: "Authentication required" });
      }

      const leaves = await dbStorage.getLeaveRequests(companyId);
      res.json(leaves);
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      res.status(500).json({ message: "Failed to fetch leave requests" });
    }
  });

  app.post('/api/leaves', isAuthenticated, async (req: any, res) => {
    try {
      const authUser = req.session?.authUser;
      
      // Check if user is authenticated through session or Replit auth
      let userId: string | null = null;
      let userCompanyId: string | null = null;
      
      if (authUser) {
        // Session-based authentication (HR/Employee login)
        if (authUser.role === 'employee') {
          // Employee can only create leave for themselves
          const employee = await dbStorage.getEmployeeByEmployeeId(authUser.employeeId);
          if (!employee) {
            return res.status(404).json({ message: "Employee record not found" });
          }
          
          // Override employeeId to ensure employee can only create leave for themselves
          req.body.employeeId = employee.id;
          userCompanyId = employee.companyId;
        } else if (authUser.role === 'hr' || authUser.role === 'admin') {
          // HR/Admin can create leave for any employee in their company
          const user = await dbStorage.getUserByEmail(authUser.email);
          if (!user) {
            return res.status(404).json({ message: "User not found" });
          }
          userCompanyId = user.companyId;
        }
      } else if (req.user?.claims?.sub) {
        // Replit auth
        userId = req.user.claims.sub;
        const user = await dbStorage.getUser(userId);
        if (!user?.companyId) {
          return res.status(400).json({ message: "User not associated with company" });
        }
        userCompanyId = user.companyId;
      } else {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Validate that the employee belongs to the same company
      const targetEmployee = await dbStorage.getEmployeeById(req.body.employeeId);
      if (!targetEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      if (targetEmployee.companyId !== userCompanyId) {
        return res.status(403).json({ message: "Cannot create leave request for employee from different company" });
      }

      const validatedData = insertLeaveRequestSchema.parse({
        ...req.body,
        status: 'pending', // Always start as pending
        createdAt: new Date().toISOString()
      });
      
      const leave = await dbStorage.createLeaveRequest(validatedData);
      
      // Fetch the leave with employee details for response
      const leaveWithEmployee = await dbStorage.getLeaveRequestById(leave.id);
      res.status(201).json(leaveWithEmployee);
    } catch (error) {
      console.error("Error creating leave request:", error);
      res.status(500).json({ message: "Failed to create leave request" });
    }
  });

  app.put('/api/leaves/:id/approve', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub || req.session?.authUser?.id;
      
      const leave = await dbStorage.approveLeaveRequest(parseInt(id), userId);
      res.json(leave);
    } catch (error) {
      console.error("Error approving leave request:", error);
      res.status(500).json({ message: "Failed to approve leave request" });
    }
  });

  app.put('/api/leaves/:id/reject', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const userId = req.user?.claims?.sub || req.session?.authUser?.id;
      
      const leave = await dbStorage.rejectLeaveRequest(parseInt(id), userId, rejectionReason);
      res.json(leave);
    } catch (error) {
      console.error("Error rejecting leave request:", error);
      res.status(500).json({ message: "Failed to reject leave request" });
    }
  });

  /**
   * @swagger
   * /payroll:
   *   get:
   *     summary: Mendapatkan data payroll karyawan
   *     tags: [Payroll]
   *     security:
   *       - ReplitAuth: []
   *     parameters:
   *       - in: query
   *         name: employeeId
   *         schema:
   *           type: integer
   *         description: ID karyawan spesifik (opsional)
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *         description: Period payroll (format YYYY-MM)
   *     responses:
   *       200:
   *         description: Data payroll berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Payroll'
   *       400:
   *         description: User tidak terkait dengan perusahaan
   *       500:
   *         description: Server error
   *   post:
   *     summary: Membuat payroll baru untuk karyawan
   *     tags: [Payroll]
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
   *               - period
   *               - basicSalary
   *               - grossSalary
   *               - netSalary
   *             properties:
   *               employeeId:
   *                 type: integer
   *               period:
   *                 type: string
   *               basicSalary:
   *                 type: string
   *               overtimePay:
   *                 type: string
   *               allowances:
   *                 type: object
   *               deductions:
   *                 type: object
   *               grossSalary:
   *                 type: string
   *               netSalary:
   *                 type: string
   *               bpjsHealth:
   *                 type: string
   *               bpjsEmployment:
   *                 type: string
   *               pph21:
   *                 type: string
   *     responses:
   *       201:
   *         description: Payroll berhasil dibuat
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Payroll'
   *       400:
   *         description: Data tidak valid
   *       500:
   *         description: Server error
   */
  app.get('/api/payroll', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await dbStorage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const { period } = req.query;
      const payroll = await dbStorage.getPayroll(user.companyId, period as string);
      res.json(payroll);
    } catch (error) {
      console.error("Error fetching payroll:", error);
      res.status(500).json({ message: "Failed to fetch payroll" });
    }
  });

  app.post('/api/payroll/calculate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await dbStorage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const { period, employeeId } = req.body;
      const payroll = await dbStorage.calculatePayroll(user.companyId, period, employeeId);
      res.json(payroll);
    } catch (error) {
      console.error("Error calculating payroll:", error);
      res.status(500).json({ message: "Failed to calculate payroll" });
    }
  });

  app.post('/api/payroll/:id/generate-slip', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const slipPath = await dbStorage.generatePayslip(parseInt(id));
      res.json({ slipPath });
    } catch (error) {
      console.error("Error generating payslip:", error);
      res.status(500).json({ message: "Failed to generate payslip" });
    }
  });

  /**
   * @swagger
   * /documents:
   *   get:
   *     summary: Mendapatkan daftar semua dokumen perusahaan
   *     tags: [Documents]
   *     security:
   *       - ReplitAuth: []
   *     responses:
   *       200:
   *         description: Daftar dokumen berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Document'
   *       400:
   *         description: User tidak terkait dengan perusahaan
   *       500:
   *         description: Server error
   *   post:
   *     summary: Upload dokumen baru
   *     tags: [Documents]
   *     security:
   *       - ReplitAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - type
   *               - filePath
   *             properties:
   *               title:
   *                 type: string
   *                 description: Judul dokumen
   *               type:
   *                 type: string
   *                 description: Jenis dokumen
   *               description:
   *                 type: string
   *                 description: Deskripsi dokumen
   *               filePath:
   *                 type: string
   *                 description: Path file dokumen
   *               employeeId:
   *                 type: integer
   *                 description: ID karyawan terkait (opsional)
   *     responses:
   *       201:
   *         description: Dokumen berhasil diupload
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Document'
   *       400:
   *         description: Data tidak valid
   *       500:
   *         description: Server error
   */
  app.get('/api/documents', isAuthenticated, getUserProfile, async (req: any, res) => {
    try {
      const companyId = req.userProfile?.companyId;

      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const documents = await dbStorage.getDocuments(companyId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  /**
   * @swagger
   * /documents/{id}:
   *   put:
   *     summary: Update dokumen
   *     tags: [Documents]
   *     security:
   *       - ReplitAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID dokumen
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               category:
   *                 type: string
   *               description:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [draft, approved, rejected]
   *     responses:
   *       200:
   *         description: Dokumen berhasil diupdate
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Document'
   *       400:
   *         description: Data tidak valid
   *       404:
   *         description: Dokumen tidak ditemukan
   *       500:
   *         description: Server error
   *   delete:
   *     summary: Hapus dokumen
   *     tags: [Documents]
   *     security:
   *       - ReplitAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID dokumen
   *     responses:
   *       200:
   *         description: Dokumen berhasil dihapus
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Document deleted successfully"
   *       404:
   *         description: Dokumen tidak ditemukan
   *       500:
   *         description: Server error
   */
  app.post('/api/documents', isAuthenticated, getUserProfile, async (req: any, res) => {
    try {
      const companyId = req.userProfile?.companyId;
      const userId = req.user?.claims?.sub || req.session?.authUser?.id;

      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      // Map frontend fields to backend schema
      const documentData = {
        name: req.body.title || req.body.name, // Frontend sends 'title', backend expects 'name'
        type: req.body.type,
        description: req.body.description,
        filePath: req.body.filePath,
        fileSize: req.body.fileSize,
        mimeType: req.body.mimeType,
        isTemplate: req.body.isTemplate || false,
        employeeId: req.body.employeeId,
        companyId: companyId,
        createdBy: String(userId),
      };

      const validatedData = insertDocumentSchema.parse(documentData);
      const document = await dbStorage.createDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  app.patch('/api/documents/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { signed } = req.body;
      const userId = req.user.claims.sub;
      
      const document = await dbStorage.updateDocumentStatus(parseInt(id), signed, userId);
      res.json(document);
    } catch (error) {
      console.error("Error updating document status:", error);
      res.status(500).json({ message: "Failed to update document status" });
    }
  });

  /**
   * @swagger
   * /reimbursements:
   *   get:
   *     summary: Mendapatkan daftar semua reimbursement
   *     tags: [Reimbursements]
   *     security:
   *       - ReplitAuth: []
   *     responses:
   *       200:
   *         description: Daftar reimbursement berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Reimbursement'
   *       400:
   *         description: User tidak terkait dengan perusahaan
   *       500:
   *         description: Server error
   *   post:
   *     summary: Membuat pengajuan reimbursement baru
   *     tags: [Reimbursements]
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
   *               - category
   *               - amount
   *               - description
   *               - date
   *             properties:
   *               employeeId:
   *                 type: integer
   *                 description: ID karyawan
   *               category:
   *                 type: string
   *                 description: Kategori reimbursement
   *               amount:
   *                 type: string
   *                 description: Jumlah reimbursement
   *               description:
   *                 type: string
   *                 description: Deskripsi pengeluaran
   *               receiptPhoto:
   *                 type: string
   *                 description: Path foto bukti pembayaran
   *               date:
   *                 type: string
   *                 format: date
   *                 description: Tanggal pengeluaran
   *     responses:
   *       201:
   *         description: Reimbursement berhasil dibuat
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Reimbursement'
   *       400:
   *         description: Data tidak valid
   *       500:
   *         description: Server error
   */
  app.get('/api/reimbursements', isAuthenticated, getUserProfile, async (req: any, res) => {
    try {
      const companyId = req.userProfile?.companyId;

      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const reimbursements = await dbStorage.getReimbursements(companyId);
      res.json(reimbursements);
    } catch (error) {
      console.error("Error fetching reimbursements:", error);
      res.status(500).json({ message: "Failed to fetch reimbursements" });
    }
  });

  app.post('/api/reimbursements', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertReimbursementSchema.parse(req.body);
      const reimbursement = await dbStorage.createReimbursement(validatedData);
      res.status(201).json(reimbursement);
    } catch (error) {
      console.error("Error creating reimbursement:", error);
      res.status(500).json({ message: "Failed to create reimbursement" });
    }
  });

  /**
   * @swagger
   * /reimbursements/{id}:
   *   put:
   *     summary: Update pengajuan reimbursement
   *     tags: [Reimbursements]
   *     security:
   *       - ReplitAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID reimbursement
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               description:
   *                 type: string
   *               amount:
   *                 type: string
   *               category:
   *                 type: string
   *               receiptUrl:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [pending, approved, rejected]
   *     responses:
   *       200:
   *         description: Reimbursement berhasil diupdate
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Reimbursement'
   *       400:
   *         description: Data tidak valid
   *       404:
   *         description: Reimbursement tidak ditemukan
   *       500:
   *         description: Server error
   *   delete:
   *     summary: Hapus pengajuan reimbursement
   *     tags: [Reimbursements]
   *     security:
   *       - ReplitAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID reimbursement
   *     responses:
   *       200:
   *         description: Reimbursement berhasil dihapus
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Reimbursement deleted successfully"
   *       404:
   *         description: Reimbursement tidak ditemukan
   *       500:
   *         description: Server error
   * /reimbursements/{id}/approve:
   *   patch:
   *     summary: Approve reimbursement
   *     tags: [Reimbursements]
   *     security:
   *       - ReplitAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID reimbursement
   *     responses:
   *       200:
   *         description: Reimbursement berhasil diapprove
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Reimbursement'
   *       404:
   *         description: Reimbursement tidak ditemukan
   *       500:
   *         description: Server error
   * /reimbursements/{id}/reject:
   *   patch:
   *     summary: Reject reimbursement
   *     tags: [Reimbursements]
   *     security:
   *       - ReplitAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID reimbursement
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               reason:
   *                 type: string
   *                 description: Alasan penolakan (opsional)
   *     responses:
   *       200:
   *         description: Reimbursement berhasil ditolak
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Reimbursement'
   *       404:
   *         description: Reimbursement tidak ditemukan
   *       500:
   *         description: Server error
   */
  app.patch('/api/reimbursements/:id/approve', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const reimbursement = await dbStorage.approveReimbursement(parseInt(id), userId);
      res.json(reimbursement);
    } catch (error) {
      console.error("Error approving reimbursement:", error);
      res.status(500).json({ message: "Failed to approve reimbursement" });
    }
  });

  app.patch('/api/reimbursements/:id/reject', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.claims.sub;
      
      const reimbursement = await dbStorage.rejectReimbursement(parseInt(id), userId, reason || "Tidak sesuai kebijakan");
      res.json(reimbursement);
    } catch (error) {
      console.error("Error rejecting reimbursement:", error);
      res.status(500).json({ message: "Failed to reject reimbursement" });
    }
  });

  /**
   * @swagger
   * /performance:
   *   get:
   *     summary: Mendapatkan daftar semua performance review
   *     tags: [Performance]
   *     security:
   *       - ReplitAuth: []
   *     responses:
   *       200:
   *         description: Daftar performance review berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/PerformanceReview'
   *       400:
   *         description: User tidak terkait dengan perusahaan
   *       500:
   *         description: Server error
   *   post:
   *     summary: Membuat performance review baru
   *     tags: [Performance]
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
   *               - period
   *               - targets
   *               - achievements
   *               - rating
   *               - reviewedBy
   *             properties:
   *               employeeId:
   *                 type: integer
   *                 description: ID karyawan yang direview
   *               period:
   *                 type: string
   *                 description: "Periode review (contoh: Q1 2024)"
   *               targets:
   *                 type: object
   *                 description: Target yang ditetapkan (JSON)
   *               achievements:
   *                 type: object
   *                 description: Pencapaian karyawan (JSON)
   *               rating:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 5
   *                 description: Rating performance (1-5)
   *               feedback:
   *                 type: string
   *                 description: Feedback dari reviewer
   *               reviewedBy:
   *                 type: integer
   *                 description: ID karyawan yang melakukan review
   *     responses:
   *       201:
   *         description: Performance review berhasil dibuat
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PerformanceReview'
   *       400:
   *         description: Data tidak valid
   *       500:
   *         description: Server error
   */
  app.get('/api/performance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await dbStorage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const performance = await dbStorage.getPerformanceReviews(user.companyId);
      res.json(performance);
    } catch (error) {
      console.error("Error fetching performance reviews:", error);
      res.status(500).json({ message: "Failed to fetch performance reviews" });
    }
  });

  app.post('/api/performance', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertPerformanceReviewSchema.parse(req.body);
      const performance = await dbStorage.createPerformanceReview(validatedData);
      res.status(201).json(performance);
    } catch (error) {
      console.error("Error creating performance review:", error);
      res.status(500).json({ message: "Failed to create performance review" });
    }
  });

  app.put('/api/performance/:id', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertPerformanceReviewSchema.partial().parse(req.body);
      const performance = await dbStorage.updatePerformanceReview(parseInt(id), validatedData);
      res.json(performance);
    } catch (error) {
      console.error("Error updating performance review:", error);
      res.status(500).json({ message: "Failed to update performance review" });
    }
  });

  /**
   * @swagger
   * /jobs:
   *   get:
   *     summary: Mendapatkan daftar semua lowongan kerja
   *     tags: [Jobs]
   *     security:
   *       - ReplitAuth: []
   *     responses:
   *       200:
   *         description: Daftar lowongan kerja berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Job'
   *       400:
   *         description: User tidak terkait dengan perusahaan
   *       500:
   *         description: Server error
   */
  app.get('/api/jobs', isAuthenticated, getUserProfile, async (req: any, res) => {
    try {
      const userProfile = req.userProfile;
      const companyId = userProfile?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const jobs = await dbStorage.getJobs(companyId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  /**
   * @swagger
   * /jobs:
   *   post:
   *     summary: Membuat lowongan kerja baru
   *     tags: [Jobs]
   *     security:
   *       - ReplitAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/InsertJob'
   *     responses:
   *       201:
   *         description: Lowongan berhasil dibuat
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Job'
   *       400:
   *         description: Data tidak valid
   *       500:
   *         description: Server error
   */
  app.post('/api/jobs', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const userProfile = req.userProfile;
      const companyId = userProfile?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const validatedData = insertJobSchema.parse({
        ...req.body,
        companyId: companyId,
        createdBy: userProfile.id,
      });
      
      const job = await dbStorage.createJob(validatedData);
      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating job:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid data provided", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  // Update job
  /**
   * @swagger
   * /jobs/{id}:
   *   put:
   *     summary: Update lowongan kerja
   *     tags: [Jobs]
   *     security:
   *       - ReplitAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID lowongan kerja
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               department:
   *                 type: string
   *               location:
   *                 type: string
   *               type:
   *                 type: string
   *               description:
   *                 type: string
   *               requirements:
   *                 type: string
   *               salaryMin:
   *                 type: string
   *               salaryMax:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [draft, active, closed]
   *               expiryDate:
   *                 type: string
   *                 format: date
   *     responses:
   *       200:
   *         description: Lowongan kerja berhasil diupdate
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Job'
   *       400:
   *         description: Data tidak valid
   *       404:
   *         description: Lowongan kerja tidak ditemukan
   *       500:
   *         description: Server error
   *   delete:
   *     summary: Hapus lowongan kerja
   *     tags: [Jobs]
   *     security:
   *       - ReplitAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID lowongan kerja
   *     responses:
   *       200:
   *         description: Lowongan kerja berhasil dihapus
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "Job deleted successfully"
   *       404:
   *         description: Lowongan kerja tidak ditemukan
   *       500:
   *         description: Server error
   */
  app.put('/api/jobs/:id', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await dbStorage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      // Verify job belongs to company
      const existingJob = await db
        .select()
        .from(jobs)
        .where(and(eq(jobs.id, parseInt(id)), eq(jobs.companyId, user.companyId)))
        .limit(1);

      if (existingJob.length === 0) {
        return res.status(404).json({ message: "Job not found" });
      }

      const updateData = {
        ...req.body,
        updatedAt: new Date()
      };

      const [updatedJob] = await db
        .update(jobs)
        .set(updateData)
        .where(eq(jobs.id, parseInt(id)))
        .returning();

      res.json(updatedJob);
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  // Delete job
  app.delete('/api/jobs/:id', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await dbStorage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      // Verify job belongs to company
      const existingJob = await db
        .select()
        .from(jobs)
        .where(and(eq(jobs.id, parseInt(id)), eq(jobs.companyId, user.companyId)))
        .limit(1);

      if (existingJob.length === 0) {
        return res.status(404).json({ message: "Job not found" });
      }

      await db.delete(jobs).where(eq(jobs.id, parseInt(id)));
      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Post job to external platforms
  app.post('/api/jobs/:id/post-external', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { platforms } = req.body; // array of platform names like ['jobstreet', 'indeed', 'linkedin']
      const userId = req.user.claims.sub;
      const user = await dbStorage.getUser(userId);
      
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      // Get job details
      const job = await db
        .select()
        .from(jobs)
        .where(and(eq(jobs.id, parseInt(id)), eq(jobs.companyId, user.companyId)))
        .limit(1);

      if (job.length === 0) {
        return res.status(404).json({ message: "Job not found" });
      }

      const jobData = job[0];
      const results = [];

      // Simulate posting to external platforms
      for (const platform of platforms) {
        try {
          // Here you would integrate with actual APIs like:
          // - JobStreet API
          // - Indeed API  
          // - LinkedIn Jobs API
          // - Glints API
          // - Karir.com API
          
          const postResult = await postToExternalPlatform(platform, jobData);
          results.push({
            platform,
            status: 'success',
            externalId: postResult.externalId,
            url: postResult.url
          });
        } catch (error) {
          results.push({
            platform,
            status: 'error',
            error: error.message
          });
        }
      }

      res.json({
        jobId: parseInt(id),
        results
      });
    } catch (error) {
      console.error("Error posting job to external platforms:", error);
      res.status(500).json({ message: "Failed to post job to external platforms" });
    }
  });

  /**
   * @swagger
   * /job-applications:
   *   get:
   *     summary: Mendapatkan daftar semua lamaran kerja
   *     tags: [Job Applications]
   *     security:
   *       - ReplitAuth: []
   *     responses:
   *       200:
   *         description: Daftar lamaran kerja berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/JobApplication'
   *       400:
   *         description: User tidak terkait dengan perusahaan
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  app.get('/api/job-applications', isAuthenticated, getUserProfile, async (req: any, res) => {
    try {
      const userProfile = req.userProfile;
      const companyId = userProfile?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const applications = await dbStorage.getJobApplications(companyId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching job applications:", error);
      res.status(500).json({ message: "Failed to fetch job applications" });
    }
  });

  /**
   * @swagger
   * /job-applications:
   *   post:
   *     summary: Membuat lamaran kerja baru dengan upload file
   *     tags: [Job Applications]
   *     security:
   *       - ReplitAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - jobId
   *               - applicantName
   *               - applicantEmail
   *             properties:
   *               jobId:
   *                 type: integer
   *                 description: ID lowongan kerja
   *               applicantName:
   *                 type: string
   *                 description: Nama lengkap pelamar
   *               applicantEmail:
   *                 type: string
   *                 format: email
   *                 description: Email pelamar
   *               applicantPhone:
   *                 type: string
   *                 description: Nomor telepon pelamar
   *               resume_file:
   *                 type: string
   *                 format: binary
   *                 description: File CV/Resume (PDF atau DOC)
   *               photo_file:
   *                 type: string
   *                 format: binary
   *                 description: Foto pelamar
   *               coverLetter:
   *                 type: string
   *                 description: Surat lamaran
   *     responses:
   *       201:
   *         description: Lamaran berhasil dibuat
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/JobApplication'
   *       400:
   *         description: Data tidak valid
   *       500:
   *         description: Server error
   */
  app.post('/api/job-applications', 
    isAuthenticated, 
    getUserProfile, 
    requireAdminOrHR,
    upload.fields([
      { name: 'resume_file', maxCount: 1 },
      { name: 'portfolio_file_0', maxCount: 1 },
      { name: 'portfolio_file_1', maxCount: 1 },
      { name: 'portfolio_file_2', maxCount: 1 },
      { name: 'photo_file', maxCount: 1 }
    ]),
    async (req: any, res) => {
      try {
        const userProfile = req.userProfile;
        const companyId = userProfile?.companyId;
        
        if (!companyId) {
          return res.status(400).json({ message: "User not associated with company" });
        }

        // Debug logging for file uploads
        console.log("Files received:", req.files);
        console.log("Body received:", req.body);

        // Handle file uploads
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        let resumePath = null;
        let portfolioPath = null;
        let photoPath = null;

        if (files.resume_file?.[0]) {
          const file = files.resume_file[0];
          resumePath = file.filename;
          console.log("Resume file uploaded:", {
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
          });
        }

        if (files.photo_file?.[0]) {
          const file = files.photo_file[0];
          photoPath = file.filename;
          console.log("Photo file uploaded:", {
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
          });
        }

        // Handle multiple portfolio files
        const portfolioFiles = [];
        for (let i = 0; i < 3; i++) {
          if (files[`portfolio_file_${i}`]?.[0]) {
            portfolioFiles.push(files[`portfolio_file_${i}`][0].filename);
          }
        }
        if (portfolioFiles.length > 0) {
          portfolioPath = portfolioFiles.join(',');
        }

        // Parse form data and create application
        const applicationData = {
          companyId: userProfile.companyId,
          applicantName: req.body.applicantName,
          applicantEmail: req.body.applicantEmail,
          applicantPhone: req.body.applicantPhone || null,
          jobId: req.body.jobId ? parseInt(req.body.jobId) : null,
          resumePath,
          portfolioPath,
          education: req.body.educationLevel ? JSON.stringify([{ level: req.body.educationLevel }]) : null,
          experience: req.body.experienceYears ? JSON.stringify([{ years: parseInt(req.body.experienceYears) }]) : null,
          stage: 'applied',
          status: 'pending',
          source: 'manual',
          createdBy: userProfile.id
        };

        console.log("Application data to create:", applicationData);
        
        const validatedData = insertJobApplicationSchema.parse(applicationData);
        const application = await dbStorage.createJobApplication(validatedData);
        res.status(201).json(application);
      } catch (error) {
        console.error("Error creating job application:", error);
        res.status(500).json({ message: "Failed to create job application" });
      }
    }
  );

  /**
   * @swagger
   * /job-applications/bulk-upload:
   *   post:
   *     summary: Upload massal lamaran kerja melalui file CSV atau PDF
   *     tags: [Job Applications]
   *     security:
   *       - ReplitAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: File CSV dengan data pelamar atau file PDF CV
   *     responses:
   *       200:
   *         description: File berhasil diproses
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/BulkUploadResult'
   *       400:
   *         description: File tidak valid atau tidak ada file yang diupload
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  // Bulk CV Upload API with AI extraction
  app.post('/api/job-applications/bulk-cv-upload',
    isAuthenticated,
    getUserProfile,
    requireAdminOrHR,
    upload.array('cv_file', 50), // Allow up to 50 CV files
    async (req: any, res) => {
      try {
        const userProfile = req.userProfile;
        const companyId = userProfile?.companyId;
        
        if (!companyId) {
          return res.status(400).json({ message: "User not associated with company" });
        }

        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ message: "No CV files uploaded" });
        }

        const files = req.files as Express.Multer.File[];
        const jobId = req.body.jobId ? parseInt(req.body.jobId) : null;

        let successCount = 0;
        let failedCount = 0;
        const results = [];

        // Process each CV file
        for (const file of files) {
          try {
            // Extract text from CV based on file type
            let extractedText = '';
            let applicantData: any = {};

            if (file.mimetype === 'application/pdf') {
              // For PDF files, we'll store the path and process later
              extractedText = `CV file: ${file.filename}`;
            } else if (file.mimetype.includes('document') || file.mimetype.includes('word')) {
              // For Word documents, we'll store the path and process later
              extractedText = `CV file: ${file.filename}`;
            }

            // Basic extraction from filename (common pattern: "Name_Position.pdf")
            const fileName = file.originalname.replace(/\.[^/.]+$/, ""); // Remove extension
            const nameParts = fileName.split(/[-_\s]+/);
            
            // Try to extract name from filename
            let applicantName = nameParts[0] || 'Unknown';
            if (nameParts.length > 1) {
              applicantName = `${nameParts[0]} ${nameParts[1]}`;
            }

            // Generate email from name if not provided
            const emailBase = applicantName.toLowerCase().replace(/\s+/g, '.');
            const applicantEmail = `${emailBase}@email.com`;

            applicantData = {
              companyId: companyId,
              jobId: jobId,
              applicantName: applicantName,
              applicantEmail: applicantEmail,
              resumePath: file.filename,
              resumeText: extractedText,
              stage: 'applied',
              status: 'pending',
              parsedResume: {
                fileName: file.originalname,
                extractedAt: new Date(),
                fileSize: file.size,
                mimeType: file.mimetype
              },
              createdAt: new Date(),
              updatedAt: new Date()
            };

            // Create application record
            const validatedData = insertJobApplicationSchema.parse(applicantData);
            const application = await dbStorage.createJobApplication(validatedData);
            
            successCount++;
            results.push({
              fileName: file.originalname,
              success: true,
              applicantName: applicantName,
              applicationId: application.id
            });

          } catch (error: any) {
            failedCount++;
            results.push({
              fileName: file.originalname,
              success: false,
              error: error.message
            });
            
            // Clean up failed file
            try {
              if (file.path) {
                fs.unlinkSync(file.path);
              }
            } catch (cleanupError) {
              console.error('Error cleaning up file:', cleanupError);
            }
          }
        }

        res.json({
          message: `Processed ${files.length} CV files`,
          successCount,
          failedCount,
          results
        });
      } catch (error) {
        console.error("Error processing CV uploads:", error);
        res.status(500).json({ message: "Failed to process CV uploads" });
      }
    }
  );

  app.post('/api/job-applications/bulk-upload',
    isAuthenticated,
    getUserProfile,
    requireAdminOrHR,
    upload.single('file'),
    async (req: any, res) => {
      try {
        const userProfile = req.userProfile;
        const companyId = userProfile?.companyId;
        
        if (!companyId) {
          return res.status(400).json({ message: "User not associated with company" });
        }

        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const fileExtension = path.extname(req.file.originalname).toLowerCase();
        let dataToProcess = [];
        
        if (fileExtension === '.pdf') {
          // For PDF files, create a basic entry that requires manual completion
          // This is a simplified approach until proper PDF parsing is implemented
          const fileName = req.file.originalname.replace(/\.[^/.]+$/, "");
          dataToProcess = [{
            applicant_name: fileName || 'PDF Upload',
            applicant_email: `${fileName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            applicant_phone: null,
            position_applied: null,
            experience_years: 0,
            education_level: null,
            skills: null,
            resume_text: `CV uploaded from PDF: ${req.file.originalname}`,
            stage: 'review',
            status: 'pending'
          }];
        } else if (fileExtension === '.csv' || fileExtension === '.xlsx' || fileExtension === '.xls') {
          // Process CSV/Excel file
          if (fileExtension === '.csv') {
            const csvContent = fs.readFileSync(req.file.path, 'utf-8');
            dataToProcess = parseCSV(csvContent);
          } else {
            // For Excel files, we'd need a library like xlsx
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: "Excel file processing not implemented yet. Please use CSV format." });
          }
        } else {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ message: "Unsupported file format. Please use PDF, CSV, or Excel files." });
        }

        if (dataToProcess.length === 0) {
          return res.status(400).json({ message: "No valid data found in file" });
        }

        let successCount = 0;
        let failedCount = 0;
        const errors = [];

        // Process each row/record
        for (const row of dataToProcess) {
          try {
            const applicationData = {
              companyId: companyId,
              applicantName: row.applicant_name || row.name,
              applicantEmail: row.applicant_email || row.email,
              applicantPhone: row.applicant_phone || row.phone || null,
              jobId: parseInt(row.job_id) || null,
              positionApplied: row.position_applied || null,
              experienceYears: parseInt(row.experience_years) || 0,
              educationLevel: row.education_level || null,
              skills: row.skills || null,
              resumeText: row.resume_text || null,
              coverLetter: row.cover_letter || null,
              stage: row.stage || 'review',
              status: row.status || 'pending',
              createdAt: new Date(),
              updatedAt: new Date()
            };

            // Validate required fields
            if (!applicationData.applicantName || !applicationData.applicantEmail) {
              throw new Error('Missing required fields: applicant_name, applicant_email');
            }

            const validatedData = insertJobApplicationSchema.parse(applicationData);
            await dbStorage.createJobApplication(validatedData);
            successCount++;
          } catch (error: any) {
            failedCount++;
            errors.push({
              row: row,
              error: error.message
            });
          }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
          success: successCount,
          failed: failedCount,
          errors: errors.slice(0, 10) // Limit error details to first 10
        });
      } catch (error) {
        console.error("Error processing bulk upload:", error);
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: "Failed to process bulk upload" });
      }
    }
  );

  // Update job application status
  app.patch('/api/job-applications/:id/status', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { stage, notes, interviewDate, offerAmount } = req.body;

      const updateData: any = { stage, updatedAt: new Date() };
      if (notes) updateData.notes = notes;
      if (interviewDate) updateData.interviewDate = new Date(interviewDate);
      if (offerAmount) updateData.offerAmount = offerAmount.toString();
      if (stage === 'hired') updateData.hiredDate = new Date();

      const [updatedApplication] = await db
        .update(jobApplications)
        .set(updateData)
        .where(eq(jobApplications.id, parseInt(id)))
        .returning();

      if (!updatedApplication) {
        return res.status(404).json({ message: "Application not found" });
      }

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating application status:", error);
      res.status(500).json({ message: "Failed to update application status" });
    }
  });

  // Update job status
  app.patch('/api/jobs/:id/status', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const [updatedJob] = await db
        .update(jobs)
        .set({ status, updatedAt: new Date() })
        .where(eq(jobs.id, parseInt(id)))
        .returning();

      if (!updatedJob) {
        return res.status(404).json({ message: "Job not found" });
      }

      res.json(updatedJob);
    } catch (error) {
      console.error("Error updating job status:", error);
      res.status(500).json({ message: "Failed to update job status" });
    }
  });

  // AI Integration API
  app.post('/api/ai/generate-insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await dbStorage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const insights = await dbStorage.generateAIInsights(user.companyId);
      res.json(insights);
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ message: "Failed to generate AI insights" });
    }
  });

  // Language Management Endpoints
  /**
   * @swagger
   * /languages:
   *   get:
   *     summary: Get supported languages list
   *     tags: [Settings]
   *     responses:
   *       200:
   *         description: Languages list retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 languages:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       code:
   *                         type: string
   *                         example: "id"
   *                       name:
   *                         type: string
   *                         example: "Indonesian"
   *                       nativeName:
   *                         type: string
   *                         example: "Bahasa Indonesia"
   *                       flag:
   *                         type: string
   *                         example: "🇮🇩"
   *                       currency:
   *                         type: string
   *                         example: "IDR"
   *                       region:
   *                         type: string
   *                         example: "Southeast Asia"
   */
  app.get('/api/languages', (req: any, res) => {
    try {
      const { SUPPORTED_LANGUAGES } = require('@shared/i18n');
      const languages = Object.entries(SUPPORTED_LANGUAGES).map(([code, config]: [string, any]) => ({
        code,
        ...config
      }));
      
      res.json({ languages });
    } catch (error) {
      console.error("Error fetching languages:", error);
      res.status(500).json({ message: "Failed to fetch languages" });
    }
  });

  /**
   * @swagger
   * /translations/{language}:
   *   get:
   *     summary: Get translations for specific language
   *     tags: [Settings]
   *     parameters:
   *       - in: path
   *         name: language
   *         required: true
   *         schema:
   *           type: string
   *           enum: [id, en, ms, th, vi, ph, zh, ja, ko, hi, ar, es, pt, fr, de, ru]
   *         description: Language code
   *     responses:
   *       200:
   *         description: Translations retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 language:
   *                   type: string
   *                 translations:
   *                   type: object
   *       404:
   *         description: Language not supported
   */
  app.get('/api/translations/:language', (req: any, res) => {
    try {
      const { language } = req.params;
      const { translations, SUPPORTED_LANGUAGES } = require('@shared/i18n');
      
      if (!SUPPORTED_LANGUAGES[language]) {
        return res.status(404).json({
          message: `Language ${language} not supported`
        });
      }
      
      const languageTranslations = translations[language];
      
      res.json({
        language,
        translations: languageTranslations
      });
    } catch (error) {
      console.error("Error fetching translations:", error);
      res.status(500).json({ message: "Failed to fetch translations" });
    }
  });

  /**
   * @swagger
   * /salary-components:
   *   get:
   *     summary: Mendapatkan daftar komponen gaji perusahaan
   *     tags: [Salary Components]
   *     security:
   *       - ReplitAuth: []
   *     responses:
   *       200:
   *         description: Daftar komponen gaji berhasil diambil
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/SalaryComponent'
   *       400:
   *         description: User tidak terkait dengan perusahaan
   *       500:
   *         description: Server error
   */
  app.get('/api/salary-components', isAuthenticated, getUserProfile, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await dbStorage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      const components = await dbStorage.getSalaryComponents(user.companyId);
      res.json(components);
    } catch (error) {
      console.error("Error fetching salary components:", error);
      res.status(500).json({ message: "Failed to fetch salary components" });
    }
  });

  app.post('/api/salary-components', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await dbStorage.getUser(userId);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with company" });
      }

      console.log("Received salary component data:", req.body);
      const validatedData = insertSalaryComponentSchema.parse({
        ...req.body,
        companyId: user.companyId,
      });
      console.log("Validated data:", validatedData);
      
      const component = await dbStorage.createSalaryComponent(validatedData);
      res.status(201).json(component);
    } catch (error) {
      console.error("Error creating salary component:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      res.status(500).json({ message: "Failed to create salary component", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put('/api/salary-components/:id', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertSalaryComponentSchema.partial().parse(req.body);
      const component = await dbStorage.updateSalaryComponent(parseInt(id), validatedData);
      res.json(component);
    } catch (error) {
      console.error("Error updating salary component:", error);
      res.status(500).json({ message: "Failed to update salary component" });
    }
  });

  app.delete('/api/salary-components/:id', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      await dbStorage.deleteSalaryComponent(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting salary component:", error);
      res.status(500).json({ message: "Failed to delete salary component" });
    }
  });

  // Employee Salary Components API
  app.get('/api/employee-salary-components/:employeeId', isAuthenticated, getUserProfile, async (req: any, res) => {
    try {
      const { employeeId } = req.params;
      const components = await dbStorage.getEmployeeSalaryComponents(parseInt(employeeId));
      res.json(components);
    } catch (error) {
      console.error("Error fetching employee salary components:", error);
      res.status(500).json({ message: "Failed to fetch employee salary components" });
    }
  });

  app.post('/api/employee-salary-components', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      console.log("Received employee salary component data:", req.body);
      const validatedData = insertEmployeeSalaryComponentSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      const component = await dbStorage.setEmployeeSalaryComponent(validatedData);
      res.status(201).json(component);
    } catch (error) {
      console.error("Error creating employee salary component:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }
      res.status(500).json({ message: "Failed to create employee salary component", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put('/api/employee-salary-components/:id', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertEmployeeSalaryComponentSchema.partial().parse(req.body);
      const component = await dbStorage.updateEmployeeSalaryComponent(parseInt(id), validatedData);
      res.json(component);
    } catch (error) {
      console.error("Error updating employee salary component:", error);
      res.status(500).json({ message: "Failed to update employee salary component" });
    }
  });

  app.delete('/api/employee-salary-components/:id', isAuthenticated, getUserProfile, requireAdminOrHR, async (req: any, res) => {
    try {
      const { id } = req.params;
      await dbStorage.deleteEmployeeSalaryComponent(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee salary component:", error);
      res.status(500).json({ message: "Failed to delete employee salary component" });
    }
  });

  // API to get platform integration status
  app.get('/api/platform-status', getUserProfile, requireAdminOrHR, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allPlatforms = ['jobstreet', 'indeed', 'linkedin', 'glints', 'kalibrr'];
      const configuredPlatforms = platformManager.getAvailablePlatforms();
      
      const status = allPlatforms.map(platform => ({
        platform,
        name: platform.charAt(0).toUpperCase() + platform.slice(1),
        configured: platformManager.isConfigured(platform),
        status: platformManager.isConfigured(platform) ? 'ready' : 'needs_api_key'
      }));

      res.json({
        platforms: status,
        totalPlatforms: allPlatforms.length,
        configuredCount: configuredPlatforms.length
      });
    } catch (error: any) {
      console.error('Platform status error:', error);
      res.status(500).json({ error: 'Failed to get platform status' });
    }
  });

  // API to get integration settings (placeholder - in production this would be from database)
  app.get('/api/integration-settings', getUserProfile, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // In production, this would fetch from database
      // For now, return empty object since we use environment variables
      res.json({});
    } catch (error: any) {
      console.error('Integration settings error:', error);
      res.status(500).json({ error: 'Failed to get integration settings' });
    }
  });

  // API to save integration settings (placeholder - in production this would save to database)
  app.post('/api/integration-settings', getUserProfile, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { platform, credentials } = req.body;
      
      // In production, this would save to database and update environment
      // For now, just return success message
      res.json({ 
        message: `Integration settings for ${platform} saved successfully. Please restart the application for changes to take effect.`,
        platform,
        saved: true
      });
    } catch (error: any) {
      console.error('Save integration settings error:', error);
      res.status(500).json({ error: 'Failed to save integration settings' });
    }
  });

  // API to test platform connection
  app.post('/api/test-integration/:platform', getUserProfile, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { platform } = req.params;
      
      if (!platformManager.isConfigured(platform)) {
        return res.status(400).json({ 
          error: `Platform ${platform} is not configured. Please add API credentials first.` 
        });
      }

      // Test connection by trying to get platform instance
      const platformInstance = platformManager.getPlatform(platform);
      if (platformInstance) {
        res.json({ 
          success: true, 
          message: `Connection to ${platform} is working`,
          platform 
        });
      } else {
        res.status(400).json({ 
          error: `Failed to connect to ${platform}. Please check your API credentials.` 
        });
      }
    } catch (error: any) {
      console.error('Test integration error:', error);
      res.status(500).json({ error: 'Failed to test platform connection' });
    }
  });

  /**
   * @swagger
   * /test-ai-matching:
   *   post:
   *     summary: Test analisis AI matching antara pelamar dan lowongan kerja
   *     tags: [AI Matching]
   *     security:
   *       - ReplitAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - applicationId
   *               - jobId
   *             properties:
   *               applicationId:
   *                 type: integer
   *                 description: ID lamaran kerja
   *               jobId:
   *                 type: integer
   *                 description: ID lowongan kerja
   *     responses:
   *       200:
   *         description: Analisis AI berhasil
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 analysis:
   *                   $ref: '#/components/schemas/AIMatchingResult'
   *                 application:
   *                   type: object
   *                   properties:
   *                     id: { type: integer }
   *                     name: { type: string }
   *                     email: { type: string }
   *                 job:
   *                   type: object
   *                   properties:
   *                     id: { type: integer }
   *                     title: { type: string }
   *                     department: { type: string }
   *       400:
   *         description: Parameter tidak lengkap
   *       404:
   *         description: Lamaran atau lowongan tidak ditemukan
   *       500:
   *         description: Error pada proses AI matching
   */
  app.post('/api/test-ai-matching', getUserProfile, requireAdminOrHR, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { applicationId, jobId } = req.body;
      
      if (!applicationId || !jobId) {
        return res.status(400).json({ error: 'Application ID and Job ID are required' });
      }

      // Get application and job data
      const application = await dbStorage.getJobApplication(applicationId);
      const jobs = await dbStorage.getJobs(req.userProfile!.companyId);
      const job = jobs.find(j => j.id === jobId);

      if (!application || !job) {
        return res.status(404).json({ error: 'Application or job not found' });
      }

      // Run AI analysis
      const analysisResult = await aiJobMatcher.analyzeApplicantJobCompatibility(application, job);
      
      res.json({
        success: true,
        analysis: analysisResult,
        application: {
          id: application.id,
          name: application.applicantName,
          email: application.applicantEmail
        },
        job: {
          id: job.id,
          title: job.title,
          department: job.department
        }
      });
    } catch (error: any) {
      console.error('AI matching test error:', error);
      res.status(500).json({ 
        error: 'Failed to test AI matching: ' + error.message,
        details: error.message 
      });
    }
  });

  /**
   * @swagger
   * /generate-interview-questions:
   *   post:
   *     summary: Generate pertanyaan interview menggunakan AI berdasarkan profil pelamar dan lowongan
   *     tags: [AI Matching]
   *     security:
   *       - ReplitAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - applicationId
   *               - jobId
   *             properties:
   *               applicationId:
   *                 type: integer
   *                 description: ID lamaran kerja
   *               jobId:
   *                 type: integer
   *                 description: ID lowongan kerja
   *     responses:
   *       200:
   *         description: Pertanyaan interview berhasil dibuat
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 questions:
   *                   type: array
   *                   items:
   *                     type: string
   *                   description: Daftar pertanyaan interview yang dibuat AI
   *       400:
   *         description: Parameter tidak lengkap
   *       404:
   *         description: Lamaran atau lowongan tidak ditemukan
   *       500:
   *         description: Error pada proses generate questions
   */
  app.post('/api/generate-interview-questions', getUserProfile, requireAdminOrHR, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { applicationId, jobId } = req.body;
      
      if (!applicationId || !jobId) {
        return res.status(400).json({ error: 'Application ID and Job ID are required' });
      }

      const application = await dbStorage.getJobApplication(applicationId);
      const jobs = await dbStorage.getJobs(req.userProfile!.companyId);
      const job = jobs.find(j => j.id === jobId);

      if (!application || !job) {
        return res.status(404).json({ error: 'Application or job not found' });
      }

      const questions = await aiJobMatcher.generateInterviewQuestions(application, job);
      
      res.json({
        success: true,
        questions,
        application: {
          id: application.id,
          name: application.applicantName
        },
        job: {
          id: job.id,
          title: job.title
        }
      });
    } catch (error: any) {
      console.error('Interview questions generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate interview questions: ' + error.message 
      });
    }
  });

  // Employee Attendance Endpoints
  app.get("/api/attendance", async (req: any, res) => {
    try {
      const { date } = req.query;
      const authUser = req.session?.authUser;
      
      if (!authUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      let targetDate: string;
      if (date) {
        targetDate = date as string;
      } else {
        targetDate = new Date().toISOString().split('T')[0];
      }

      if (authUser.role === 'employee') {
        // Employee can only see their own attendance
        const attendance = await dbStorage.getEmployeeAttendanceByDate(authUser.employeeId, targetDate);
        res.json(attendance ? [attendance] : []);
      } else {
        // HR/Admin can see all attendance for the date
        const attendance = await dbStorage.getAttendanceByDate(targetDate);
        res.json(attendance);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ error: "Failed to fetch attendance" });
    }
  });

  // Check-in endpoint with photo support
  app.post("/api/attendance/checkin", upload.single('photo'), async (req: any, res) => {
    try {
      if (!req.session?.authUser) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const authUser = req.session.authUser;
      
      if (authUser.role !== 'employee') {
        return res.status(403).json({ error: "Only employees can check in" });
      }

      const today = new Date().toISOString().split('T')[0];
      const checkInTime = new Date();

      // Get employee ID from database using employeeId string
      const employee = await dbStorage.getEmployeeByEmployeeId(authUser.employeeId);
      
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      // Check if already checked in today
      const existingAttendance = await dbStorage.getEmployeeAttendanceByDate(authUser.employeeId, today);
      if (existingAttendance && existingAttendance.checkIn) {
        return res.status(400).json({ error: "Already checked in today" });
      }

      // Handle photo upload
      let photoPath = null;
      if (req.file) {
        photoPath = req.file.filename;
      }

      const attendanceData = {
        employeeId: employee.id,
        date: today,
        checkIn: checkInTime,
        checkInLocation: req.body.location || 'Unknown location',
        checkInPhoto: photoPath,
        status: 'present' as const,
        createdAt: new Date(),
      };

      const attendance = await dbStorage.checkIn(attendanceData);
      
      return res.status(201).json({
        id: attendance.id,
        employeeId: attendance.employeeId,
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkInLocation: attendance.checkInLocation,
        checkInPhoto: attendance.checkInPhoto,
        status: attendance.status,
        message: "Check-in berhasil dengan foto verifikasi"
      });
    } catch (error) {
      console.error("Error during check-in:", error);
      return res.status(500).json({ error: "Failed to check in" });
    }
  });

  app.put("/api/attendance/:id/checkout", async (req: any, res) => {
    try {
      const { id } = req.params;
      const { checkOut, checkOutLocation } = req.body;
      const authUser = req.session?.authUser;
      
      if (!authUser || authUser.role !== 'employee') {
        return res.status(401).json({ error: "Only employees can check out" });
      }

      const attendance = await dbStorage.getAttendanceById(parseInt(id));
      if (!attendance) {
        return res.status(404).json({ error: "Attendance record not found" });
      }

      // Get employee to validate ownership
      const employee = await dbStorage.getEmployeeByEmployeeId(authUser.employeeId);
      if (!employee || attendance.employeeId !== employee.id) {
        return res.status(403).json({ error: "Can only check out your own attendance" });
      }

      if (attendance.checkOut) {
        return res.status(400).json({ error: "Already checked out" });
      }

      const checkOutTime = new Date(checkOut);
      const checkInTime = new Date(attendance.checkIn!);
      
      // Calculate working hours
      const workingMs = checkOutTime.getTime() - checkInTime.getTime();
      const workingHours = (workingMs / (1000 * 60 * 60)).toFixed(2);

      const updateData = {
        checkOut: checkOut,
        checkOutLocation: checkOutLocation || 'Unknown',
        workingHours: workingHours
      };

      const updatedAttendance = await dbStorage.updateAttendance(parseInt(id), updateData);
      res.json(updatedAttendance);
    } catch (error) {
      console.error("Error during check-out:", error);
      res.status(500).json({ error: "Failed to check out" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

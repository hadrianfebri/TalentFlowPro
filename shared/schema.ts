import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  bigint,
  boolean,
  date,
  time,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["admin", "hr", "employee"] }).default("employee"),
  employeeId: integer("employee_id").references(() => employees.id),
  companyId: varchar("company_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company/Organization table
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().notNull(),
  name: varchar("name").notNull(),
  address: text("address"),
  phone: varchar("phone"),
  email: varchar("email"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Departments table
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  companyId: varchar("company_id").notNull(),
  managerId: varchar("manager_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Employees table - Enhanced for Indonesian HR standards
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id").unique().notNull(),
  userId: varchar("user_id").unique(),
  companyId: varchar("company_id").notNull(),
  
  // Data Pribadi - Identitas Lengkap
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  birthPlace: varchar("birth_place"),
  birthDate: date("birth_date"),
  gender: varchar("gender"), // L, P
  maritalStatus: varchar("marital_status"), // single, married, divorced, widowed
  nationality: varchar("nationality").default("Indonesia"),
  religion: varchar("religion"), // Islam, Kristen, Katolik, Hindu, Buddha, Konghucu
  
  // Data Pribadi - Informasi Kontak
  homeAddress: text("home_address"),
  phone: varchar("phone"),
  personalEmail: varchar("personal_email"),
  workEmail: varchar("work_email").unique().notNull(),
  emergencyContact: jsonb("emergency_contact"), // {name, phone, relationship}
  
  // Data Pribadi - Data Identifikasi
  nik: varchar("nik").unique(), // Nomor Induk Kependudukan
  npwp: varchar("npwp"),
  bpjsHealthNumber: varchar("bpjs_health_number"),
  bpjsEmploymentNumber: varchar("bpjs_employment_number"),
  
  // Data Pribadi - Riwayat Pendidikan
  education: jsonb("education"), // {level, institution, major, graduationYear, gpa, certifications[]}
  
  // Data Pekerjaan
  position: varchar("position").notNull(),
  departmentId: integer("department_id"),
  hireDate: date("hire_date").notNull(),
  employmentStatus: varchar("employment_status").default("permanent"), // permanent, contract, internship, part_time
  workLocation: varchar("work_location"), // head_office, branch, remote, hybrid
  
  // Data Finansial
  basicSalary: decimal("basic_salary", { precision: 15, scale: 2 }),
  bankAccount: varchar("bank_account"),
  bankName: varchar("bank_name"),
  
  // Status & Meta
  status: varchar("status").default("active"), // active, inactive, terminated
  terminationDate: date("termination_date"),
  terminationReason: text("termination_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Attendance table
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  date: date("date").notNull(),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  checkInLocation: jsonb("check_in_location"), // GPS coordinates
  checkOutLocation: jsonb("check_out_location"),
  checkInPhoto: varchar("check_in_photo"),
  checkOutPhoto: varchar("check_out_photo"),
  workingHours: decimal("working_hours", { precision: 4, scale: 2 }),
  overtimeHours: decimal("overtime_hours", { precision: 4, scale: 2 }),
  status: varchar("status").default("present"), // present, absent, late, early_leave
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Leave types table
export const leaveTypes = pgTable("leave_types", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  companyId: varchar("company_id").notNull(),
  maxDays: integer("max_days"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
});

// Leave requests table
export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  leaveTypeId: integer("leave_type_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalDays: integer("total_days").notNull(),
  reason: text("reason"),
  status: varchar("status").default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  documents: jsonb("documents"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Salary Components table - for configurable salary components
export const salaryComponents = pgTable("salary_components", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id").notNull(),
  name: varchar("name").notNull(), // e.g., "Uang Makan", "Transport", "Bonus"
  code: varchar("code").notNull(), // e.g., "MEAL", "TRANSPORT", "BONUS"
  type: varchar("type").notNull(), // "allowance" or "deduction"
  category: varchar("category").notNull(), // "fixed", "variable", "benefit"
  isActive: boolean("is_active").default(true),
  description: text("description"),
  defaultAmount: decimal("default_amount", { precision: 15, scale: 2 }).default("0"),
  isTaxable: boolean("is_taxable").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employee Salary Components - individual employee component values
export const employeeSalaryComponents = pgTable("employee_salary_components", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  componentId: integer("component_id").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  effectiveDate: date("effective_date").notNull(),
  endDate: date("end_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payroll table
export const payroll = pgTable("payroll", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  period: varchar("period").notNull(), // YYYY-MM format
  basicSalary: decimal("basic_salary", { precision: 15, scale: 2 }).notNull(),
  overtimePay: decimal("overtime_pay", { precision: 15, scale: 2 }).default("0"),
  allowances: jsonb("allowances"), // detailed allowances breakdown
  deductions: jsonb("deductions"), // detailed deductions breakdown
  grossSalary: decimal("gross_salary", { precision: 15, scale: 2 }).notNull(),
  netSalary: decimal("net_salary", { precision: 15, scale: 2 }).notNull(),
  bpjsHealth: decimal("bpjs_health", { precision: 15, scale: 2 }).default("0"),
  bpjsEmployment: decimal("bpjs_employment", { precision: 15, scale: 2 }).default("0"),
  pph21: decimal("pph21", { precision: 15, scale: 2 }).default("0"),
  status: varchar("status").default("draft"), // draft, processed, paid
  processedAt: timestamp("processed_at"),
  paidAt: timestamp("paid_at"),
  slipGenerated: boolean("slip_generated").default(false),
  adjustments: jsonb("adjustments"), // manual adjustments for this period
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id"),
  companyId: varchar("company_id").notNull(),
  type: varchar("type").notNull(), // contract, letter, policy, etc.
  name: varchar("name").notNull(),
  description: text("description"),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type"),
  isTemplate: boolean("is_template").default(false),
  templateVariables: jsonb("template_variables"),
  signedBy: jsonb("signed_by"),
  signedAt: timestamp("signed_at"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reimbursement requests table
export const reimbursements = pgTable("reimbursements", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  category: varchar("category").notNull(), // transport, meal, medical, etc.
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description").notNull(),
  receiptPhoto: varchar("receipt_photo"),
  ocrData: jsonb("ocr_data"), // extracted text from receipt
  date: date("date").notNull(),
  status: varchar("status").default("pending"), // pending, approved, rejected, paid
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Performance reviews table
export const performanceReviews = pgTable("performance_reviews", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  period: varchar("period").notNull(), // YYYY-MM format
  targets: jsonb("targets"), // monthly targets
  achievements: jsonb("achievements"),
  rating: integer("rating"), // 1-5 scale
  feedback: text("feedback"),
  reviewedBy: integer("reviewed_by"),
  status: varchar("status").default("draft"), // draft, completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Recruitment jobs table
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id").notNull(),
  title: varchar("title").notNull(),
  departmentId: integer("department_id"),
  description: text("description"),
  requirements: text("requirements"),
  location: varchar("location"),
  salaryRange: varchar("salary_range"),
  type: varchar("type").default("full-time"), // full-time, part-time, contract
  status: varchar("status").default("active"), // active, inactive, closed
  openings: integer("openings").default(1),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job applications table
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  applicantName: varchar("applicant_name").notNull(),
  applicantEmail: varchar("applicant_email").notNull(),
  applicantPhone: varchar("applicant_phone"),
  applicantAddress: text("applicant_address"),
  dateOfBirth: date("date_of_birth"),
  gender: varchar("gender"),
  education: jsonb("education"), // Array of education history
  experience: jsonb("experience"), // Array of work experience
  skills: jsonb("skills"), // Array of skills
  certifications: jsonb("certifications"), // Array of certifications
  resumePath: varchar("resume_path"),
  portfolioPath: varchar("portfolio_path"),
  coverLetter: text("cover_letter"),
  expectedSalary: decimal("expected_salary", { precision: 15, scale: 2 }),
  availableStartDate: date("available_start_date"),
  parsedResume: jsonb("parsed_resume"), // AI extracted data
  aiMatchScore: decimal("ai_match_score", { precision: 5, scale: 2 }), // AI compatibility score
  aiAnalysis: jsonb("ai_analysis"), // Detailed AI analysis
  keywordScore: decimal("keyword_score", { precision: 5, scale: 2 }),
  stage: varchar("stage").default("applied"), // applied, screening, interview, offer, hired, rejected
  status: varchar("status").default("pending"), // pending, reviewed, shortlisted, rejected
  notes: text("notes"),
  interviewDate: timestamp("interview_date"),
  interviewNotes: text("interview_notes"),
  offerAmount: decimal("offer_amount", { precision: 15, scale: 2 }),
  hiredDate: date("hired_date"),
  rejectionReason: text("rejection_reason"),
  source: varchar("source").default("manual"), // manual, external_platform, referral
  referredBy: varchar("referred_by"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Applicant documents table for additional files
export const applicantDocuments = pgTable("applicant_documents", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  documentType: varchar("document_type").notNull(), // resume, portfolio, certificate, cover_letter, photo
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: bigint("file_size", { mode: "number" }),
  mimeType: varchar("mime_type"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Interview schedules table
export const interviewSchedules = pgTable("interview_schedules", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull(),
  type: varchar("type").notNull(), // screening, technical, hr, final
  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration").default(60), // minutes
  location: varchar("location"), // office address or online meeting link
  interviewers: jsonb("interviewers"), // Array of interviewer details
  status: varchar("status").default("scheduled"), // scheduled, completed, rescheduled, cancelled
  feedback: jsonb("feedback"), // Structured feedback from interviewers
  score: decimal("score", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reward wallet table
export const rewardWallet = pgTable("reward_wallet", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  companyId: varchar("company_id").notNull(),
  totalPoints: integer("total_points").default(0),
  monthlyPoints: integer("monthly_points").default(0),
  lastActivity: timestamp("last_activity"),
  achievements: jsonb("achievements"),
  streaks: jsonb("streaks"), // attendance streaks, etc.
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI insights table
export const aiInsights = pgTable("ai_insights", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id").notNull(),
  type: varchar("type").notNull(), // attendance_pattern, turnover_prediction, etc.
  title: varchar("title").notNull(),
  description: text("description"),
  severity: varchar("severity").default("medium"), // low, medium, high
  data: jsonb("data"), // supporting data
  actionTaken: boolean("action_taken").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Schema exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Local authentication schema
export const localAuth = pgTable("local_auth", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(), // hashed password
  role: varchar("role", { enum: ["admin", "hr", "employee"] }).notNull(),
  employeeId: varchar("employee_id").unique(),
  companyId: varchar("company_id").notNull(),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema for login forms
export const hrLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const employeeLoginSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  password: z.string().min(1, "Password is required"),
});

export type HRLoginInput = z.infer<typeof hrLoginSchema>;
export type EmployeeLoginInput = z.infer<typeof employeeLoginSchema>;
export type LocalAuth = typeof localAuth.$inferSelect;

export const insertCompanySchema = createInsertSchema(companies);
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
});
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;

export const insertPayrollSchema = createInsertSchema(payroll).omit({
  id: true,
  createdAt: true,
});
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type Payroll = typeof payroll.$inferSelect;

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export const insertReimbursementSchema = createInsertSchema(reimbursements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertReimbursement = z.infer<typeof insertReimbursementSchema>;
export type Reimbursement = typeof reimbursements.$inferSelect;

export const insertPerformanceReviewSchema = createInsertSchema(performanceReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPerformanceReview = z.infer<typeof insertPerformanceReviewSchema>;
export type PerformanceReview = typeof performanceReviews.$inferSelect;

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  aiMatchScore: true,
  aiAnalysis: true,
});
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;

export const insertApplicantDocumentSchema = createInsertSchema(applicantDocuments).omit({
  id: true,
  uploadedAt: true,
});
export type InsertApplicantDocument = z.infer<typeof insertApplicantDocumentSchema>;
export type ApplicantDocument = typeof applicantDocuments.$inferSelect;

export const insertInterviewScheduleSchema = createInsertSchema(interviewSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertInterviewSchedule = z.infer<typeof insertInterviewScheduleSchema>;
export type InterviewSchedule = typeof interviewSchedules.$inferSelect;

export type RewardWallet = typeof rewardWallet.$inferSelect;
export type AIInsight = typeof aiInsights.$inferSelect;

// Salary Components types
export const insertSalaryComponentSchema = createInsertSchema(salaryComponents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSalaryComponent = z.infer<typeof insertSalaryComponentSchema>;
export type SalaryComponent = typeof salaryComponents.$inferSelect;

// Employee Salary Components types
export const insertEmployeeSalaryComponentSchema = createInsertSchema(employeeSalaryComponents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEmployeeSalaryComponent = z.infer<typeof insertEmployeeSalaryComponentSchema>;
export type EmployeeSalaryComponent = typeof employeeSalaryComponents.$inferSelect;

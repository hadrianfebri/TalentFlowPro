CREATE TABLE "ai_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"severity" varchar DEFAULT 'medium',
	"data" jsonb,
	"action_taken" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"date" date NOT NULL,
	"check_in" timestamp,
	"check_out" timestamp,
	"check_in_location" jsonb,
	"check_out_location" jsonb,
	"check_in_photo" varchar,
	"check_out_photo" varchar,
	"working_hours" numeric(4, 2),
	"overtime_hours" numeric(4, 2),
	"status" varchar DEFAULT 'present',
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"address" text,
	"phone" varchar,
	"email" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"company_id" varchar NOT NULL,
	"manager_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"company_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"file_path" varchar NOT NULL,
	"file_size" integer,
	"mime_type" varchar,
	"is_template" boolean DEFAULT false,
	"template_variables" jsonb,
	"signed_by" jsonb,
	"signed_at" timestamp,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" varchar NOT NULL,
	"user_id" varchar,
	"company_id" varchar NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"birth_place" varchar,
	"birth_date" date,
	"gender" varchar,
	"marital_status" varchar,
	"nationality" varchar DEFAULT 'Indonesia',
	"religion" varchar,
	"home_address" text,
	"phone" varchar,
	"personal_email" varchar,
	"work_email" varchar NOT NULL,
	"emergency_contact" jsonb,
	"nik" varchar,
	"npwp" varchar,
	"bpjs_health_number" varchar,
	"bpjs_employment_number" varchar,
	"education" jsonb,
	"position" varchar NOT NULL,
	"department_id" integer,
	"hire_date" date NOT NULL,
	"employment_status" varchar DEFAULT 'permanent',
	"work_location" varchar,
	"basic_salary" numeric(15, 2),
	"bank_account" varchar,
	"bank_name" varchar,
	"status" varchar DEFAULT 'active',
	"termination_date" date,
	"termination_reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "employees_employee_id_unique" UNIQUE("employee_id"),
	CONSTRAINT "employees_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "employees_work_email_unique" UNIQUE("work_email"),
	CONSTRAINT "employees_nik_unique" UNIQUE("nik")
);
--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"applicant_name" varchar NOT NULL,
	"applicant_email" varchar NOT NULL,
	"applicant_phone" varchar,
	"resume_path" varchar,
	"cover_letter" text,
	"parsed_resume" jsonb,
	"keyword_score" numeric(5, 2),
	"stage" varchar DEFAULT 'applied',
	"notes" text,
	"interview_date" timestamp,
	"offer_amount" numeric(15, 2),
	"hired_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"department_id" integer,
	"description" text,
	"requirements" text,
	"location" varchar,
	"salary_range" varchar,
	"type" varchar DEFAULT 'full-time',
	"status" varchar DEFAULT 'active',
	"openings" integer DEFAULT 1,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"leave_type_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"total_days" integer NOT NULL,
	"reason" text,
	"status" varchar DEFAULT 'pending',
	"approved_by" integer,
	"approved_at" timestamp,
	"rejection_reason" text,
	"documents" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leave_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"company_id" varchar NOT NULL,
	"max_days" integer,
	"description" text,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "payroll" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"period" varchar NOT NULL,
	"basic_salary" numeric(15, 2) NOT NULL,
	"overtime_pay" numeric(15, 2) DEFAULT '0',
	"allowances" jsonb,
	"deductions" jsonb,
	"gross_salary" numeric(15, 2) NOT NULL,
	"net_salary" numeric(15, 2) NOT NULL,
	"bpjs_health" numeric(15, 2) DEFAULT '0',
	"bpjs_employment" numeric(15, 2) DEFAULT '0',
	"pph21" numeric(15, 2) DEFAULT '0',
	"status" varchar DEFAULT 'draft',
	"processed_at" timestamp,
	"paid_at" timestamp,
	"slip_generated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "performance_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"period" varchar NOT NULL,
	"targets" jsonb,
	"achievements" jsonb,
	"rating" integer,
	"feedback" text,
	"reviewed_by" integer,
	"status" varchar DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reimbursements" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"category" varchar NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"description" text NOT NULL,
	"receipt_photo" varchar,
	"ocr_data" jsonb,
	"date" date NOT NULL,
	"status" varchar DEFAULT 'pending',
	"approved_by" integer,
	"approved_at" timestamp,
	"rejection_reason" text,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reward_wallet" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"company_id" varchar NOT NULL,
	"total_points" integer DEFAULT 0,
	"monthly_points" integer DEFAULT 0,
	"last_activity" timestamp,
	"achievements" jsonb,
	"streaks" jsonb,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'employee',
	"employee_id" integer,
	"company_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");
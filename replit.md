# TalentWhiz.ai UMKM Essentials

## Overview

TalentWhiz.ai is a comprehensive HR cloud platform designed specifically for Indonesian SMEs (UMKM). It provides an all-in-one solution for human resource management with modern web technologies and AI-powered insights. The platform supports multiple languages and includes features for employee management, attendance tracking, payroll processing, leave management, document handling, reimbursements, performance reviews, and recruitment.

## Brand Guidelines

- **Logo**: TalentWhiz.ai positioned in top-left of sidebar
- **Typography**: Inter font (weights 400/600) with system-sans fallback
- **Color Scheme**: 
  - Primary forest: #2f4f2f
  - Secondary leaf: #519e51
  - Text contrast: #000 (black) & #FFF (white)
- **Visual Elements**: 
  - Sidebar with abstract leaf pattern (gradient green wave) + glass overlay
  - Thin borders (#2f4f2f, 1px) on cards and icons
  - Glass morphism effects with backdrop-blur and transparency

## System Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript, Vite for build tooling
- **Backend**: Node.js/Express with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with session-based authentication
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing

### Deployment Architecture
- **Development**: Replit environment with hot reload
- **Production**: Autoscale deployment with Neon database
- **Port Configuration**: Backend on port 5000, frontend served via Vite
- **File Storage**: Local file system for uploads and documents

## Key Components

### Frontend Architecture
- **Component Library**: shadcn/ui with Radix UI primitives
- **Layout System**: Sidebar navigation with header and main content area
- **State Management**: TanStack Query for API state, React Context for language preferences
- **Form Handling**: React Hook Form with Zod validation
- **Error Handling**: Error boundaries and centralized error handling
- **Internationalization**: Support for 16 languages including Indonesian, English, Arabic, Thai, etc.

### Backend Architecture
- **API Structure**: RESTful endpoints with Express.js
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Authentication**: Replit Auth integration with role-based access control (RBAC)
- **File Handling**: Multer for file uploads with local storage
- **API Documentation**: Swagger/OpenAPI integration
- **Session Management**: PostgreSQL-based session store

### Database Schema
The system uses 13 main tables:
- **Core**: users, companies, departments, employees
- **HR Operations**: attendance, leave_requests, payroll, documents
- **Additional Features**: reimbursements, performance_reviews, jobs, job_applications
- **AI/Analytics**: ai_insights, reward_wallet
- **Configuration**: salary_components, employee_salary_components

## Data Flow

### Authentication Flow
1. Users authenticate via Replit Auth or local HR/Employee login
2. Session stored in PostgreSQL sessions table
3. User roles (admin/hr/employee) determine access permissions
4. Middleware validates permissions for each API endpoint

### API Request Flow
1. Frontend makes requests through TanStack Query
2. Express middleware handles authentication and RBAC
3. Drizzle ORM processes database operations
4. Response formatting includes i18n support
5. Error handling with proper HTTP status codes

### File Upload Flow
1. Multer middleware processes file uploads
2. Files stored in local `/uploads` directory
3. File metadata stored in database
4. Static file serving for document access

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI components
- **wouter**: Lightweight routing
- **bcryptjs**: Password hashing for local auth

### Development Dependencies
- **vite**: Frontend build tool with HMR
- **typescript**: Type safety across the stack
- **tailwindcss**: Utility-first CSS framework
- **eslint/prettier**: Code quality tools

### Optional Integrations
- **DeepSeek AI**: AI-powered job matching and insights
- **Job Platform APIs**: Integration with JobStreet, Indeed, LinkedIn, Glints, Kalibrr

## Deployment Strategy

### Development Environment
- Replit-based development with automatic environment provisioning
- PostgreSQL database auto-provisioned via Replit
- Hot reload for both frontend and backend
- Environment variables managed through Replit secrets

### Production Deployment
- **Build Process**: `npm run build` creates optimized production bundle
- **Start Command**: `npm run start` serves production build
- **Database**: PostgreSQL with connection pooling
- **File Storage**: Local filesystem (can be extended to cloud storage)
- **Scaling**: Replit autoscale deployment target

### Configuration Management
- Environment variables for database connection, API keys, session secrets
- Drizzle migrations for database schema management
- TypeScript compilation for type checking

## Recent Changes

- **June 24, 2025**: Fixed critical RBAC security vulnerabilities in employee access controls
  - ✅ Employee /api/employees now returns only their own data (not all company employees)
  - ✅ Employee /api/payroll now filtered to show only their own payroll records
  - ✅ Employee /api/reimbursements now filtered to show only their own reimbursements
  - ✅ Employee /api/jobs blocked with requireAdminOrHR middleware (403 access denied)
  - ✅ Employee /api/job-applications blocked with requireAdminOrHR middleware (403 access denied)
  - ✅ All admin/HR functions confirmed working: dashboard, employees, attendance, documents, recruitment
  - ✅ Employee can only access their permitted data: own profile, own attendance, own leave requests
  - ✅ Comprehensive RBAC testing completed - security vulnerabilities resolved

- **June 24, 2025**: Completed comprehensive AI-powered recruitment system
  - ✅ Implemented advanced AI-powered CV analysis using OpenAI GPT-4o
  - ✅ Created sophisticated job matching algorithm analyzing actual CV content
  - ✅ Fixed AI score display in Pipeline Pelamar (showing 57%, 81%, 85% scores)
  - ✅ Resolved CV download functionality with proper static file serving
  - ✅ Completed auto-employee creation when applicant status becomes "hired"
  - ✅ AI scoring analyzes 4 factors: Skills Match, Experience Match, Education Match, Cultural Fit
  - ✅ PDF text extraction working with pdfplumber and PyPDF2 fallback
  - ✅ Unified interface between Manajemen Pelamar and Pipeline Pelamar
  - ✅ Full recruitment pipeline: Applied → Screening → Interview → Offer → Hired → Auto-Employee

- **June 25, 2025**: Created unified applicant management system
  - Combined "Tambah Pelamar" and "Upload Pelamar" into single comprehensive interface
  - Added manual form input for individual applicant creation with file uploads
  - Implemented bulk CV upload functionality with automatic text extraction
  - Created smart filename parsing to extract applicant names from CV files
  - Added support for PDF and Word document processing
  - Enhanced UI with drag-and-drop interface for multiple file uploads
  - Integrated AI scoring display and application status management
  - Fixed job creation authentication issues across all recruitment endpoints

- **June 17, 2025**: Fixed reimbursement system and completed comprehensive RBAC implementation
  - Resolved reimbursement list display issue by adding getUserProfile middleware to reimbursement GET endpoint
  - Fixed document creation authentication issues by implementing getUserProfile middleware for both Replit Auth and session-based authentication
  - Fixed schema field mapping issue where frontend "title" field needed to map to backend "name" field
  - Implemented role-based access control for reimbursement approvals - employees cannot see or access approve/reject buttons
  - Added frontend role checking with `canApprove` condition for admin/HR only
  - Backend already secured with `requireAdminOrHR` middleware for approval endpoints
  - All major systems now work correctly for employee authentication: attendance, leave requests, documents, and reimbursements
  - Completed comprehensive RBAC implementation across entire platform with proper role separation
  - All employee and HR functionality fully operational with secure, role-based access controls

- **June 17, 2025**: Fixed leave request system and implemented proper role-based access control
  - Resolved "undefined undefined (undefined)" and "Loading employee data..." display issues
  - Simplified query logic to use working /api/employees endpoint
  - Updated employee data to show proper Indonesian names "Karyawan Aktif (EMP003)"
  - Implemented proper RBAC for leave approval system:
    - Employees can only view and create leave requests (no approve/reject buttons)
    - HR and Admin users can approve/reject leave requests
    - Added backend authorization middleware to approval endpoints
    - Prevents employees from approving their own requests via API calls
  - Leave request system fully secure and functional with proper role separation

- **June 16, 2025**: Completed employee attendance system with check-in/check-out buttons
  - Fixed circular JSON structure error in attendance check-in endpoint that was causing app crashes
  - Cleaned up excessive debug logging statements causing performance issues
  - Confirmed check-in and check-out buttons are fully implemented in employee attendance page:
    - Green "Check In Sekarang" button for daily check-in with GPS location
    - Outlined "Check Out Sekarang" button for end-of-day check-out
    - Automatic location detection using browser geolocation API
    - Loading states and proper error handling for both actions
    - Real-time attendance tracking with working hours calculation
  - Fixed server-side attendance endpoints to return clean JSON responses
  - Application now runs without errors on port 5000

- **June 16, 2025**: Fixed employee attendance system and role-based navigation
  - Resolved "Akses Terbatas" issue where employees couldn't access attendance page
  - Implemented role-based sidebar navigation showing different menu items for employees vs admin/HR
  - Fixed routing so employees are directed to `/employee-attendance` instead of `/attendance`
  - Completed full-stack employee attendance system with working check-in/check-out functionality
  - Successfully tested authentication flow with employee user (EMP003)
  - Removed debug logging after confirming system stability
  - Updated logout functionality to redirect users to appropriate login pages based on role

- **June 16, 2025**: Fixed translation system and authentication infrastructure
  - Resolved translation keys displaying instead of actual text on login pages
  - Updated LanguageContext.tsx to use complete translations from shared/i18n.ts
  - Created missing local_auth table for HR and employee authentication
  - Fixed schema validation errors in login system
  - Successfully implemented working authentication for both HR/Admin and Employee logins
  - Updated password hashing system with bcryptjs for security
  - Added comprehensive debugging and logging for authentication processes

- **June 15, 2025**: TalentWhiz.ai branding implementation and URL accessibility fixes
  - Updated color scheme to forest green (#2f4f2f) and leaf green (#519e51)
  - Implemented sidebar gradient background with glass morphism effects
  - Added TalentWhiz.ai logo and "UMKM Essentials" tagline to sidebar
  - Created brand utility CSS classes for consistent styling
  - Added logout functionality with proper button placement
  - Updated HR and employee login pages with complete TalentWhiz.ai branding:
    - Replaced generic icons with official TalentWhiz.ai logo
    - Applied consistent color scheme (forest green #2f4f2f, leaf green #519e51)
    - Added "UMKM Essentials" tagline to both login pages
    - Updated login button styling to match brand colors
    - Implemented gradient backgrounds for visual consistency
  - Fixed URL accessibility for admin and employee login pages:
    - Added clear navigation buttons on landing page header
    - Implemented multiple access points for both `/hr-login` and `/employee-login` URLs
    - Updated hero section with prominently displayed login buttons
    - Fixed all TalentWhiz.ai branding references throughout landing page
    - Added footer with consistent brand styling
  - Enhanced project documentation:
    - Added comprehensive local installation guide to README.md
    - Included step-by-step setup instructions for PostgreSQL database
    - Added environment variables configuration with examples
    - Documented troubleshooting steps for common development issues
    - Provided development tips and best practices for local development
  - Database migration and seeding scripts for local development:
    - Created `scripts/seed.ts` for populating development data
    - Created `scripts/clean.ts` for database cleanup
    - Created `scripts/migrate.ts` for manual migration execution
    - Added comprehensive database operations documentation
    - Implemented proper foreign key constraint handling in cleanup script

## Changelog

- June 15, 2025: Initial setup and TalentWhiz.ai branding implementation

## User Preferences

Preferred communication style: Simple, everyday language.
Technical appreciation: User appreciates comprehensive solutions and attention to detail.
Language: Indonesian interface preferred for HR system.

## AI Scoring System Details

### Completed AI Scoring Parameters:
- **Skills Match (0-100)**: Technical and soft skills compatibility
- **Experience Match (0-100)**: Work experience relevance and level  
- **Education Match (0-100)**: Educational background alignment
- **Cultural Fit (0-100)**: Adaptability and value alignment
- **Overall Score**: Weighted average with detailed breakdown

### Technology Stack:
- **AI Engine**: OpenAI GPT-4o with response_format: json_object
- **PDF Processing**: Python pdfplumber + PyPDF2 fallback
- **Text Analysis**: Semantic CV content analysis (not placeholder data)
- **Scoring Range**: 45-95% with intelligent fallbacks

### Integration Points:
- Manajemen Pelamar: Manual AI scoring with "Score AI" button
- Pipeline Pelamar: Displays AI scores with green badges
- Auto-employee creation: Seamless transition from hired applicant to employee record
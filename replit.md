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

- **June 15, 2025**: TalentWhiz.ai branding implementation
  - Updated color scheme to forest green (#2f4f2f) and leaf green (#519e51)
  - Implemented sidebar gradient background with glass morphism effects
  - Added TalentWhiz.ai logo and "UMKM Essentials" tagline
  - Created brand utility CSS classes for consistent styling
  - Added logout functionality with proper button placement

## Changelog

- June 15, 2025: Initial setup and TalentWhiz.ai branding implementation

## User Preferences

Preferred communication style: Simple, everyday language.
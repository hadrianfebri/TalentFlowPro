# TalentFlow.ai UMKM Essentials

Platform HR cloud all-in-one yang dirancang khusus untuk UMKM Indonesia dengan arsitektur microservices.

## Arsitektur Sistem

### Backend API (Node.js/Express)
- **Port**: 5000
- **Framework**: Express.js dengan TypeScript
- **Database**: PostgreSQL dengan Drizzle ORM
- **Authentication**: Replit Auth dengan session management
- **API Documentation**: Swagger UI tersedia di `/api/docs`

### Frontend (React)
- **Framework**: React dengan Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query
- **Routing**: Wouter

### Database Schema
- **PostgreSQL** dengan 13 tabel untuk fitur HR lengkap
- **ORM**: Drizzle dengan migrasi otomatis
- **Session Storage**: PostgreSQL session store

## Fitur Utama

### 1. Dashboard & Analytics
- Statistik real-time karyawan dan absensi
- AI Insights dengan integrasi DeepSeek API
- Activity feed dan notifikasi

### 2. Employee Management
- CRUD karyawan dengan validasi data
- Import/export data karyawan
- Struktur organisasi dan departemen

### 3. Attendance System
- Check-in/out dengan lokasi GPS
- Monitoring real-time kehadiran
- Laporan absensi bulanan

### 4. Payroll Management
- Perhitungan gaji otomatis dengan BPJS
- Generate slip gaji PDF
- Integrasi pajak PPh21

### 5. Leave Management
- Pengajuan cuti online
- Approval workflow
- Kalkulasi sisa cuti otomatis

### 6. Document Management
- Upload dan manage dokumen karyawan
- Template kontrak kerja
- Digital signature

### 7. Reimbursement
- Pengajuan reimburse dengan foto struk
- OCR untuk ekstraksi data otomatis
- Approval dan payment tracking

### 8. Performance Management
- Performance review berkala
- Goal setting dan tracking
- 360-degree feedback

### 9. Recruitment
- Job posting dan application tracking
- Resume parsing dengan AI
- Interview scheduling

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get user info
- `GET /api/login` - Login dengan Replit
- `GET /api/logout` - Logout user

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/activities` - Recent activities
- `GET /api/dashboard/ai-insights` - AI insights

### Employee Management
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
- `GET /api/employees/:id` - Get employee details
- `PUT /api/employees/:id` - Update employee

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance/checkin` - Check in
- `PUT /api/attendance/:id/checkout` - Check out

### Payroll
- `GET /api/payroll` - Get payroll records
- `POST /api/payroll/calculate` - Calculate payroll
- `GET /api/payroll/:id/slip` - Generate payslip

### Dan 20+ endpoint lainnya...

## Dokumentasi API

Akses dokumentasi Swagger lengkap di: **`/api/docs`**

## Teknologi

- **Backend**: Node.js, Express, TypeScript, Drizzle ORM
- **Frontend**: React, Vite, Tailwind CSS, TanStack Query
- **Database**: PostgreSQL
- **Authentication**: Replit Auth (OpenID Connect)
- **AI Integration**: DeepSeek API untuk insights
- **Deployment**: Replit dengan auto-scaling

## Keunggulan Arsitektur

1. **Microservices Ready**: Backend API terpisah dari frontend
2. **Scalable**: Dapat di-deploy independent
3. **Type-Safe**: Full TypeScript dari database hingga UI
4. **Modern Stack**: Menggunakan teknologi terbaru
5. **Indonesian Localized**: Sesuai kebutuhan UMKM Indonesia
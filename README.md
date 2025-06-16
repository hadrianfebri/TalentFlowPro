# TalentWhiz.ai UMKM Essentials

Platform HR cloud all-in-one yang dirancang khusus untuk UMKM Indonesia dengan arsitektur microservices dan AI-powered insights.

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

## Instalasi Lokal

### Persyaratan Sistem
- Node.js 18+ atau 20+
- PostgreSQL 13+
- npm atau yarn
- Git

### Langkah Instalasi

#### 1. Clone Repository
```bash
git clone <repository-url>
cd talentwhiz-ai
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Setup Database
Buat database PostgreSQL baru:
```sql
CREATE DATABASE talentwhiz_db;
CREATE USER talentwhiz_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE talentwhiz_db TO talentwhiz_user;
```

#### 4. Environment Variables
Buat file `.env` di root directory:
```env
# Database Configuration
DATABASE_URL="postgresql://talentwhiz_user:your_password@localhost:5432/talentwhiz_db"
PGHOST=localhost
PGPORT=5432
PGUSER=talentwhiz_user
PGPASSWORD=your_password
PGDATABASE=talentwhiz_db

# Session Configuration
SESSION_SECRET="your-super-secret-session-key-min-32-chars"

# Replit Auth (Opsional untuk development lokal)
REPL_ID="your-repl-id"
ISSUER_URL="https://replit.com/oidc"
REPLIT_DOMAINS="localhost:5000"

# AI Integration (Opsional)
DEEPSEEK_API_KEY="your-deepseek-api-key"

# Application
NODE_ENV=development
PORT=5000
```

#### 5. Database Setup
Setup database schema dan data:
```bash
# Push schema ke database (recommended untuk development)
npm run db:push

# Untuk production, generate dan jalankan migrasi:
npx drizzle-kit generate
npx drizzle-kit migrate
```

#### 6. Seed Data (Opsional)
Untuk data development dan testing:
```bash
# Bersihkan database terlebih dahulu (jika perlu)
npx tsx scripts/clean.ts

# Jalankan seeding data contoh
npx tsx scripts/seed.ts

# Atau gabungkan keduanya
npx tsx scripts/clean.ts && npx tsx scripts/seed.ts
```

#### 7. Start Development Server
```bash
# Start backend dan frontend bersamaan
npm run dev

# Atau jalankan terpisah
npm run dev:server  # Backend only (port 5000)
npm run dev:client  # Frontend only (port 3000)
```

### URL Akses Lokal

- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:5000/api
- **API Documentation**: http://localhost:5000/api/docs
- **HR Login**: http://localhost:5000/hr-login
- **Employee Login**: http://localhost:5000/employee-login

### Scripts Tambahan

```bash
# Build untuk production
npm run build

# Start production server
npm run start

# TypeScript check
npm run type-check

# Database operations
npm run db:studio     # Buka Drizzle Studio
npm run db:generate   # Generate migrasi baru
npm run db:drop       # Drop database

# Testing
npm run test
npm run test:watch
```

### Troubleshooting

#### Database Connection Error
```bash
# Pastikan PostgreSQL running
sudo systemctl start postgresql

# Check connection
psql -h localhost -U talentwhiz_user -d talentwhiz_db
```

#### Port Already in Use
```bash
# Kill process di port 5000
sudo lsof -ti:5000 | xargs kill -9

# Atau ganti port di .env
PORT=3001
```

#### Missing Dependencies
```bash
# Clear cache dan reinstall
rm -rf node_modules package-lock.json
npm install
```

### Development Tips

1. **Hot Reload**: Frontend dan backend mendukung hot reload
2. **TypeScript**: Semua error TypeScript harus resolved sebelum commit
3. **Database**: Gunakan Drizzle Studio untuk inspect database
4. **API Testing**: Gunakan Swagger UI di `/api/docs`
5. **Logging**: Check console untuk debug informasi

### Authentication Lokal

Untuk development lokal tanpa Replit Auth:
1. Gunakan HR/Employee login dengan kredensial default
2. Atau setup Replit Auth dengan REPL_ID dan domain localhost

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
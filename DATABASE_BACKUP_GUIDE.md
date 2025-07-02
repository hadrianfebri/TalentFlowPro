# Database Backup & Restore Guide - TalentWhiz.ai

## 📦 Available Backup Files

Terdapat 3 file backup yang telah dibuat:

1. **`database_backup.sql`** - Backup lengkap (struktur + data) - **49.7KB**
2. **`database_schema.sql`** - Hanya struktur tabel dan relasi
3. **`database_data.sql`** - Hanya data/konten tabel

## 🚀 Cara Restore Database

### Metode 1: Menggunakan Script Otomatis
```bash
./scripts/restore_database.sh
```

### Metode 2: Manual Restore
```bash
# Restore complete database
psql $DATABASE_URL < database_backup.sql

# Atau restore terpisah (schema dulu, lalu data)
psql $DATABASE_URL < database_schema.sql
psql $DATABASE_URL < database_data.sql
```

## 📋 Isi Database

Database berisi data lengkap untuk:

### 🏢 Master Data
- **Companies**: 1 perusahaan (contohUMKM)
- **Departments**: 4 departemen (IT, HR, Finance, Operations)
- **Users**: 1 admin user (Replit Auth)

### 👥 Employee Data
- **Employees**: 8 karyawan aktif
- **Local Auth**: Kredensial login untuk HR dan Employee

### 📊 HR Operations
- **Attendance**: Data kehadiran lengkap
- **Leave Requests**: Cuti dan izin karyawan
- **Payroll**: Data gaji dan komponen
- **Documents**: Dokumen HR dan karyawan
- **Reimbursements**: Pengajuan reimbursement

### 🎯 Advanced Features
- **Jobs**: Lowongan pekerjaan
- **Job Applications**: Data pelamar dengan AI scoring
- **Performance Reviews**: Evaluasi kinerja
- **AI Insights**: Data analitik AI
- **Reward Wallet**: Sistem reward dan poin

## 🔑 Login Credentials

### Admin/HR Login
```
Email: admin@contohUMKM.com
Password: admin123
```

### Employee Login
```
Employee ID: EMP003
Password: emp123
```

### HR Login
```
Email: hr@contohUMKM.com
Password: admin123
```

## 🎨 Features Included

✅ **Complete RBAC System** - Role-based access control
✅ **AI-Powered CV Analysis** - GPT-4.1 integration
✅ **Recruitment Pipeline** - From application to hiring
✅ **Payroll Management** - Complete salary processing
✅ **Attendance Tracking** - Check-in/out system
✅ **Document Management** - File uploads and organization
✅ **Multi-language Support** - 16+ languages
✅ **Modern UI/UX** - Dark theme with neon accents

## 📝 Deployment Notes

1. Pastikan `DATABASE_URL` environment variable sudah di-set
2. Install dependencies: `npm install`
3. Restore database: `./scripts/restore_database.sh`
4. Start server: `npm run dev`
5. Access aplikasi di: `http://localhost:5000`

## 🔧 Troubleshooting

### Jika restore gagal:
```bash
# Drop semua tabel terlebih dahulu
npm run db:clean

# Lalu restore ulang
./scripts/restore_database.sh
```

### Jika ada error permissions:
```bash
chmod +x scripts/restore_database.sh
```

---

**Dibuat pada**: 2 Juli 2025  
**Database Size**: ~50KB  
**Total Records**: 100+ entries across all tables
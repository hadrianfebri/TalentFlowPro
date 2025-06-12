import { SupportedLanguage, getTranslation } from '@shared/i18n';

// Middleware untuk mendeteksi bahasa dari request
export function detectLanguage(req: any): SupportedLanguage {
  // 1. Check query parameter
  if (req.query.lang && isValidLanguage(req.query.lang)) {
    return req.query.lang as SupportedLanguage;
  }
  
  // 2. Check custom header
  const langHeader = req.headers['x-language'];
  if (langHeader && isValidLanguage(langHeader)) {
    return langHeader as SupportedLanguage;
  }
  
  // 3. Check Accept-Language header
  const acceptLanguage = req.headers['accept-language'];
  if (acceptLanguage) {
    const languages = acceptLanguage.split(',').map(lang => {
      const [code] = lang.trim().split(';');
      return code.toLowerCase();
    });
    
    for (const lang of languages) {
      // Direct match
      if (isValidLanguage(lang)) {
        return lang as SupportedLanguage;
      }
      
      // Match by language code (e.g., 'en-US' -> 'en')
      const langCode = lang.split('-')[0];
      if (isValidLanguage(langCode)) {
        return langCode as SupportedLanguage;
      }
    }
  }
  
  // 4. Default based on region (for Asian countries default to 'id', others to 'en')
  return 'id';
}

function isValidLanguage(lang: string): boolean {
  const validLanguages = ['id', 'en', 'ms', 'th', 'vi', 'ph', 'zh', 'ja', 'ko', 'hi', 'ar', 'es', 'pt', 'fr', 'de', 'ru'];
  return validLanguages.includes(lang);
}

// Helper untuk response message dengan i18n
export function createI18nResponse(language: SupportedLanguage) {
  return {
    success: (key: string = 'messages.success') => getTranslation(language, key),
    error: (key: string = 'messages.error') => getTranslation(language, key),
    notFound: (resource: string) => getTranslation(language, 'messages.error') + `: ${resource} not found`,
    created: (resource: string) => `${resource} ` + getTranslation(language, 'messages.dataCreated'),
    updated: (resource: string) => `${resource} ` + getTranslation(language, 'messages.dataUpdated'),
    deleted: (resource: string) => `${resource} ` + getTranslation(language, 'messages.dataDeleted'),
    loading: () => getTranslation(language, 'messages.loading'),
    noData: () => getTranslation(language, 'messages.noData'),
    t: (key: string) => getTranslation(language, key)
  };
}

// API Response messages dalam berbagai bahasa
export const API_MESSAGES = {
  id: {
    auth: {
      loginRequired: 'Login diperlukan untuk mengakses resource ini',
      insufficientPermission: 'Izin tidak mencukupi untuk melakukan tindakan ini',
      invalidCredentials: 'Kredensial tidak valid',
      sessionExpired: 'Sesi telah berakhir, silakan login kembali'
    },
    employee: {
      created: 'Karyawan berhasil dibuat',
      updated: 'Data karyawan berhasil diperbarui',
      deleted: 'Karyawan berhasil dihapus',
      notFound: 'Karyawan tidak ditemukan',
      emailExists: 'Email sudah digunakan oleh karyawan lain'
    },
    attendance: {
      checkedIn: 'Berhasil check-in',
      checkedOut: 'Berhasil check-out',
      alreadyCheckedIn: 'Anda sudah check-in hari ini',
      notCheckedIn: 'Anda belum check-in hari ini',
      invalidLocation: 'Lokasi tidak valid untuk check-in'
    },
    leave: {
      requested: 'Pengajuan cuti berhasil dibuat',
      approved: 'Cuti berhasil disetujui',
      rejected: 'Cuti ditolak',
      cancelled: 'Pengajuan cuti dibatalkan',
      notFound: 'Pengajuan cuti tidak ditemukan',
      overlapping: 'Tanggal cuti bertabrakan dengan cuti yang sudah ada'
    },
    payroll: {
      generated: 'Payroll berhasil dibuat',
      updated: 'Payroll berhasil diperbarui',
      slipGenerated: 'Slip gaji berhasil dibuat',
      notFound: 'Data payroll tidak ditemukan'
    },
    reimbursement: {
      submitted: 'Pengajuan reimbursement berhasil dibuat',
      approved: 'Reimbursement disetujui',
      rejected: 'Reimbursement ditolak',
      notFound: 'Pengajuan reimbursement tidak ditemukan'
    },
    document: {
      uploaded: 'Dokumen berhasil diunggah',
      updated: 'Dokumen berhasil diperbarui',
      deleted: 'Dokumen berhasil dihapus',
      notFound: 'Dokumen tidak ditemukan',
      invalidFormat: 'Format file tidak didukung'
    },
    performance: {
      created: 'Performance review berhasil dibuat',
      updated: 'Performance review berhasil diperbarui',
      completed: 'Performance review selesai',
      notFound: 'Performance review tidak ditemukan'
    },
    job: {
      created: 'Lowongan kerja berhasil dibuat',
      updated: 'Lowongan kerja berhasil diperbarui',
      published: 'Lowongan kerja berhasil dipublikasikan',
      closed: 'Lowongan kerja ditutup',
      notFound: 'Lowongan kerja tidak ditemukan'
    },
    application: {
      submitted: 'Lamaran berhasil dikirim',
      updated: 'Status lamaran berhasil diperbarui',
      shortlisted: 'Pelamar berhasil masuk shortlist',
      rejected: 'Lamaran ditolak',
      notFound: 'Lamaran tidak ditemukan'
    }
  },
  en: {
    auth: {
      loginRequired: 'Login required to access this resource',
      insufficientPermission: 'Insufficient permission to perform this action',
      invalidCredentials: 'Invalid credentials',
      sessionExpired: 'Session expired, please login again'
    },
    employee: {
      created: 'Employee created successfully',
      updated: 'Employee data updated successfully',
      deleted: 'Employee deleted successfully',
      notFound: 'Employee not found',
      emailExists: 'Email already used by another employee'
    },
    attendance: {
      checkedIn: 'Successfully checked in',
      checkedOut: 'Successfully checked out',
      alreadyCheckedIn: 'You have already checked in today',
      notCheckedIn: 'You have not checked in today',
      invalidLocation: 'Invalid location for check-in'
    },
    leave: {
      requested: 'Leave request created successfully',
      approved: 'Leave approved successfully',
      rejected: 'Leave request rejected',
      cancelled: 'Leave request cancelled',
      notFound: 'Leave request not found',
      overlapping: 'Leave dates overlap with existing leave'
    },
    payroll: {
      generated: 'Payroll generated successfully',
      updated: 'Payroll updated successfully',
      slipGenerated: 'Payslip generated successfully',
      notFound: 'Payroll data not found'
    },
    reimbursement: {
      submitted: 'Reimbursement request submitted successfully',
      approved: 'Reimbursement approved',
      rejected: 'Reimbursement rejected',
      notFound: 'Reimbursement request not found'
    },
    document: {
      uploaded: 'Document uploaded successfully',
      updated: 'Document updated successfully',
      deleted: 'Document deleted successfully',
      notFound: 'Document not found',
      invalidFormat: 'File format not supported'
    },
    performance: {
      created: 'Performance review created successfully',
      updated: 'Performance review updated successfully',
      completed: 'Performance review completed',
      notFound: 'Performance review not found'
    },
    job: {
      created: 'Job posting created successfully',
      updated: 'Job posting updated successfully',
      published: 'Job posting published successfully',
      closed: 'Job posting closed',
      notFound: 'Job posting not found'
    },
    application: {
      submitted: 'Application submitted successfully',
      updated: 'Application status updated successfully',
      shortlisted: 'Applicant shortlisted successfully',
      rejected: 'Application rejected',
      notFound: 'Application not found'
    }
  }
};

// Helper untuk mendapatkan pesan API berdasarkan bahasa
export function getApiMessage(language: SupportedLanguage, category: string, key: string): string {
  const messages = API_MESSAGES[language] || API_MESSAGES.en;
  const categoryMessages = (messages as any)[category];
  
  if (categoryMessages && categoryMessages[key]) {
    return categoryMessages[key];
  }
  
  // Fallback ke English jika tidak ditemukan
  const englishMessages = API_MESSAGES.en;
  const englishCategoryMessages = (englishMessages as any)[category];
  
  if (englishCategoryMessages && englishCategoryMessages[key]) {
    return englishCategoryMessages[key];
  }
  
  return `Message not found: ${category}.${key}`;
}

// Middleware Express untuk menambahkan i18n helper ke request
export function i18nMiddleware(req: any, res: any, next: any) {
  const language = detectLanguage(req);
  req.language = language;
  req.i18n = createI18nResponse(language);
  req.getMessage = (category: string, key: string) => getApiMessage(language, category, key);
  next();
}
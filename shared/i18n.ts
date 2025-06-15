export type SupportedLanguage = 'id' | 'en' | 'ms' | 'th' | 'vi' | 'ph' | 'zh' | 'ja' | 'ko' | 'hi' | 'ar' | 'es' | 'pt' | 'fr' | 'de' | 'ru';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  currency: string;
  dateFormat: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  id: {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    flag: '🇮🇩',
    currency: 'IDR',
    dateFormat: 'DD/MM/YYYY',
    region: 'Southeast Asia'
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    region: 'Global'
  },
  ms: {
    code: 'ms',
    name: 'Malay',
    nativeName: 'Bahasa Melayu',
    flag: '🇲🇾',
    currency: 'MYR',
    dateFormat: 'DD/MM/YYYY',
    region: 'Southeast Asia'
  },
  th: {
    code: 'th',
    name: 'Thai',
    nativeName: 'ภาษาไทย',
    flag: '🇹🇭',
    currency: 'THB',
    dateFormat: 'DD/MM/YYYY',
    region: 'Southeast Asia'
  },
  vi: {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    currency: 'VND',
    dateFormat: 'DD/MM/YYYY',
    region: 'Southeast Asia'
  },
  ph: {
    code: 'ph',
    name: 'Filipino',
    nativeName: 'Filipino',
    flag: '🇵🇭',
    currency: 'PHP',
    dateFormat: 'MM/DD/YYYY',
    region: 'Southeast Asia'
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    currency: 'CNY',
    dateFormat: 'YYYY/MM/DD',
    region: 'East Asia'
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    currency: 'JPY',
    dateFormat: 'YYYY/MM/DD',
    region: 'East Asia'
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    currency: 'KRW',
    dateFormat: 'YYYY/MM/DD',
    region: 'East Asia'
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    region: 'South Asia'
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    currency: 'SAR',
    dateFormat: 'DD/MM/YYYY',
    region: 'Middle East'
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    region: 'Europe/Latin America'
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    currency: 'BRL',
    dateFormat: 'DD/MM/YYYY',
    region: 'Latin America'
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    region: 'Europe/Africa'
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    currency: 'EUR',
    dateFormat: 'DD.MM.YYYY',
    region: 'Europe'
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    currency: 'RUB',
    dateFormat: 'DD.MM.YYYY',
    region: 'Eastern Europe/Asia'
  }
};

export interface TranslationStrings {
  // Navigation & Common
  nav: {
    dashboard: string;
    employees: string;
    attendance: string;
    payroll: string;
    leaves: string;
    documents: string;
    reimbursements: string;
    performance: string;
    jobs: string;
    applications: string;
    settings: string;
    logout: string;
  };
  
  // Dashboard
  dashboard: {
    title: string;
    welcome: string;
    stats: {
      totalEmployees: string;
      presentToday: string;
      pendingLeaves: string;
      monthlyPayroll: string;
    };
    recentActivities: string;
    aiInsights: string;
  };
  
  // Employee Management
  employees: {
    title: string;
    addEmployee: string;
    editEmployee: string;
    deleteEmployee: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    hireDate: string;
    salary: string;
    status: string;
    actions: string;
  };
  
  // Attendance
  attendance: {
    title: string;
    checkIn: string;
    checkOut: string;
    status: string;
    location: string;
    today: string;
    thisWeek: string;
    thisMonth: string;
  };
  
  // Leave Management
  leaves: {
    title: string;
    requestLeave: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
    pending: string;
    approved: string;
    rejected: string;
    approve: string;
    reject: string;
  };
  
  // Payroll
  payroll: {
    title: string;
    generatePayroll: string;
    period: string;
    basicSalary: string;
    allowances: string;
    deductions: string;
    grossSalary: string;
    netSalary: string;
    downloadSlip: string;
  };
  
  // Login & Authentication
  login: {
    hr: {
      title: string;
      subtitle: string;
      description: string;
    };
    employee: {
      title: string;
      subtitle: string;
      description: string;
    };
    email: {
      label: string;
      placeholder: string;
    };
    employee_id: {
      label: string;
      placeholder: string;
    };
    password: {
      label: string;
      placeholder: string;
    };
    submit: string;
    signing_in: string;
    success: {
      title: string;
      description: string;
    };
    error: {
      title: string;
      description: string;
    };
    switch: {
      employee_question: string;
      employee_login: string;
      hr_question: string;
      hr_login: string;
    };
  };

  // Common Actions
  actions: {
    save: string;
    cancel: string;
    edit: string;
    delete: string;
    view: string;
    download: string;
    upload: string;
    submit: string;
    approve: string;
    reject: string;
    search: string;
    filter: string;
    export: string;
  };
  
  // Messages
  messages: {
    success: string;
    error: string;
    loading: string;
    noData: string;
    confirmDelete: string;
    dataUpdated: string;
    dataCreated: string;
    dataDeleted: string;
  };
  
  // Forms
  forms: {
    required: string;
    invalidEmail: string;
    invalidPhone: string;
    passwordTooShort: string;
    passwordMismatch: string;
  };
}

export const translations: Record<SupportedLanguage, TranslationStrings> = {
  id: {
    nav: {
      dashboard: 'Dashboard',
      employees: 'Data Karyawan',
      attendance: 'Absensi & Timesheet',
      payroll: 'Payroll & Slip Gaji',
      leaves: 'Cuti & Izin',
      documents: 'Dokumen HR',
      reimbursements: 'Reimbursement',
      performance: 'Performance Review',
      jobs: 'Recruitment & Jobs',
      applications: 'Tambah Pelamar',
      settings: 'Pengaturan',
      logout: 'Keluar'
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Selamat Datang',
      stats: {
        totalEmployees: 'Total Karyawan',
        presentToday: 'Hadir Hari Ini',
        pendingLeaves: 'Cuti Pending',
        monthlyPayroll: 'Gaji Bulanan'
      },
      recentActivities: 'Aktivitas Terbaru',
      aiInsights: 'Wawasan AI'
    },
    employees: {
      title: 'Manajemen Karyawan',
      addEmployee: 'Tambah Karyawan',
      editEmployee: 'Edit Karyawan',
      deleteEmployee: 'Hapus Karyawan',
      employeeId: 'ID Karyawan',
      firstName: 'Nama Depan',
      lastName: 'Nama Belakang',
      email: 'Email',
      phone: 'Telepon',
      position: 'Posisi',
      department: 'Departemen',
      hireDate: 'Tanggal Masuk',
      salary: 'Gaji',
      status: 'Status',
      actions: 'Aksi'
    },
    attendance: {
      title: 'Kehadiran',
      checkIn: 'Check In',
      checkOut: 'Check Out',
      status: 'Status',
      location: 'Lokasi',
      today: 'Hari Ini',
      thisWeek: 'Minggu Ini',
      thisMonth: 'Bulan Ini'
    },
    leaves: {
      title: 'Manajemen Cuti',
      requestLeave: 'Ajukan Cuti',
      leaveType: 'Jenis Cuti',
      startDate: 'Tanggal Mulai',
      endDate: 'Tanggal Selesai',
      reason: 'Alasan',
      status: 'Status',
      pending: 'Menunggu',
      approved: 'Disetujui',
      rejected: 'Ditolak',
      approve: 'Setujui',
      reject: 'Tolak'
    },
    payroll: {
      title: 'Penggajian',
      generatePayroll: 'Buat Gaji',
      period: 'Periode',
      basicSalary: 'Gaji Pokok',
      allowances: 'Tunjangan',
      deductions: 'Potongan',
      grossSalary: 'Gaji Kotor',
      netSalary: 'Gaji Bersih',
      downloadSlip: 'Unduh Slip'
    },
    login: {
      hr: {
        title: 'Login HRD / Admin',
        subtitle: 'Portal Manajemen Sumber Daya Manusia',
        description: 'Masuk dengan akun HRD atau Admin untuk mengakses sistem manajemen karyawan'
      },
      employee: {
        title: 'Login Karyawan',
        subtitle: 'Portal Self-Service Karyawan',
        description: 'Masuk dengan ID karyawan untuk mengakses profil dan layanan personal'
      },
      email: {
        label: 'Email',
        placeholder: 'Masukkan email Anda'
      },
      employee_id: {
        label: 'ID Karyawan',
        placeholder: 'Masukkan ID karyawan Anda'
      },
      password: {
        label: 'Password',
        placeholder: 'Masukkan password Anda'
      },
      submit: 'Masuk',
      signing_in: 'Sedang masuk...',
      success: {
        title: 'Login Berhasil',
        description: 'Selamat datang! Anda akan diarahkan ke dashboard.'
      },
      error: {
        title: 'Login Gagal',
        description: 'Email/ID karyawan atau password tidak valid.'
      },
      switch: {
        employee_question: 'Anda seorang karyawan?',
        employee_login: 'Login sebagai Karyawan',
        hr_question: 'Anda bagian HRD/Admin?',
        hr_login: 'Login sebagai HRD/Admin'
      }
    },
    actions: {
      save: 'Simpan',
      cancel: 'Batal',
      edit: 'Edit',
      delete: 'Hapus',
      view: 'Lihat',
      download: 'Unduh',
      upload: 'Unggah',
      submit: 'Kirim',
      approve: 'Setujui',
      reject: 'Tolak',
      search: 'Cari',
      filter: 'Filter',
      export: 'Ekspor'
    },
    messages: {
      success: 'Berhasil',
      error: 'Terjadi kesalahan',
      loading: 'Memuat...',
      noData: 'Tidak ada data',
      confirmDelete: 'Apakah Anda yakin ingin menghapus?',
      dataUpdated: 'Data berhasil diperbarui',
      dataCreated: 'Data berhasil dibuat',
      dataDeleted: 'Data berhasil dihapus'
    },
    forms: {
      required: 'Field ini wajib diisi',
      invalidEmail: 'Email tidak valid',
      invalidPhone: 'Nomor telepon tidak valid',
      passwordTooShort: 'Password terlalu pendek',
      passwordMismatch: 'Password tidak sama'
    }
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      employees: 'Employees',
      attendance: 'Attendance',
      payroll: 'Payroll',
      leaves: 'Leaves',
      documents: 'Documents',
      reimbursements: 'Reimbursements',
      performance: 'Performance',
      jobs: 'Jobs',
      applications: 'Applications',
      settings: 'Settings',
      logout: 'Logout'
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome',
      stats: {
        totalEmployees: 'Total Employees',
        presentToday: 'Present Today',
        pendingLeaves: 'Pending Leaves',
        monthlyPayroll: 'Monthly Payroll'
      },
      recentActivities: 'Recent Activities',
      aiInsights: 'AI Insights'
    },
    employees: {
      title: 'Employee Management',
      addEmployee: 'Add Employee',
      editEmployee: 'Edit Employee',
      deleteEmployee: 'Delete Employee',
      employeeId: 'Employee ID',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      position: 'Position',
      department: 'Department',
      hireDate: 'Hire Date',
      salary: 'Salary',
      status: 'Status',
      actions: 'Actions'
    },
    attendance: {
      title: 'Attendance',
      checkIn: 'Check In',
      checkOut: 'Check Out',
      status: 'Status',
      location: 'Location',
      today: 'Today',
      thisWeek: 'This Week',
      thisMonth: 'This Month'
    },
    leaves: {
      title: 'Leave Management',
      requestLeave: 'Request Leave',
      leaveType: 'Leave Type',
      startDate: 'Start Date',
      endDate: 'End Date',
      reason: 'Reason',
      status: 'Status',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      approve: 'Approve',
      reject: 'Reject'
    },
    payroll: {
      title: 'Payroll',
      generatePayroll: 'Generate Payroll',
      period: 'Period',
      basicSalary: 'Basic Salary',
      allowances: 'Allowances',
      deductions: 'Deductions',
      grossSalary: 'Gross Salary',
      netSalary: 'Net Salary',
      downloadSlip: 'Download Slip'
    },
    login: {
      hr: {
        title: 'HR / Admin Login',
        subtitle: 'Human Resources Management Portal',
        description: 'Sign in with HR or Admin account to access employee management system'
      },
      employee: {
        title: 'Employee Login',
        subtitle: 'Employee Self-Service Portal',
        description: 'Sign in with your employee ID to access your profile and personal services'
      },
      email: {
        label: 'Email',
        placeholder: 'Enter your email'
      },
      employee_id: {
        label: 'Employee ID',
        placeholder: 'Enter your employee ID'
      },
      password: {
        label: 'Password',
        placeholder: 'Enter your password'
      },
      submit: 'Sign In',
      signing_in: 'Signing in...',
      success: {
        title: 'Login Successful',
        description: 'Welcome! You will be redirected to the dashboard.'
      },
      error: {
        title: 'Login Failed',
        description: 'Invalid email/employee ID or password.'
      },
      switch: {
        employee_question: 'Are you an employee?',
        employee_login: 'Login as Employee',
        hr_question: 'Are you HR/Admin?',
        hr_login: 'Login as HR/Admin'
      }
    },
    actions: {
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      view: 'View',
      download: 'Download',
      upload: 'Upload',
      submit: 'Submit',
      approve: 'Approve',
      reject: 'Reject',
      search: 'Search',
      filter: 'Filter',
      export: 'Export'
    },
    messages: {
      success: 'Success',
      error: 'An error occurred',
      loading: 'Loading...',
      noData: 'No data available',
      confirmDelete: 'Are you sure you want to delete?',
      dataUpdated: 'Data updated successfully',
      dataCreated: 'Data created successfully',
      dataDeleted: 'Data deleted successfully'
    },
    forms: {
      required: 'This field is required',
      invalidEmail: 'Invalid email address',
      invalidPhone: 'Invalid phone number',
      passwordTooShort: 'Password is too short',
      passwordMismatch: 'Passwords do not match'
    }
  },
  // Contoh untuk bahasa lain (akan diisi lengkap dengan pattern yang sama)
  ms: {
    nav: {
      dashboard: 'Papan Pemuka',
      employees: 'Pekerja',
      attendance: 'Kehadiran',
      payroll: 'Gaji',
      leaves: 'Cuti',
      documents: 'Dokumen',
      reimbursements: 'Tuntutan Balik',
      performance: 'Prestasi',
      jobs: 'Kerja',
      applications: 'Permohonan',
      settings: 'Tetapan',
      logout: 'Log Keluar'
    },
    dashboard: {
      title: 'Papan Pemuka',
      welcome: 'Selamat Datang',
      stats: {
        totalEmployees: 'Jumlah Pekerja',
        presentToday: 'Hadir Hari Ini',
        pendingLeaves: 'Cuti Tertunda',
        monthlyPayroll: 'Gaji Bulanan'
      },
      recentActivities: 'Aktiviti Terkini',
      aiInsights: 'Wawasan AI'
    },
    employees: {
      title: 'Pengurusan Pekerja',
      addEmployee: 'Tambah Pekerja',
      editEmployee: 'Edit Pekerja',
      deleteEmployee: 'Padam Pekerja',
      employeeId: 'ID Pekerja',
      firstName: 'Nama Pertama',
      lastName: 'Nama Akhir',
      email: 'E-mel',
      phone: 'Telefon',
      position: 'Jawatan',
      department: 'Jabatan',
      hireDate: 'Tarikh Gaji',
      salary: 'Gaji',
      status: 'Status',
      actions: 'Tindakan'
    },
    attendance: {
      title: 'Kehadiran',
      checkIn: 'Daftar Masuk',
      checkOut: 'Daftar Keluar',
      status: 'Status',
      location: 'Lokasi',
      today: 'Hari Ini',
      thisWeek: 'Minggu Ini',
      thisMonth: 'Bulan Ini'
    },
    leaves: {
      title: 'Pengurusan Cuti',
      requestLeave: 'Mohon Cuti',
      leaveType: 'Jenis Cuti',
      startDate: 'Tarikh Mula',
      endDate: 'Tarikh Tamat',
      reason: 'Sebab',
      status: 'Status',
      pending: 'Tertunda',
      approved: 'Diluluskan',
      rejected: 'Ditolak',
      approve: 'Luluskan',
      reject: 'Tolak'
    },
    payroll: {
      title: 'Gaji',
      generatePayroll: 'Jana Gaji',
      period: 'Tempoh',
      basicSalary: 'Gaji Asas',
      allowances: 'Elaun',
      deductions: 'Potongan',
      grossSalary: 'Gaji Kasar',
      netSalary: 'Gaji Bersih',
      downloadSlip: 'Muat Turun Slip'
    },
    actions: {
      save: 'Simpan',
      cancel: 'Batal',
      edit: 'Edit',
      delete: 'Padam',
      view: 'Lihat',
      download: 'Muat Turun',
      upload: 'Muat Naik',
      submit: 'Hantar',
      approve: 'Luluskan',
      reject: 'Tolak',
      search: 'Cari',
      filter: 'Tapis',
      export: 'Eksport'
    },
    messages: {
      success: 'Berjaya',
      error: 'Ralat berlaku',
      loading: 'Memuatkan...',
      noData: 'Tiada data',
      confirmDelete: 'Adakah anda pasti mahu memadam?',
      dataUpdated: 'Data berjaya dikemas kini',
      dataCreated: 'Data berjaya dicipta',
      dataDeleted: 'Data berjaya dipadam'
    },
    forms: {
      required: 'Medan ini diperlukan',
      invalidEmail: 'Alamat e-mel tidak sah',
      invalidPhone: 'Nombor telefon tidak sah',
      passwordTooShort: 'Kata laluan terlalu pendek',
      passwordMismatch: 'Kata laluan tidak sepadan'
    }
  },
  // Placeholder untuk bahasa lain - akan menggunakan fallback ke English
  th: {} as TranslationStrings,
  vi: {} as TranslationStrings,
  ph: {} as TranslationStrings,
  zh: {} as TranslationStrings,
  ja: {} as TranslationStrings,
  ko: {} as TranslationStrings,
  hi: {} as TranslationStrings,
  ar: {} as TranslationStrings,
  es: {} as TranslationStrings,
  pt: {} as TranslationStrings,
  fr: {} as TranslationStrings,
  de: {} as TranslationStrings,
  ru: {} as TranslationStrings
};

// Helper function untuk mendapatkan terjemahan dengan fallback ke English
export function getTranslation(language: SupportedLanguage, key: string): string {
  const keys = key.split('.');
  let translation: any = translations[language];
  
  // Jika bahasa tidak lengkap, fallback ke English
  if (!translation || Object.keys(translation).length === 0) {
    translation = translations.en;
  }
  
  for (const k of keys) {
    if (translation && typeof translation === 'object' && k in translation) {
      translation = translation[k];
    } else {
      // Fallback ke English jika key tidak ditemukan
      let fallback: any = translations.en;
      for (const fallbackKey of keys) {
        if (fallback && typeof fallback === 'object' && fallbackKey in fallback) {
          fallback = fallback[fallbackKey];
        } else {
          return key; // Return key sebagai last resort
        }
      }
      return fallback;
    }
  }
  
  return typeof translation === 'string' ? translation : key;
}

// Helper function untuk memformat currency berdasarkan bahasa
export function formatCurrency(amount: number, language: SupportedLanguage): string {
  const config = SUPPORTED_LANGUAGES[language];
  const formatter = new Intl.NumberFormat(language === 'en' ? 'en-US' : language, {
    style: 'currency',
    currency: config.currency,
  });
  return formatter.format(amount);
}

// Helper function untuk memformat tanggal berdasarkan bahasa
export function formatDate(date: Date, language: SupportedLanguage): string {
  const config = SUPPORTED_LANGUAGES[language];
  const formatter = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : language, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}
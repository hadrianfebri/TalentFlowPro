import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '@shared/i18n';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string) => string;
  availableLanguages: typeof SUPPORTED_LANGUAGES;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Enhanced translation function with better error handling
function getTranslation(language: SupportedLanguage, key: string): string {
  try {
    // Check if language exists in translations
    if (!translations[language]) {
      console.warn(`Language ${language} not found, falling back to Indonesian`);
      language = 'id';
    }

    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && value.hasOwnProperty(k)) {
        value = value[k];
      } else {
        // Fallback to Indonesian if translation not found
        console.warn(`Translation key ${key} not found for ${language}, using fallback`);
        let fallbackValue: any = translations['id'];
        for (const fallbackKey of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && fallbackValue.hasOwnProperty(fallbackKey)) {
            fallbackValue = fallbackValue[fallbackKey];
          } else {
            return key; // Return key if no translation found
          }
        }
        return typeof fallbackValue === 'string' ? fallbackValue : key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  } catch (error) {
    console.error(`Translation error for key ${key} in language ${language}:`, error);
    return key;
  }
}

// Basic translations for testing
const translations: Record<SupportedLanguage, any> = {
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
      statsError: 'Gagal memuat data statistik',
      totalEmployees: 'Total Karyawan',
      todayAttendance: 'Hadir Hari Ini',
      pendingLeaves: 'Cuti Pending',
      monthlyPayroll: 'Payroll Bulan Ini',
      recentActivities: 'Aktivitas Terbaru'
    }
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      employees: 'Employees',
      attendance: 'Attendance & Timesheet',
      payroll: 'Payroll & Pay Slips',
      leaves: 'Leave & Permissions',
      documents: 'HR Documents',
      reimbursements: 'Reimbursements',
      performance: 'Performance Review',
      jobs: 'Recruitment & Jobs',
      applications: 'Add Applicant',
      settings: 'Settings',
      logout: 'Logout'
    },
    dashboard: {
      statsError: 'Failed to load statistics',
      totalEmployees: 'Total Employees',
      todayAttendance: 'Today Attendance',
      pendingLeaves: 'Pending Leaves',
      monthlyPayroll: 'Monthly Payroll',
      recentActivities: 'Recent Activities'
    }
  },
  ms: {
    nav: {
      dashboard: 'Papan Pemuka',
      employees: 'Data Pekerja',
      attendance: 'Kehadiran & Timesheet',
      payroll: 'Gaji & Slip Gaji',
      leaves: 'Cuti & Kebenaran',
      documents: 'Dokumen HR',
      reimbursements: 'Tuntutan Balik',
      performance: 'Ulasan Prestasi',
      jobs: 'Pengambilan & Kerja',
      applications: 'Tambah Pemohon',
      settings: 'Tetapan',
      logout: 'Log Keluar'
    }
  },
  th: {
    nav: {
      dashboard: 'แดชบอร์ด',
      employees: 'ข้อมูลพนักงาน',
      attendance: 'การเข้างาน & ไทม์ชีต',
      payroll: 'เงินเดือน & สลิปเงินเดือน',
      leaves: 'การลา & การอนุญาต',
      documents: 'เอกสาร HR',
      reimbursements: 'การเบิกเงิน',
      performance: 'การประเมินผลงาน',
      jobs: 'การสรรหา & งาน',
      applications: 'เพิ่มผู้สมัคร',
      settings: 'การตั้งค่า',
      logout: 'ออกจากระบบ'
    }
  },
  vi: {
    nav: {
      dashboard: 'Bảng Điều Khiển',
      employees: 'Dữ Liệu Nhân Viên',
      attendance: 'Chấm Công & Bảng Chấm',
      payroll: 'Lương & Phiếu Lương',
      leaves: 'Nghỉ Phép & Cho Phép',
      documents: 'Tài Liệu HR',
      reimbursements: 'Hoàn Tiền',
      performance: 'Đánh Giá Hiệu Suất',
      jobs: 'Tuyển Dụng & Việc Làm',
      applications: 'Thêm Ứng Viên',
      settings: 'Cài Đặt',
      logout: 'Đăng Xuất'
    }
  },
  ph: {
    nav: {
      dashboard: 'Dashboard',
      employees: 'Data ng Empleyado',
      attendance: 'Attendance & Timesheet',
      payroll: 'Payroll & Pay Slips',
      leaves: 'Leave & Pahintulot',
      documents: 'HR Documents',
      reimbursements: 'Reimbursements',
      performance: 'Performance Review',
      jobs: 'Recruitment & Jobs',
      applications: 'Magdagdag ng Aplikante',
      settings: 'Mga Setting',
      logout: 'Mag-logout'
    }
  },
  zh: {
    nav: {
      dashboard: '仪表板',
      employees: '员工数据',
      attendance: '考勤与工时表',
      payroll: '工资单与薪资',
      leaves: '请假与许可',
      documents: '人力资源文档',
      reimbursements: '报销',
      performance: '绩效评估',
      jobs: '招聘与职位',
      applications: '添加申请人',
      settings: '设置',
      logout: '退出登录'
    }
  },
  ja: {
    nav: {
      dashboard: 'ダッシュボード',
      employees: '従業員データ',
      attendance: '出席 & タイムシート',
      payroll: '給与 & 給与明細',
      leaves: '休暇 & 許可',
      documents: 'HR文書',
      reimbursements: '償還',
      performance: 'パフォーマンス評価',
      jobs: '採用 & 求人',
      applications: '応募者を追加',
      settings: '設定',
      logout: 'ログアウト'
    }
  },
  ko: {
    nav: {
      dashboard: '대시보드',
      employees: '직원 데이터',
      attendance: '출석 & 타임시트',
      payroll: '급여 & 급여명세서',
      leaves: '휴가 & 허가',
      documents: 'HR 문서',
      reimbursements: '환급',
      performance: '성과 평가',
      jobs: '채용 & 일자리',
      applications: '지원자 추가',
      settings: '설정',
      logout: '로그아웃'
    }
  },
  hi: {
    nav: {
      dashboard: 'डैशबोर्ड',
      employees: 'कर्मचारी डेटा',
      attendance: 'उपस्थिति और टाइमशीट',
      payroll: 'वेतन और पे स्लिप',
      leaves: 'छुट्टी और अनुमति',
      documents: 'HR दस्तावेज़',
      reimbursements: 'प्रतिपूर्ति',
      performance: 'प्रदर्शन समीक्षा',
      jobs: 'भर्ती और नौकरियां',
      applications: 'आवेदक जोड़ें',
      settings: 'सेटिंग्स',
      logout: 'लॉग आउट'
    }
  },
  ar: {
    nav: {
      dashboard: 'لوحة التحكم',
      employees: 'بيانات الموظفين',
      attendance: 'الحضور وجدول الأوقات',
      payroll: 'كشوف المرتبات وقسائم الراتب',
      leaves: 'الإجازات والأذونات',
      documents: 'وثائق الموارد البشرية',
      reimbursements: 'المبالغ المستردة',
      performance: 'مراجعة الأداء',
      jobs: 'التوظيف والوظائف',
      applications: 'إضافة متقدم',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج'
    },
    dashboard: {
      statsError: 'فشل في تحميل الإحصائيات',
      totalEmployees: 'إجمالي الموظفين',
      todayAttendance: 'حضور اليوم',
      pendingLeaves: 'الإجازات المعلقة',
      monthlyPayroll: 'الراتب الشهري',
      recentActivities: 'الأنشطة الحديثة'
    }
  },
  es: {
    nav: {
      dashboard: 'Panel de Control',
      employees: 'Datos de Empleados',
      attendance: 'Asistencia y Hoja de Tiempo',
      payroll: 'Nómina y Recibos de Pago',
      leaves: 'Licencias y Permisos',
      documents: 'Documentos de RRHH',
      reimbursements: 'Reembolsos',
      performance: 'Evaluación de Rendimiento',
      jobs: 'Reclutamiento y Empleos',
      applications: 'Agregar Candidato',
      settings: 'Configuraciones',
      logout: 'Cerrar Sesión'
    }
  },
  pt: {
    nav: {
      dashboard: 'Painel de Controle',
      employees: 'Dados dos Funcionários',
      attendance: 'Presença e Folha de Ponto',
      payroll: 'Folha de Pagamento e Contracheques',
      leaves: 'Licenças e Permissões',
      documents: 'Documentos de RH',
      reimbursements: 'Reembolsos',
      performance: 'Avaliação de Desempenho',
      jobs: 'Recrutamento e Empregos',
      applications: 'Adicionar Candidato',
      settings: 'Configurações',
      logout: 'Sair'
    }
  },
  fr: {
    nav: {
      dashboard: 'Tableau de Bord',
      employees: 'Données des Employés',
      attendance: 'Présence et Feuille de Temps',
      payroll: 'Paie et Fiches de Paie',
      leaves: 'Congés et Permissions',
      documents: 'Documents RH',
      reimbursements: 'Remboursements',
      performance: 'Évaluation de Performance',
      jobs: 'Recrutement et Emplois',
      applications: 'Ajouter un Candidat',
      settings: 'Paramètres',
      logout: 'Se Déconnecter'
    }
  },
  de: {
    nav: {
      dashboard: 'Dashboard',
      employees: 'Mitarbeiterdaten',
      attendance: 'Anwesenheit & Zeiterfassung',
      payroll: 'Gehaltsabrechnung & Lohnzettel',
      leaves: 'Urlaub & Genehmigungen',
      documents: 'HR-Dokumente',
      reimbursements: 'Erstattungen',
      performance: 'Leistungsbewertung',
      jobs: 'Rekrutierung & Stellen',
      applications: 'Bewerber hinzufügen',
      settings: 'Einstellungen',
      logout: 'Abmelden'
    }
  },
  ru: {
    nav: {
      dashboard: 'Панель управления',
      employees: 'Данные сотрудников',
      attendance: 'Посещаемость и табель',
      payroll: 'Зарплата и расчетные листы',
      leaves: 'Отпуска и разрешения',
      documents: 'HR документы',
      reimbursements: 'Возмещения',
      performance: 'Оценка производительности',
      jobs: 'Набор персонала и вакансии',
      applications: 'Добавить кандидата',
      settings: 'Настройки',
      logout: 'Выйти'
    }
  }
};

// RTL languages
const RTL_LANGUAGES: SupportedLanguage[] = ['ar'];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('id');

  const setLanguage = (language: SupportedLanguage) => {
    try {
      // Validate language exists in translations
      if (!translations[language]) {
        console.warn(`Language ${language} not supported, falling back to Indonesian`);
        language = 'id';
      }
      
      setCurrentLanguage(language);
      localStorage.setItem('hr-app-language', language);
      
      // Update document direction for RTL languages
      const isRTL = RTL_LANGUAGES.includes(language);
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
      
      // Add language-specific class for styling
      document.documentElement.className = document.documentElement.className
        .replace(/lang-\w+/g, '') + ` lang-${language}`;
        
    } catch (error) {
      console.error('Error setting language:', error);
      // Fallback to Indonesian on error
      setCurrentLanguage('id');
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'id';
    }
  };

  const t = (key: string): string => {
    try {
      return getTranslation(currentLanguage, key);
    } catch (error) {
      console.error(`Translation error for key "${key}":`, error);
      return key; // Return the key itself as fallback
    }
  };

  const isRTL = RTL_LANGUAGES.includes(currentLanguage);

  useEffect(() => {
    try {
      // Check localStorage for saved language
      const stored = localStorage.getItem('hr-app-language');
      if (stored && stored in SUPPORTED_LANGUAGES && translations[stored as SupportedLanguage]) {
        setLanguage(stored as SupportedLanguage);
      } else {
        // Set default language if no valid stored language
        setLanguage('id');
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
      setLanguage('id'); // Fallback to Indonesian
    }
  }, []);

  useEffect(() => {
    try {
      // Set document properties safely
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = currentLanguage;
    } catch (error) {
      console.error('Error updating document properties:', error);
    }
  }, [currentLanguage, isRTL]);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        availableLanguages: SUPPORTED_LANGUAGES,
        isRTL,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
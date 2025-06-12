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

// Simple translations for basic functionality
const localTranslations: Record<SupportedLanguage, any> = {
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
      statsError: 'Gagal memuat data statistik',
      totalEmployees: 'Total Karyawan',
      todayAttendance: 'Hadir Hari Ini',
      pendingLeaves: 'Cuti Pending',
      monthlyPayroll: 'Payroll Bulan Ini',
      recentActivities: 'Aktivitas Terbaru',
      viewAll: 'Lihat Semua',
      noActivities: 'Belum ada aktivitas terbaru'
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
      title: 'Dashboard',
      statsError: 'Failed to load statistics',
      totalEmployees: 'Total Employees',
      todayAttendance: 'Today Attendance',
      pendingLeaves: 'Pending Leaves',
      monthlyPayroll: 'Monthly Payroll',
      recentActivities: 'Recent Activities',
      viewAll: 'View All',
      noActivities: 'No recent activities'
    }
  },
  ms: { nav: { dashboard: 'Papan Pemuka', employees: 'Data Pekerja', attendance: 'Kehadiran', payroll: 'Gaji', leaves: 'Cuti', documents: 'Dokumen', reimbursements: 'Tuntutan Balik', performance: 'Prestasi', jobs: 'Kerja', applications: 'Permohonan', settings: 'Tetapan', logout: 'Log Keluar' } },
  th: { nav: { dashboard: 'แดชบอร์ด', employees: 'ข้อมูลพนักงาน', attendance: 'การเข้างาน', payroll: 'เงินเดือน', leaves: 'การลา', documents: 'เอกสาร HR', reimbursements: 'การเบิกเงิน', performance: 'การประเมินผลงาน', jobs: 'การสรรหา', applications: 'เพิ่มผู้สมัคร', settings: 'การตั้งค่า', logout: 'ออกจากระบบ' } },
  vi: { nav: { dashboard: 'Bảng Điều Khiển', employees: 'Dữ Liệu Nhân Viên', attendance: 'Chấm Công', payroll: 'Lương', leaves: 'Nghỉ Phép', documents: 'Tài Liệu HR', reimbursements: 'Hoàn Tiền', performance: 'Đánh Giá Hiệu Suất', jobs: 'Tuyển Dụng', applications: 'Thêm Ứng Viên', settings: 'Cài Đặt', logout: 'Đăng Xuất' } },
  ph: { nav: { dashboard: 'Dashboard', employees: 'Data ng Empleyado', attendance: 'Attendance', payroll: 'Payroll', leaves: 'Leave', documents: 'HR Documents', reimbursements: 'Reimbursements', performance: 'Performance Review', jobs: 'Recruitment', applications: 'Magdagdag ng Aplikante', settings: 'Mga Setting', logout: 'Mag-logout' } },
  zh: { nav: { dashboard: '仪表板', employees: '员工数据', attendance: '考勤', payroll: '工资单', leaves: '请假', documents: '人力资源文档', reimbursements: '报销', performance: '绩效评估', jobs: '招聘', applications: '添加申请人', settings: '设置', logout: '退出登录' } },
  ja: { nav: { dashboard: 'ダッシュボード', employees: '従業員データ', attendance: '出席', payroll: '給与', leaves: '休暇', documents: 'HR文書', reimbursements: '償還', performance: 'パフォーマンス評価', jobs: '採用', applications: '応募者を追加', settings: '設定', logout: 'ログアウト' } },
  ko: { nav: { dashboard: '대시보드', employees: '직원 데이터', attendance: '출석', payroll: '급여', leaves: '휴가', documents: 'HR 문서', reimbursements: '환급', performance: '성과 평가', jobs: '채용', applications: '지원자 추가', settings: '설정', logout: '로그아웃' } },
  hi: { nav: { dashboard: 'डैशबोर्ड', employees: 'कर्मचारी डेटा', attendance: 'उपस्थिति', payroll: 'वेतन', leaves: 'छुट्टी', documents: 'HR दस्तावेज़', reimbursements: 'प्रतिपूर्ति', performance: 'प्रदर्शन समीक्षा', jobs: 'भर्ती', applications: 'आवेदक जोड़ें', settings: 'सेटिंग्स', logout: 'लॉग आउट' } },
  ar: { nav: { dashboard: 'لوحة التحكم', employees: 'بيانات الموظفين', attendance: 'الحضور', payroll: 'كشوف المرتبات', leaves: 'الإجازات', documents: 'وثائق الموارد البشرية', reimbursements: 'المبالغ المستردة', performance: 'مراجعة الأداء', jobs: 'التوظيف', applications: 'إضافة متقدم', settings: 'الإعدادات', logout: 'تسجيل الخروج' } },
  es: { nav: { dashboard: 'Panel de Control', employees: 'Datos de Empleados', attendance: 'Asistencia', payroll: 'Nómina', leaves: 'Licencias', documents: 'Documentos de RRHH', reimbursements: 'Reembolsos', performance: 'Evaluación de Rendimiento', jobs: 'Reclutamiento', applications: 'Agregar Candidato', settings: 'Configuraciones', logout: 'Cerrar Sesión' } },
  pt: { nav: { dashboard: 'Painel de Controle', employees: 'Dados dos Funcionários', attendance: 'Presença', payroll: 'Folha de Pagamento', leaves: 'Licenças', documents: 'Documentos de RH', reimbursements: 'Reembolsos', performance: 'Avaliação de Desempenho', jobs: 'Recrutamento', applications: 'Adicionar Candidato', settings: 'Configurações', logout: 'Sair' } },
  fr: { nav: { dashboard: 'Tableau de Bord', employees: 'Données des Employés', attendance: 'Présence', payroll: 'Paie', leaves: 'Congés', documents: 'Documents RH', reimbursements: 'Remboursements', performance: 'Évaluation de Performance', jobs: 'Recrutement', applications: 'Ajouter un Candidat', settings: 'Paramètres', logout: 'Se Déconnecter' } },
  de: { nav: { dashboard: 'Dashboard', employees: 'Mitarbeiterdaten', attendance: 'Anwesenheit', payroll: 'Gehaltsabrechnung', leaves: 'Urlaub', documents: 'HR-Dokumente', reimbursements: 'Erstattungen', performance: 'Leistungsbewertung', jobs: 'Rekrutierung', applications: 'Bewerber hinzufügen', settings: 'Einstellungen', logout: 'Abmelden' } },
  ru: { nav: { dashboard: 'Панель управления', employees: 'Данные сотрудников', attendance: 'Посещаемость', payroll: 'Зарплата', leaves: 'Отпуска', documents: 'HR документы', reimbursements: 'Возмещения', performance: 'Оценка производительности', jobs: 'Набор персонала', applications: 'Добавить кандидата', settings: 'Настройки', logout: 'Выйти' } }
};

// RTL languages
const RTL_LANGUAGES: SupportedLanguage[] = ['ar'];

function localGetTranslation(language: SupportedLanguage, key: string): string {
  try {
    const keys = key.split('.');
    let value: any = localTranslations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && value.hasOwnProperty(k)) {
        value = value[k];
      } else {
        // Fallback to English
        let fallbackValue: any = localTranslations['en'];
        for (const fallbackKey of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && fallbackValue.hasOwnProperty(fallbackKey)) {
            fallbackValue = fallbackValue[fallbackKey];
          } else {
            return key; 
          }
        }
        return typeof fallbackValue === 'string' ? fallbackValue : key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  } catch (error) {
    return key;
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('id');

  const setLanguage = (language: SupportedLanguage) => {
    try {
      setCurrentLanguage(language);
      localStorage.setItem('hr-app-language', language);
      
      const isRTL = RTL_LANGUAGES.includes(language);
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    } catch (error) {
      console.error('Error setting language:', error);
      setCurrentLanguage('id');
    }
  };

  const t = (key: string): string => {
    return localGetTranslation(currentLanguage, key);
  };

  const isRTL = RTL_LANGUAGES.includes(currentLanguage);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('hr-app-language');
      if (stored && stored in SUPPORTED_LANGUAGES) {
        setLanguage(stored as SupportedLanguage);
      } else {
        setLanguage('id');
      }
    } catch (error) {
      setLanguage('id');
    }
  }, []);

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
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLanguage, translations, getTranslation, SUPPORTED_LANGUAGES } from '@shared/i18n';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string) => string;
  availableLanguages: typeof SUPPORTED_LANGUAGES;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// RTL languages
const RTL_LANGUAGES: SupportedLanguage[] = ['ar'];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    // Check localStorage first
    const stored = localStorage.getItem('hr-app-language');
    if (stored && stored in SUPPORTED_LANGUAGES) {
      return stored as SupportedLanguage;
    }
    
    // Detect from browser language
    const browserLang = navigator.language.toLowerCase();
    
    // Direct match
    if (browserLang in SUPPORTED_LANGUAGES) {
      return browserLang as SupportedLanguage;
    }
    
    // Match by language code (e.g., 'en-US' -> 'en')
    const langCode = browserLang.split('-')[0];
    if (langCode in SUPPORTED_LANGUAGES) {
      return langCode as SupportedLanguage;
    }
    
    // Default to Indonesian for Southeast Asia regions, English for others
    const asianLanguages = ['zh', 'ja', 'ko', 'th', 'vi', 'ms'];
    if (asianLanguages.some(lang => browserLang.includes(lang))) {
      if (browserLang.includes('zh')) return 'zh';
      if (browserLang.includes('ja')) return 'ja';
      if (browserLang.includes('ko')) return 'ko';
      if (browserLang.includes('th')) return 'th';
      if (browserLang.includes('vi')) return 'vi';
      if (browserLang.includes('ms')) return 'ms';
      return 'id'; // Default to Indonesian for SEA
    }
    
    return 'en'; // Default fallback
  });

  const setLanguage = (language: SupportedLanguage) => {
    setCurrentLanguage(language);
    localStorage.setItem('hr-app-language', language);
    
    // Update document direction for RTL languages
    document.documentElement.dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  };

  const t = (key: string): string => {
    return getTranslation(currentLanguage, key);
  };

  const isRTL = RTL_LANGUAGES.includes(currentLanguage);

  useEffect(() => {
    // Set initial document properties
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
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

// Hook untuk mendapatkan formatted currency
export function useCurrency() {
  const { currentLanguage } = useLanguage();
  
  const formatCurrency = (amount: number): string => {
    const config = SUPPORTED_LANGUAGES[currentLanguage];
    try {
      const formatter = new Intl.NumberFormat(currentLanguage === 'en' ? 'en-US' : currentLanguage, {
        style: 'currency',
        currency: config.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      return formatter.format(amount);
    } catch {
      // Fallback jika currency tidak didukung
      return `${config.currency} ${amount.toLocaleString()}`;
    }
  };
  
  return { formatCurrency, currency: SUPPORTED_LANGUAGES[currentLanguage].currency };
}

// Hook untuk mendapatkan formatted date
export function useDate() {
  const { currentLanguage } = useLanguage();
  
  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    try {
      const formatter = new Intl.DateTimeFormat(currentLanguage === 'en' ? 'en-US' : currentLanguage, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(dateObj);
    } catch {
      // Fallback format
      return dateObj.toLocaleDateString();
    }
  };
  
  const formatDateTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    try {
      const formatter = new Intl.DateTimeFormat(currentLanguage === 'en' ? 'en-US' : currentLanguage, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      return formatter.format(dateObj);
    } catch {
      // Fallback format
      return dateObj.toLocaleString();
    }
  };
  
  return { formatDate, formatDateTime };
}
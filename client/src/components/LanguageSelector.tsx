import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { SupportedLanguage } from '@shared/i18n';

export function LanguageSelector() {
  const { currentLanguage, setLanguage, availableLanguages } = useLanguage();

  const handleLanguageChange = (languageCode: SupportedLanguage) => {
    setLanguage(languageCode);
  };

  const currentLangConfig = availableLanguages[currentLanguage];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Select language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
          Select Language
        </div>
        {Object.entries(availableLanguages).map(([code, config]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code as SupportedLanguage)}
            className="flex items-center justify-between px-2 py-2 cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{config.flag}</span>
              <div>
                <div className="text-sm font-medium">{config.name}</div>
                <div className="text-xs text-muted-foreground">
                  {config.nativeName}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground">{config.region}</span>
              {currentLanguage === code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
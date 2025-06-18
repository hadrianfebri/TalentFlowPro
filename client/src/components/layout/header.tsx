import { useState } from "react";
import { Menu, Search, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

interface HeaderProps {
  pageTitle: string;
}

export function Header({ pageTitle }: HeaderProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [notificationCount] = useState(3);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="ml-2 text-2xl font-bold text-foreground">{pageTitle}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden lg:block">
            <Input
              type="text"
              placeholder={t('actions.search') + ' ' + t('employees.title').toLowerCase() + ', ' + t('nav.documents').toLowerCase() + '...'}
              className="w-80 pl-10 pr-4 py-2"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          </div>
          
          {/* Language Selector */}
          <LanguageSelector />
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2 rounded-lg text-muted-foreground hover:bg-accent"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </Button>
          
          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.role || "HR Manager"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 bg-muted rounded-full flex items-center justify-center"
              onClick={handleLogout}
            >
              <User className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

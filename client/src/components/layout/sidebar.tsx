import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, 
  Clock, 
  DollarSign, 
  Calendar, 
  FileText, 
  Receipt, 
  BarChart3, 
  UserPlus, 
  Brain, 
  Gift,
  LayoutDashboard,
  Settings,
  UserCheck,
  LogOut,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import talentWhizLogo from "@assets/TALENTWHIZ_COLOR_1749955055542.png";

export default function Sidebar() {
  const [location] = useLocation();
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      // Call server logout endpoint to destroy session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include' // Include session cookies
      });
      
      // Clear any local storage or session data
      localStorage.removeItem('user');
      
      // Redirect to appropriate login page based on user role
      if (user?.role === 'employee') {
        window.location.href = '/employee-login';
      } else {
        window.location.href = '/hr-login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if server logout fails, still clear local data and redirect
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  // Define navigation items based on user role
  const getNavigationItems = () => {
    if (user?.role === 'employee') {
      // Employee navigation - limited access
      return [
        {
          name: t('nav.dashboard'),
          href: "/",
          icon: LayoutDashboard,
        },
        {
          name: "Profil Saya",
          href: "/employee-profile",
          icon: UserCheck,
        },
        {
          name: t('nav.attendance'),
          href: "/employee-attendance",
          icon: Clock,
        },
        {
          name: t('nav.leaves'),
          href: "/leaves",
          icon: Calendar,
        },
        {
          name: t('nav.documents'),
          href: "/documents",
          icon: FileText,
        },
        {
          name: t('nav.reimbursements'),
          href: "/reimbursement",
          icon: Receipt,
        },
        {
          name: t('nav.performance'),
          href: "/performance",
          icon: BarChart3,
        },
      ];
    } else {
      // Admin/HR navigation - full access
      return [
        {
          name: t('nav.dashboard'),
          href: "/",
          icon: LayoutDashboard,
        },
        {
          name: t('nav.employees'),
          href: "/employees",
          icon: Users,
        },
        {
          name: t('nav.attendance'),
          href: "/attendance",
          icon: Clock,
        },
        {
          name: t('nav.payroll'),
          href: "/payroll",
          icon: DollarSign,
        },
        {
          name: "Komponen Gaji",
          href: "/salary-components",
          icon: DollarSign,
        },
        {
          name: t('nav.leaves'),
          href: "/leaves",
          icon: Calendar,
        },
        {
          name: t('nav.documents'),
          href: "/documents",
          icon: FileText,
        },
        {
          name: t('nav.reimbursements'),
          href: "/reimbursement",
          icon: Receipt,
        },
        {
          name: t('nav.performance'),
          href: "/performance",
          icon: BarChart3,
        },
        {
          name: t('nav.recruitment'),
          href: "/recruitment",
          icon: Briefcase,
        },
        {
          name: "Manajemen Pelamar",
          href: "/applicant-management",
          icon: Users,
        },
        {
          name: "AI Testing",
          href: "/ai-testing",
          icon: Brain,
        },
        {
          name: t('nav.settings'),
          href: "/settings",
          icon: Settings,
        },
      ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <aside className={cn(
      "w-64 h-screen flex flex-col sidebar-gradient border-r border-white/20 relative",
      isRTL ? "border-l border-white/20" : "border-r border-white/20"
    )}>
      {/* Glass overlay for glassmorphism effect */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm pointer-events-none"></div>
      
      <div className="p-6 border-b border-white/20 flex-shrink-0 relative z-10">
        <div className={cn(
          "flex items-center",
          isRTL ? "space-x-reverse space-x-3" : "space-x-3"
        )}>
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md border border-white/30 p-1">
            <img 
              src={talentWhizLogo} 
              alt="TalentWhiz.ai Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">TalentWhiz.ai</h2>
            <p className="text-xs text-white/80">UMKM Essentials</p>
          </div>
        </div>
      </div>

      <nav className="p-4 flex-1 overflow-y-auto relative z-10">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || 
              (item.href !== "/" && location.startsWith(item.href));

            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer border border-white/10",
                      isActive
                        ? "bg-white/20 text-white shadow-sm backdrop-blur-md border-white/30"
                        : "text-white/80 hover:bg-white/10 hover:text-white hover:border-white/20"
                    )}
                    style={{ 
                      fontFamily: isRTL ? "'Noto Sans Arabic', 'Segoe UI', sans-serif" : "inherit",
                      direction: isRTL ? "rtl" : "ltr",
                      gap: "0.75rem",
                      flexDirection: isRTL ? "row-reverse" : "row"
                    }}
                  >
                    <Icon className={cn(
                      "h-5 w-5 transition-colors flex-shrink-0",
                      isActive ? "text-white" : "text-white/70 group-hover:text-white"
                    )} />
                    <span className="flex-1 text-right" style={{ 
                      textAlign: isRTL ? "right" : "left",
                      unicodeBidi: "embed"
                    }}>
                      {item.name}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-white/20 relative z-10">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10 border border-white/10 hover:border-white/20"
        >
          <LogOut className="h-5 w-5 mr-3" />
          {t('nav.logout')}
        </Button>
      </div>
    </aside>
  );
}
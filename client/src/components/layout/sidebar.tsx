import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
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
  UserCheck
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { t, isRTL } = useLanguage();

  const navigationItems = [
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
      name: t('nav.jobs'),
      href: "/recruitment",
      icon: UserPlus,
    },
    {
      name: t('nav.applications'),
      href: "/add-applicant",
      icon: UserCheck,
    },
    {
      name: "Upload Pelamar",
      href: "/applicant-upload",
      icon: Gift,
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

  return (
    <aside className={cn(
      "w-64 bg-card shadow-sm",
      isRTL ? "border-l border-border" : "border-r border-border"
    )}>
      <div className="p-6 border-b border-border">
        <div className={cn(
          "flex items-center",
          isRTL ? "space-x-reverse space-x-3" : "space-x-3"
        )}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">TF</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">TalentFlow</h2>
            <p className="text-xs text-muted-foreground">HR Management</p>
          </div>
        </div>
      </div>

      <nav className="p-4">
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
                      "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground group cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
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
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
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
    </aside>
  );
}
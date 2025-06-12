import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
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
  const { hasPermission } = usePermissions();
  const { t } = useLanguage();

  const navigationItems = [
    {
      name: t('nav.dashboard'),
      href: "/",
      icon: LayoutDashboard,
      resource: "dashboard",
      allowedRoles: ["admin", "hr", "employee"],
    },
    {
      name: t('nav.employees'),
      href: "/employees",
      icon: Users,
      resource: "employees",
      allowedRoles: ["admin", "hr", "employee"],
    },
    {
      name: t('nav.attendance'),
      href: "/attendance",
      icon: Clock,
      resource: "attendance",
      allowedRoles: ["admin", "hr", "employee"],
    },
    {
      name: t('nav.payroll'),
      href: "/payroll",
      icon: DollarSign,
      resource: "payroll",
      allowedRoles: ["admin", "hr", "employee"],
    },
    {
      name: "Komponen Gaji",
      href: "/salary-components",
      icon: DollarSign,
      resource: "salary-components",
      allowedRoles: ["admin", "hr"],
    },
    {
      name: t('nav.leaves'),
      href: "/leaves",
      icon: Calendar,
      resource: "leaves",
      allowedRoles: ["admin", "hr", "employee"],
    },
    {
      name: t('nav.documents'),
      href: "/documents",
      icon: FileText,
      resource: "documents",
      allowedRoles: ["admin", "hr", "employee"],
    },
    {
      name: t('nav.reimbursements'),
      href: "/reimbursement",
      icon: Receipt,
      resource: "reimbursements",
      allowedRoles: ["admin", "hr", "employee"],
    },
    {
      name: t('nav.performance'),
      href: "/performance",
      icon: BarChart3,
      resource: "performance",
      allowedRoles: ["admin", "hr", "employee"],
    },
    {
      name: t('nav.jobs'),
      href: "/recruitment",
      icon: UserPlus,
      resource: "recruitment",
      allowedRoles: ["admin", "hr"],
    },
    {
      name: t('nav.applications'),
      href: "/add-applicant",
      icon: UserCheck,
      resource: "recruitment",
      allowedRoles: ["admin", "hr"],
    },
    {
      name: "Upload Pelamar",
      href: "/applicant-upload",
      icon: Gift,
      resource: "recruitment",
      allowedRoles: ["admin", "hr"],
    },
    {
      name: "AI Testing",
      href: "/ai-testing",
      icon: Brain,
      resource: "ai-testing",
      allowedRoles: ["admin", "hr"],
    },
    {
      name: t('nav.settings'),
      href: "/settings",
      icon: Settings,
      resource: "settings",
      allowedRoles: ["admin"],
    },
  ];

  // Filter navigation items based on permissions
  const filteredItems = navigationItems.filter(item => 
    hasPermission(item.resource, 'read')
  );

  return (
    <aside className="w-64 bg-card border-r border-border shadow-sm">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
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
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || 
              (item.href !== "/" && location.startsWith(item.href));

            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground group cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
                    )} />
                    <span className="flex-1">{item.name}</span>
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
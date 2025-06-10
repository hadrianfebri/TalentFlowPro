import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
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
  LayoutDashboard
} from "lucide-react";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Data Karyawan",
    href: "/employees",
    icon: Users,
  },
  {
    name: "Absensi & Timesheet",
    href: "/attendance",
    icon: Clock,
  },
  {
    name: "Payroll & Slip Gaji",
    href: "/payroll",
    icon: DollarSign,
  },
  {
    name: "Cuti & Izin",
    href: "/leaves",
    icon: Calendar,
  },
  {
    name: "Dokumen & Template",
    href: "/documents",
    icon: FileText,
  },
  {
    name: "Reimbursement",
    href: "/reimbursement",
    icon: Receipt,
  },
  {
    name: "Performance",
    href: "/performance",
    icon: BarChart3,
  },
  {
    name: "Recruitment",
    href: "/recruitment",
    icon: UserPlus,
  },
];

const momentumLoopItems = [
  {
    name: "AI Analytics",
    href: "/ai-analytics",
    icon: Brain,
  },
  {
    name: "Reward Wallet",
    href: "/rewards",
    icon: Gift,
  },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-card border-r border-border sidebar-nav">
        {/* Logo Section */}
        <div className="flex items-center flex-shrink-0 px-6 pb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="ml-3 text-xl font-bold text-foreground">TalentFlow.ai</span>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 px-3 space-y-1">
          {navigationItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </a>
              </Link>
            );
          })}
          
          {/* Momentum Loop Feature */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Momentum Loop™
            </p>
            {momentumLoopItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={cn(
                      "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon 
                      className={cn(
                        "mr-3 h-4 w-4",
                        item.name === "AI Analytics" && "text-primary",
                        item.name === "Reward Wallet" && "text-secondary"
                      )} 
                    />
                    {item.name}
                  </a>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

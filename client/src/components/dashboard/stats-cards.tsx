import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Clock, Calendar, DollarSign, TrendingUp, User, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePermissions } from "@/hooks/usePermissions";

interface DashboardStats {
  // Company-wide stats (Admin/HR)
  totalEmployees?: number;
  employeeGrowth?: string;
  todayAttendance?: number;
  attendanceRate?: string;
  pendingLeaves?: number;
  urgentLeaves?: string;
  monthlyPayroll?: string;
  payrollStatus?: string;
  
  // Employee-specific stats
  employeeName?: string;
  employeeId?: string;
  todayAttendance?: string;
  attendanceIcon?: string;
  monthlyAttendance?: number;
}

export default function StatsCards() {
  const { t } = useLanguage();
  const { isEmployee } = usePermissions();
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stats-card border-destructive/20">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-destructive">{t('dashboard.statsError')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Employee-specific cards
  if (isEmployee()) {
    const employeeStatCards = [
      {
        title: "Status Kehadiran Hari Ini",
        value: stats.todayAttendance || "Belum Check In",
        change: stats.attendanceIcon || "○",
        icon: CheckCircle,
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
        changeColor: "text-secondary",
      },
      {
        title: "Kehadiran Bulan Ini",
        value: stats.monthlyAttendance?.toString() || "0",
        change: stats.attendanceRate || "0 hari bulan ini",
        icon: Clock,
        iconBg: "bg-secondary/10",
        iconColor: "text-secondary",
        changeColor: "text-secondary",
      },
      {
        title: "Cuti Pending",
        value: stats.pendingLeaves?.toString() || "0",
        change: stats.urgentLeaves || "Tidak ada",
        icon: Calendar,
        iconBg: "bg-yellow-100",
        iconColor: "text-yellow-600",
        changeColor: "text-muted-foreground",
      },
      {
        title: "Gaji Bulan Ini",
        value: stats.monthlyPayroll || "Rp 0",
        change: stats.payrollStatus || "Belum diproses",
        icon: DollarSign,
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        changeColor: "text-muted-foreground",
      },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {employeeStatCards.map((stat, index) => (
          <Card key={index} className="stats-card border border-border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className={`text-xs ${stat.changeColor}`}>{stat.change}</p>
                </div>
                <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Admin/HR cards
  const statCards = [
    {
      title: t('dashboard.totalEmployees'),
      value: stats.totalEmployees?.toString() || "0",
      change: stats.employeeGrowth || "+0 bulan ini",
      icon: Users,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      changeColor: "text-secondary",
    },
    {
      title: t('dashboard.todayAttendance'),
      value: stats.todayAttendance?.toString() || "0",
      change: stats.attendanceRate || "0% tingkat kehadiran",
      icon: Clock,
      iconBg: "bg-secondary/10",
      iconColor: "text-secondary",
      changeColor: "text-secondary",
    },
    {
      title: t('dashboard.pendingLeaves'),
      value: stats.pendingLeaves?.toString() || "0",
      change: stats.urgentLeaves || "0 perlu persetujuan segera",
      icon: Calendar,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      changeColor: "text-destructive",
    },
    {
      title: t('dashboard.monthlyPayroll'),
      value: stats.monthlyPayroll || "Rp 0",
      change: stats.payrollStatus || "Belum ada data",
      icon: DollarSign,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      changeColor: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="stats-card border border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className={`text-sm mt-1 ${stat.changeColor}`}>
                  {stat.title === "Hadir Hari Ini" && (
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                  )}
                  {stat.change}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

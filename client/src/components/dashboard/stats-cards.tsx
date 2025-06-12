import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Clock, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

interface DashboardStats {
  totalEmployees: number;
  employeeGrowth: string;
  todayAttendance: number;
  attendanceRate: string;
  pendingLeaves: number;
  urgentLeaves: string;
  monthlyPayroll: string;
  payrollStatus: string;
}

export default function StatsCards() {
  const { t } = useLanguage();
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

  const statCards = [
    {
      title: t('dashboard.totalEmployees'),
      value: stats.totalEmployees.toString(),
      change: stats.employeeGrowth,
      icon: Users,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      changeColor: "text-secondary",
    },
    {
      title: t('dashboard.todayAttendance'),
      value: stats.todayAttendance.toString(),
      change: stats.attendanceRate,
      icon: Clock,
      iconBg: "bg-secondary/10",
      iconColor: "text-secondary",
      changeColor: "text-secondary",
    },
    {
      title: t('dashboard.pendingLeaves'),
      value: stats.pendingLeaves.toString(),
      change: stats.urgentLeaves,
      icon: Calendar,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      changeColor: "text-destructive",
    },
    {
      title: t('dashboard.monthlyPayroll'),
      value: stats.monthlyPayroll,
      change: stats.payrollStatus,
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

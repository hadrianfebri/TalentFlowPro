import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  UserCheck, 
  Calendar, 
  DollarSign, 
  UserPlus, 
  Clock,
  ArrowRight 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface Activity {
  id: string;
  type: 'checkin' | 'leave_request' | 'payroll' | 'recruitment' | 'other';
  title: string;
  description: string;
  timestamp: string;
  employeeName?: string;
  location?: string;
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'checkin':
      return UserCheck;
    case 'leave_request':
      return Calendar;
    case 'payroll':
      return DollarSign;
    case 'recruitment':
      return UserPlus;
    default:
      return Clock;
  }
};

const getActivityIconBg = (type: Activity['type']) => {
  switch (type) {
    case 'checkin':
      return 'bg-primary/10';
    case 'leave_request':
      return 'bg-yellow-100';
    case 'payroll':
      return 'bg-green-100';
    case 'recruitment':
      return 'bg-blue-100';
    default:
      return 'bg-gray-100';
  }
};

const getActivityIconColor = (type: Activity['type']) => {
  switch (type) {
    case 'checkin':
      return 'text-primary';
    case 'leave_request':
      return 'text-yellow-600';
    case 'payroll':
      return 'text-green-600';
    case 'recruitment':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
};

export default function ActivityFeed() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/dashboard/activities"],
  });

  if (isLoading) {
    return (
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Aktivitas Terbaru</CardTitle>
            <Skeleton className="h-8 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4 p-4 rounded-lg">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Aktivitas Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Belum ada aktivitas terbaru</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Aktivitas Terbaru</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            Lihat Semua
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.slice(0, 4).map((activity) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <div 
                key={activity.id} 
                className="flex items-start space-x-4 p-4 rounded-lg hover:bg-accent/50 transition-colors activity-item"
              >
                <div className={`w-10 h-10 ${getActivityIconBg(activity.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${getActivityIconColor(activity.type)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {activity.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { 
                      addSuffix: true, 
                      locale: id 
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

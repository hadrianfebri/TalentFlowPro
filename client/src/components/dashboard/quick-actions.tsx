import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, 
  Calculator, 
  BarChart3, 
  ChevronRight 
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function QuickActions() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Only show quick actions for admin and HR users, not employees
  if (user?.role === 'employee') {
    return null;
  }

  const quickActions = [
    {
      icon: UserPlus,
      label: "Tambah Karyawan",
      description: "Daftarkan karyawan baru",
      action: () => setLocation("/employees"),
      iconColor: "text-primary",
    },
    {
      icon: Calculator,
      label: "Proses Payroll",
      description: "Hitung gaji bulanan",
      action: () => setLocation("/payroll"),
      iconColor: "text-secondary",
    },
    {
      icon: BarChart3,
      label: "Buat Laporan",
      description: "Generate laporan HR",
      action: () => setLocation("/reports"),
      iconColor: "text-yellow-600",
    },
  ];

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Tindakan Cepat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full flex items-center justify-between p-3 h-auto text-left border border-border rounded-lg hover:bg-accent/50 quick-action-btn"
              onClick={action.action}
            >
              <div className="flex items-center">
                <action.icon className={`h-5 w-5 ${action.iconColor} mr-3`} />
                <div>
                  <span className="text-sm font-medium text-foreground block">
                    {action.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {action.description}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

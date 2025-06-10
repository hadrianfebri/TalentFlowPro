import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AttendanceData {
  day: string;
  percentage: number;
  present: number;
  total: number;
}

interface DepartmentData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export default function AnalyticsCharts() {
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery<AttendanceData[]>({
    queryKey: ["/api/dashboard/attendance-chart"],
  });

  const { data: departmentData, isLoading: departmentLoading } = useQuery<DepartmentData[]>({
    queryKey: ["/api/dashboard/department-chart"],
  });

  return (
    <div className="mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Tren Kehadiran 7 Hari Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Skeleton className="w-full h-full" />
              </div>
            ) : !attendanceData || attendanceData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Data kehadiran tidak tersedia</p>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--card-foreground))'
                      }}
                      formatter={(value: number, name: string) => [
                        `${value}%`,
                        'Tingkat Kehadiran'
                      ]}
                      labelFormatter={(label: string) => `Hari: ${label}`}
                    />
                    <Bar 
                      dataKey="percentage" 
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      className="chart-bar"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Distribusi Karyawan per Departemen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {departmentLoading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Skeleton className="w-4 h-4 rounded mr-3" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="w-20 h-2 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !departmentData || departmentData.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Data departemen tidak tersedia</p>
              </div>
            ) : (
              <div className="space-y-4">
                {departmentData.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded mr-3" 
                        style={{ backgroundColor: dept.color }}
                      />
                      <span className="text-sm font-medium text-foreground">
                        {dept.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-foreground font-medium">
                        {dept.count}
                      </span>
                      <div className="w-20 h-2 bg-muted rounded-full">
                        <div 
                          className="h-2 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${dept.percentage}%`,
                            backgroundColor: dept.color
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

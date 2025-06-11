import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { 
  Clock, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Camera,
  Calendar,
  Filter,
  Download,
  Brain,
  BarChart3,
  Eye,
  RefreshCw
} from "lucide-react";

interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  checkInLocation: any;
  checkOutLocation: any;
  checkInPhoto: string | null;
  checkOutPhoto: string | null;
  workingHours: string | null;
  overtimeHours: string | null;
  status: string;
  notes: string | null;
  employee: {
    firstName: string;
    lastName: string;
    employeeId: string;
    position: string;
  };
}

interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  avgWorkingHours: number;
  attendanceRate: number;
}

interface AIInsight {
  type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionable: boolean;
  employees?: string[];
  recommendation?: string;
}

export default function Attendance() {
  const { toast } = useToast();
  const { userRole } = usePermissions();
  
  // State management
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isAIAnalysisOpen, setIsAIAnalysisOpen] = useState(false);

  // Check user permissions
  const isAdminOrHR = () => {
    return userRole.role === "admin" || userRole.role === "hr";
  };

  // Fetch attendance data
  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["/api/attendance", selectedDate, employeeFilter],
    enabled: isAdminOrHR(),
  });

  // Fetch attendance statistics
  const { data: attendanceStats } = useQuery<AttendanceStats>({
    queryKey: ["/api/attendance/stats", selectedDate],
    enabled: isAdminOrHR(),
  });

  // Fetch employees for filter
  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
    enabled: isAdminOrHR(),
  });

  // Generate AI insights mutation
  const generateAIInsightsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/attendance/ai-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          period: selectedDate,
          companyId: userRole.companyId,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate AI insights");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setAIInsights(data);
      setIsAIAnalysisOpen(true);
      toast({
        title: "Analisis AI Selesai",
        description: "Insight absensi telah dihasilkan menggunakan DeepSeek AI",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menghasilkan analisis AI",
        variant: "destructive",
      });
    },
  });

  const [aiInsights, setAIInsights] = useState<AIInsight[]>([]);

  // Helper functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-800">Hadir</Badge>;
      case "absent":
        return <Badge variant="destructive">Tidak Hadir</Badge>;
      case "late":
        return <Badge className="bg-yellow-100 text-yellow-800">Terlambat</Badge>;
      case "early_leave":
        return <Badge className="bg-orange-100 text-orange-800">Pulang Awal</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateWorkingHours = (checkIn: string | null, checkOut: string | null) => {
    if (!checkIn || !checkOut) return "0.0";
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return diffHours.toFixed(1);
  };

  // Filter attendance records
  const filteredRecords = (attendanceRecords as AttendanceRecord[]).filter((record: AttendanceRecord) => {
    const employeeMatch = employeeFilter === "all" || record.employeeId.toString() === employeeFilter;
    const statusMatch = statusFilter === "all" || record.status === statusFilter;
    return employeeMatch && statusMatch;
  });

  if (!isAdminOrHR()) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header pageTitle="Absensi & Timesheet" />
          <main className="flex-1 overflow-y-auto p-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Akses Terbatas</h3>
                <p className="text-muted-foreground text-center">
                  Halaman ini hanya dapat diakses oleh Admin atau HR
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header pageTitle="Absensi & Timesheet" />
        
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Rekap Absensi Karyawan</h1>
              <p className="text-muted-foreground">
                Pantau dan analisis kehadiran karyawan dengan AI DeepSeek
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => generateAIInsightsMutation.mutate()}
                disabled={generateAIInsightsMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Brain className="w-4 h-4 mr-2" />
                {generateAIInsightsMutation.isPending ? "Menganalisis..." : "Analisis AI"}
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Karyawan</p>
                    <p className="text-2xl font-bold">{attendanceStats?.totalEmployees || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Hadir Hari Ini</p>
                    <p className="text-2xl font-bold text-green-600">{attendanceStats?.presentToday || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tidak Hadir</p>
                    <p className="text-2xl font-bold text-red-600">{attendanceStats?.absentToday || 0}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tingkat Kehadiran</p>
                    <p className="text-2xl font-bold text-primary">{attendanceStats?.attendanceRate?.toFixed(1) || 0}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  
                  <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter Karyawan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Karyawan</SelectItem>
                      {(employees as any[]).map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.firstName} {emp.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="present">Hadir</SelectItem>
                      <SelectItem value="absent">Tidak Hadir</SelectItem>
                      <SelectItem value="late">Terlambat</SelectItem>
                      <SelectItem value="early_leave">Pulang Awal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter Lanjutan
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/attendance"] })}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Data Absensi</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAttendance ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Memuat data absensi...</span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Tidak Ada Data Absensi</h3>
                  <p className="text-muted-foreground text-center">
                    Belum ada data absensi untuk tanggal dan filter yang dipilih
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 font-medium text-muted-foreground">Karyawan</th>
                        <th className="py-3 px-4 font-medium text-muted-foreground">Check In</th>
                        <th className="py-3 px-4 font-medium text-muted-foreground">Check Out</th>
                        <th className="py-3 px-4 font-medium text-muted-foreground">Jam Kerja</th>
                        <th className="py-3 px-4 font-medium text-muted-foreground">Status</th>
                        <th className="py-3 px-4 font-medium text-muted-foreground">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record: AttendanceRecord) => (
                        <tr key={record.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{record.employee.firstName} {record.employee.lastName}</p>
                              <p className="text-sm text-muted-foreground">{record.employee.employeeId} - {record.employee.position}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {record.checkIn ? (
                              <div className="flex items-center gap-2">
                                <span>{format(parseISO(record.checkIn), "HH:mm")}</span>
                                {record.checkInLocation && <MapPin className="h-3 w-3 text-green-600" />}
                                {record.checkInPhoto && <Camera className="h-3 w-3 text-blue-600" />}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {record.checkOut ? (
                              <div className="flex items-center gap-2">
                                <span>{format(parseISO(record.checkOut), "HH:mm")}</span>
                                {record.checkOutLocation && <MapPin className="h-3 w-3 text-green-600" />}
                                {record.checkOutPhoto && <Camera className="h-3 w-3 text-blue-600" />}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium">
                              {record.workingHours || calculateWorkingHours(record.checkIn, record.checkOut)} jam
                            </span>
                            {record.overtimeHours && parseFloat(record.overtimeHours) > 0 && (
                              <p className="text-sm text-orange-600">+{record.overtimeHours} lembur</p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(record.status)}
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRecord(record);
                                setIsDetailDialogOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Detail
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Detail Dialog */}
          <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Detail Absensi</DialogTitle>
                <DialogDescription>
                  Informasi lengkap absensi karyawan
                </DialogDescription>
              </DialogHeader>
              
              {selectedRecord && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Karyawan</label>
                      <p className="text-sm font-medium">
                        {selectedRecord.employee.firstName} {selectedRecord.employee.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedRecord.employee.employeeId} - {selectedRecord.employee.position}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tanggal</label>
                      <p className="text-sm font-medium">
                        {format(parseISO(selectedRecord.date), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Check In</label>
                      <p className="text-sm font-medium">
                        {selectedRecord.checkIn ? format(parseISO(selectedRecord.checkIn), "HH:mm:ss") : "-"}
                      </p>
                      {selectedRecord.checkInLocation && (
                        <p className="text-xs text-muted-foreground">
                          📍 Lokasi GPS: {JSON.stringify(selectedRecord.checkInLocation)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Check Out</label>
                      <p className="text-sm font-medium">
                        {selectedRecord.checkOut ? format(parseISO(selectedRecord.checkOut), "HH:mm:ss") : "-"}
                      </p>
                      {selectedRecord.checkOutLocation && (
                        <p className="text-xs text-muted-foreground">
                          📍 Lokasi GPS: {JSON.stringify(selectedRecord.checkOutLocation)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Jam Kerja</label>
                      <p className="text-sm font-medium">
                        {selectedRecord.workingHours || calculateWorkingHours(selectedRecord.checkIn, selectedRecord.checkOut)} jam
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Lembur</label>
                      <p className="text-sm font-medium">
                        {selectedRecord.overtimeHours || "0"} jam
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">
                        {getStatusBadge(selectedRecord.status)}
                      </div>
                    </div>
                  </div>
                  
                  {selectedRecord.notes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Catatan</label>
                      <p className="text-sm">{selectedRecord.notes}</p>
                    </div>
                  )}
                  
                  {(selectedRecord.checkInPhoto || selectedRecord.checkOutPhoto) && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Foto Selfie</label>
                      <div className="flex gap-4 mt-2">
                        {selectedRecord.checkInPhoto && (
                          <div className="text-center">
                            <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                              <Camera className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Check In</p>
                          </div>
                        )}
                        {selectedRecord.checkOutPhoto && (
                          <div className="text-center">
                            <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                              <Camera className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Check Out</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* AI Analysis Dialog */}
          <Dialog open={isAIAnalysisOpen} onOpenChange={setIsAIAnalysisOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Analisis AI DeepSeek - Pola Absensi
                </DialogTitle>
                <DialogDescription>
                  Insight dan rekomendasi berbasis analisis AI untuk optimalisasi kehadiran karyawan
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="insights" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="insights">AI Insights</TabsTrigger>
                  <TabsTrigger value="patterns">Pola Kehadiran</TabsTrigger>
                  <TabsTrigger value="recommendations">Rekomendasi</TabsTrigger>
                </TabsList>

                <TabsContent value="insights" className="space-y-4">
                  {aiInsights.length === 0 ? (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Belum ada analisis AI. Klik "Analisis AI" untuk memulai.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {aiInsights.map((insight, index) => (
                        <Card key={index} className={`border-l-4 ${
                          insight.severity === 'high' ? 'border-l-red-500' :
                          insight.severity === 'medium' ? 'border-l-yellow-500' :
                          'border-l-green-500'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{insight.title}</h4>
                                <p className="text-muted-foreground mt-1">{insight.description}</p>
                                {insight.employees && insight.employees.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium">Karyawan terkait:</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {insight.employees.map((emp, i) => (
                                        <Badge key={i} variant="outline" className="text-xs">
                                          {emp}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {insight.recommendation && (
                                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                      <strong>Rekomendasi:</strong> {insight.recommendation}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <Badge variant={
                                insight.severity === 'high' ? 'destructive' :
                                insight.severity === 'medium' ? 'default' :
                                'secondary'
                              }>
                                {insight.severity === 'high' ? 'Tinggi' :
                                 insight.severity === 'medium' ? 'Sedang' : 'Rendah'}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="patterns" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pola Kehadiran Mingguan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        <BarChart3 className="h-16 w-16 mb-4" />
                        <div className="text-center">
                          <p>Grafik pola kehadiran akan ditampilkan di sini</p>
                          <p className="text-sm">Berdasarkan analisis AI DeepSeek</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Rekomendasi Strategis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-4 border-l-4 border-l-blue-500 bg-blue-50">
                          <h4 className="font-semibold text-blue-900">Optimalisasi Jam Kerja</h4>
                          <p className="text-blue-800 text-sm">
                            Implementasi flexible working hours untuk meningkatkan produktivitas karyawan
                          </p>
                        </div>
                        <div className="p-4 border-l-4 border-l-green-500 bg-green-50">
                          <h4 className="font-semibold text-green-900">Program Wellness</h4>
                          <p className="text-green-800 text-sm">
                            Inisiasi program kesehatan untuk mengurangi tingkat absensi karena sakit
                          </p>
                        </div>
                        <div className="p-4 border-l-4 border-l-purple-500 bg-purple-50">
                          <h4 className="font-semibold text-purple-900">Reward System</h4>
                          <p className="text-purple-800 text-sm">
                            Implementasi sistem penghargaan untuk karyawan dengan tingkat kehadiran tinggi
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

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
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { 
  DollarSign, 
  Calculator, 
  FileText, 
  Download,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Filter,
  Eye,
  Send,
  RefreshCw,
  Brain,
  BarChart3,
  Settings,
  CreditCard,
  Banknote,
  PiggyBank
} from "lucide-react";

interface PayrollRecord {
  id: number;
  employeeId: number;
  period: string;
  basicSalary: string;
  allowances: string;
  overtimePay: string;
  deductions: string;
  netSalary: string;
  tax: string;
  bpjsHealth: string;
  bpjsEmployment: string;
  status: string;
  processedAt: string | null;
  paidAt: string | null;
  employee: {
    firstName: string;
    lastName: string;
    employeeId: string;
    position: string;
    bankAccount: string;
    bankName: string;
  };
}

interface PayrollStats {
  totalEmployees: number;
  totalGrossSalary: number;
  totalNetSalary: number;
  totalDeductions: number;
  totalTax: number;
  processed: number;
  pending: number;
  paid: number;
}

interface PayrollInsight {
  type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  value?: number;
  recommendation?: string;
  trend?: 'up' | 'down' | 'stable';
}

export default function Payroll() {
  const { toast } = useToast();
  const { userRole } = usePermissions();
  
  // State management
  const [selectedPeriod, setSelectedPeriod] = useState(format(new Date(), "yyyy-MM"));
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [isAIAnalysisOpen, setIsAIAnalysisOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>("");

  // Check user permissions
  const isAdminOrHR = () => {
    return userRole.role === "admin" || userRole.role === "hr";
  };

  // Fetch payroll data
  const { data: payrollRecords = [], isLoading: isLoadingPayroll } = useQuery({
    queryKey: ["/api/payroll", selectedPeriod, statusFilter],
    enabled: isAdminOrHR(),
  });

  // Fetch payroll statistics
  const { data: payrollStats } = useQuery<PayrollStats>({
    queryKey: ["/api/payroll/stats", selectedPeriod],
    enabled: isAdminOrHR(),
  });

  // Fetch employees for filter
  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
    enabled: isAdminOrHR(),
  });

  // Process payroll mutation
  const processPayrollMutation = useMutation({
    mutationFn: async (data: { period: string; employeeIds?: number[] }) => {
      const response = await fetch("/api/payroll/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to process payroll");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      setIsProcessDialogOpen(false);
      toast({
        title: "Payroll Berhasil Diproses",
        description: "Kalkulasi payroll telah selesai dan siap untuk review",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal memproses payroll",
        variant: "destructive",
      });
    },
  });

  // Generate payslip mutation
  const generatePayslipMutation = useMutation({
    mutationFn: async (payrollId: number) => {
      const response = await fetch(`/api/payroll/${payrollId}/payslip`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to generate payslip");
      }
      return response.blob();
    },
    onSuccess: (blob, payrollId) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip-${payrollId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast({
        title: "Slip Gaji Berhasil Dibuat",
        description: "File PDF telah didownload",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal membuat slip gaji",
        variant: "destructive",
      });
    },
  });

  // AI insights mutation
  const generatePayrollInsightsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/payroll/ai-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          period: selectedPeriod,
          companyId: userRole.companyId,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate payroll insights");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setPayrollInsights(data);
      setIsAIAnalysisOpen(true);
      toast({
        title: "Analisis Payroll AI Selesai",
        description: "Insight kompensasi telah dihasilkan menggunakan DeepSeek AI",
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

  const [payrollInsights, setPayrollInsights] = useState<PayrollInsight[]>([]);

  // Helper functions
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return <Badge className="bg-blue-100 text-blue-800">Diproses</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Disetujui</Badge>;
      case "paid":
        return <Badge className="bg-green-600 text-white">Dibayar</Badge>;
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "rejected":
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter payroll records
  const filteredRecords = (payrollRecords as PayrollRecord[]).filter((record: PayrollRecord) => {
    const statusMatch = statusFilter === "all" || record.status === statusFilter;
    return statusMatch;
  });

  if (!isAdminOrHR()) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header pageTitle="Payroll & Slip Gaji" />
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
        <Header pageTitle="Payroll & Slip Gaji" />
        
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Manajemen Payroll</h1>
              <p className="text-muted-foreground">
                Kelola gaji karyawan dengan analisis AI DeepSeek untuk optimalisasi kompensasi
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => generatePayrollInsightsMutation.mutate()}
                disabled={generatePayrollInsightsMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Brain className="w-4 h-4 mr-2" />
                {generatePayrollInsightsMutation.isPending ? "Menganalisis..." : "Analisis AI"}
              </Button>
              <Button 
                onClick={() => setIsProcessDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Proses Payroll
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
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
                    <p className="text-2xl font-bold">{payrollStats?.totalEmployees || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Gaji Kotor</p>
                    <p className="text-2xl font-bold">{formatCurrency(payrollStats?.totalGrossSalary || 0)}</p>
                  </div>
                  <Banknote className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Gaji Bersih</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(payrollStats?.totalNetSalary || 0)}</p>
                  </div>
                  <PiggyBank className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status Pembayaran</p>
                    <p className="text-2xl font-bold text-primary">{payrollStats?.paid || 0}/{payrollStats?.totalEmployees || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-primary" />
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
                      type="month"
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="processed">Diproses</SelectItem>
                      <SelectItem value="approved">Disetujui</SelectItem>
                      <SelectItem value="paid">Dibayar</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={bulkAction} onValueChange={setBulkAction}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Aksi Bulk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generate_all">Generate Semua Slip</SelectItem>
                      <SelectItem value="approve_all">Setujui Semua</SelectItem>
                      <SelectItem value="send_email">Kirim Email</SelectItem>
                      <SelectItem value="mark_paid">Tandai Dibayar</SelectItem>
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
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/payroll"] })}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Data Payroll</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPayroll ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Memuat data payroll...</span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Belum Ada Data Payroll</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Klik "Proses Payroll" untuk memulai kalkulasi gaji periode ini
                  </p>
                  <Button onClick={() => setIsProcessDialogOpen(true)}>
                    <Calculator className="w-4 h-4 mr-2" />
                    Proses Payroll Sekarang
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 font-medium text-muted-foreground">Karyawan</th>
                        <th className="py-3 px-4 font-medium text-muted-foreground">Gaji Pokok</th>
                        <th className="py-3 px-4 font-medium text-muted-foreground">Lembur</th>
                        <th className="py-3 px-4 font-medium text-muted-foreground">Potongan</th>
                        <th className="py-3 px-4 font-medium text-muted-foreground">Gaji Bersih</th>
                        <th className="py-3 px-4 font-medium text-muted-foreground">Status</th>
                        <th className="py-3 px-4 font-medium text-muted-foreground">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record: PayrollRecord) => (
                        <tr key={record.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{record.employee.firstName} {record.employee.lastName}</p>
                              <p className="text-sm text-muted-foreground">{record.employee.employeeId} - {record.employee.position}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium">{formatCurrency(record.basicSalary)}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span>{formatCurrency(record.overtimePay)}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <p>BPJS: {formatCurrency(parseFloat(record.bpjsHealth) + parseFloat(record.bpjsEmployment))}</p>
                              <p>PPh21: {formatCurrency(record.tax)}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-green-600">{formatCurrency(record.netSalary)}</span>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(record.status)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPayroll(record);
                                  setIsDetailDialogOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generatePayslipMutation.mutate(record.id)}
                                disabled={generatePayslipMutation.isPending}
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Process Payroll Dialog */}
          <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Proses Payroll</DialogTitle>
                <DialogDescription>
                  Kalkulasi otomatis gaji berdasarkan data absensi dan konfigurasi kompensasi
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Periode</label>
                  <Input
                    type="month"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Komponen Kalkulasi:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Gaji pokok berdasarkan data karyawan</li>
                    <li>• Perhitungan lembur dari data absensi</li>
                    <li>• Potongan BPJS Kesehatan (4%) dan Ketenagakerjaan (2%)</li>
                    <li>• Perhitungan PPh21 sesuai regulasi</li>
                    <li>• Integrasi dengan Reward Wallet</li>
                  </ul>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsProcessDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button 
                    onClick={() => processPayrollMutation.mutate({ period: selectedPeriod })}
                    disabled={processPayrollMutation.isPending}
                  >
                    {processPayrollMutation.isPending ? "Memproses..." : "Proses Payroll"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Payroll Detail Dialog */}
          <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Detail Payroll</DialogTitle>
                <DialogDescription>
                  Informasi lengkap kalkulasi gaji karyawan
                </DialogDescription>
              </DialogHeader>
              
              {selectedPayroll && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Karyawan</label>
                      <p className="text-sm font-medium">
                        {selectedPayroll.employee.firstName} {selectedPayroll.employee.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedPayroll.employee.employeeId} - {selectedPayroll.employee.position}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Periode</label>
                      <p className="text-sm font-medium">
                        {format(parseISO(selectedPayroll.period + "-01"), "MMMM yyyy")}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Komponen Gaji</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Gaji Pokok</label>
                        <p className="text-sm font-medium">{formatCurrency(selectedPayroll.basicSalary)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Tunjangan</label>
                        <p className="text-sm font-medium">{formatCurrency(selectedPayroll.allowances)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Lembur</label>
                        <p className="text-sm font-medium">{formatCurrency(selectedPayroll.overtimePay)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Total Kotor</label>
                        <p className="text-sm font-medium">
                          {formatCurrency(
                            parseFloat(selectedPayroll.basicSalary) + 
                            parseFloat(selectedPayroll.allowances) + 
                            parseFloat(selectedPayroll.overtimePay)
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Potongan</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">BPJS Kesehatan</label>
                        <p className="text-sm font-medium">{formatCurrency(selectedPayroll.bpjsHealth)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">BPJS Ketenagakerjaan</label>
                        <p className="text-sm font-medium">{formatCurrency(selectedPayroll.bpjsEmployment)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">PPh21</label>
                        <p className="text-sm font-medium">{formatCurrency(selectedPayroll.tax)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Potongan Lain</label>
                        <p className="text-sm font-medium">{formatCurrency(selectedPayroll.deductions)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Gaji Bersih</label>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedPayroll.netSalary)}</p>
                    </div>
                    <div className="text-right">
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">
                        {getStatusBadge(selectedPayroll.status)}
                      </div>
                    </div>
                  </div>
                  
                  {selectedPayroll.employee.bankAccount && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Informasi Transfer</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Bank:</span>
                          <span className="ml-2 font-medium">{selectedPayroll.employee.bankName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rekening:</span>
                          <span className="ml-2 font-medium">{selectedPayroll.employee.bankAccount}</span>
                        </div>
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
                  Analisis AI DeepSeek - Optimalisasi Kompensasi
                </DialogTitle>
                <DialogDescription>
                  Insight dan rekomendasi berbasis AI untuk strategi kompensasi yang optimal
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="insights" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="insights">AI Insights</TabsTrigger>
                  <TabsTrigger value="analysis">Analisis Trend</TabsTrigger>
                  <TabsTrigger value="recommendations">Rekomendasi</TabsTrigger>
                </TabsList>

                <TabsContent value="insights" className="space-y-4">
                  {payrollInsights.length === 0 ? (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Belum ada analisis AI. Klik "Analisis AI" untuk memulai.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {payrollInsights.map((insight, index) => (
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
                                {insight.value && (
                                  <div className="mt-2">
                                    <span className="text-lg font-bold text-primary">{formatCurrency(insight.value)}</span>
                                    {insight.trend && (
                                      <span className={`ml-2 text-sm ${
                                        insight.trend === 'up' ? 'text-green-600' :
                                        insight.trend === 'down' ? 'text-red-600' :
                                        'text-gray-600'
                                      }`}>
                                        {insight.trend === 'up' ? '↗️' : insight.trend === 'down' ? '↘️' : '→'}
                                      </span>
                                    )}
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

                <TabsContent value="analysis" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Trend Kompensasi Bulanan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        <BarChart3 className="h-16 w-16 mb-4" />
                        <div className="text-center">
                          <p>Grafik trend kompensasi akan ditampilkan di sini</p>
                          <p className="text-sm">Berdasarkan analisis AI DeepSeek</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Rekomendasi Strategis Kompensasi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-4 border-l-4 border-l-blue-500 bg-blue-50">
                          <h4 className="font-semibold text-blue-900">Optimalisasi Struktur Gaji</h4>
                          <p className="text-blue-800 text-sm">
                            Review struktur gaji untuk memastikan keadilan internal dan daya saing eksternal
                          </p>
                        </div>
                        <div className="p-4 border-l-4 border-l-green-500 bg-green-50">
                          <h4 className="font-semibold text-green-900">Program Insentif Berbasis Kinerja</h4>
                          <p className="text-green-800 text-sm">
                            Implementasi sistem reward yang lebih proporsional berdasarkan pencapaian target
                          </p>
                        </div>
                        <div className="p-4 border-l-4 border-l-purple-500 bg-purple-50">
                          <h4 className="font-semibold text-purple-900">Benefit Non-Moneter</h4>
                          <p className="text-purple-800 text-sm">
                            Eksplorasi benefit tambahan seperti flexible working, health insurance premium, training budget
                          </p>
                        </div>
                        <div className="p-4 border-l-4 border-l-orange-500 bg-orange-50">
                          <h4 className="font-semibold text-orange-900">Budget Planning</h4>
                          <p className="text-orange-800 text-sm">
                            Prediksi budget payroll 6-12 bulan ke depan berdasarkan trend dan growth planning
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

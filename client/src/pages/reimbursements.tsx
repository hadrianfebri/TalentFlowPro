import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/api";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Receipt, 
  Plus, 
  Search,
  Filter,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Upload,
  Calendar,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Reimbursement {
  id: number;
  employeeId: number;
  category: string;
  amount: string;
  description?: string;
  receiptPhoto?: string;
  ocrData?: any;
  date: string;
  status: "pending" | "approved" | "rejected" | "paid";
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
  employee?: {
    firstName: string;
    lastName: string;
    employeeId: string;
  };
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
}

export default function Reimbursements() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user data to check role
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState<Reimbursement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const { data: reimbursements, isLoading } = useQuery<Reimbursement[]>({
    queryKey: ["/api/reimbursements"],
    enabled: isAuthenticated,
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: isAuthenticated,
  });

  const createReimbursementMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/reimbursements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reimbursements"] });
      setIsDialogOpen(false);
      toast({
        title: "Berhasil",
        description: "Pengajuan reimbursement berhasil ditambahkan",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Gagal menambahkan pengajuan reimbursement",
        variant: "destructive",
      });
    },
  });

  const approveReimbursementMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: number; action: "approve" | "reject"; reason?: string }) => 
      apiRequest("PATCH", `/api/reimbursements/${id}/${action}`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reimbursements"] });
      toast({
        title: "Berhasil",
        description: "Status reimbursement berhasil diperbarui",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Gagal memperbarui status reimbursement",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const reimbursementData = {
      employeeId: parseInt(formData.get("employeeId") as string),
      category: formData.get("category") as string,
      amount: formData.get("amount") as string,
      description: formData.get("description") as string,
      date: formData.get("date") as string,
      receiptPhoto: formData.get("receiptPhoto") ? "/receipts/placeholder.jpg" : undefined,
    };

    createReimbursementMutation.mutate(reimbursementData);
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = employees?.find(emp => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : `Employee ${employeeId}`;
  };

  const getCategoryName = (category: string) => {
    const categories: Record<string, string> = {
      transport: "Transportasi",
      meal: "Makan",
      accommodation: "Akomodasi",
      medical: "Kesehatan",
      office_supplies: "Perlengkapan Kantor",
      training: "Pelatihan",
      other: "Lainnya"
    };
    return categories[category] || category;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Menunggu", className: "bg-yellow-100 text-yellow-800" },
      approved: { label: "Disetujui", className: "bg-green-100 text-green-800" },
      rejected: { label: "Ditolak", className: "bg-red-100 text-red-800" },
      paid: { label: "Dibayar", className: "bg-blue-100 text-blue-800" }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Check if current user can approve/reject (admin or hr role)
  const canApprove = currentUser?.role === 'admin' || currentUser?.role === 'hr';

  const filteredReimbursements = reimbursements?.filter(reimbursement => {
    const matchesSearch = 
      reimbursement.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getEmployeeName(reimbursement.employeeId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCategoryName(reimbursement.category).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || reimbursement.status === filterStatus;
    const matchesCategory = filterCategory === "all" || reimbursement.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (authLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header pageTitle="Reimbursement" />
          <main className="flex-1 p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
          <p className="text-muted-foreground mb-4">You need to log in to access this page.</p>
          <Button onClick={() => window.location.href = "/api/login"}>
            Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header pageTitle="Reimbursement" />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reimbursement</h1>
                <p className="text-gray-600 mt-1">Kelola pengajuan reimbursement karyawan</p>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Reimbursement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Tambah Pengajuan Reimbursement</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="employeeId">Karyawan</Label>
                        <Select name="employeeId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih karyawan" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees?.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                {employee.firstName} {employee.lastName} ({employee.employeeId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="category">Kategori</Label>
                        <Select name="category" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="transport">Transportasi</SelectItem>
                            <SelectItem value="meal">Makan</SelectItem>
                            <SelectItem value="accommodation">Akomodasi</SelectItem>
                            <SelectItem value="medical">Kesehatan</SelectItem>
                            <SelectItem value="office_supplies">Perlengkapan Kantor</SelectItem>
                            <SelectItem value="training">Pelatihan</SelectItem>
                            <SelectItem value="other">Lainnya</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="amount">Jumlah (Rp)</Label>
                        <Input
                          type="number"
                          name="amount"
                          placeholder="0"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="date">Tanggal</Label>
                        <Input
                          type="date"
                          name="date"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Deskripsi</Label>
                      <Textarea
                        name="description"
                        placeholder="Jelaskan detail pengeluaran..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="receiptPhoto">Upload Bukti</Label>
                      <Input
                        type="file"
                        name="receiptPhoto"
                        accept="image/*,.pdf"
                        className="mt-2"
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Batal
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createReimbursementMutation.isPending}
                      >
                        {createReimbursementMutation.isPending ? "Menyimpan..." : "Simpan"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pengajuan</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reimbursements?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    pengajuan bulan ini
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Menunggu Approval</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reimbursements?.filter(r => r.status === "pending").length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    perlu ditindaklanjuti
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Rp {reimbursements?.reduce((sum, r) => sum + parseFloat(r.amount), 0).toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    total bulan ini
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reimbursements?.filter(r => r.status === "approved" || r.status === "paid").length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    pengajuan disetujui
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filter & Pencarian</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Cari berdasarkan karyawan, deskripsi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="pending">Menunggu</SelectItem>
                      <SelectItem value="approved">Disetujui</SelectItem>
                      <SelectItem value="rejected">Ditolak</SelectItem>
                      <SelectItem value="paid">Dibayar</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      <SelectItem value="transport">Transportasi</SelectItem>
                      <SelectItem value="meal">Makan</SelectItem>
                      <SelectItem value="accommodation">Akomodasi</SelectItem>
                      <SelectItem value="medical">Kesehatan</SelectItem>
                      <SelectItem value="office_supplies">Perlengkapan Kantor</SelectItem>
                      <SelectItem value="training">Pelatihan</SelectItem>
                      <SelectItem value="other">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Reimbursements Table */}
            <Card>
              <CardHeader>
                <CardTitle>Daftar Reimbursement</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Karyawan</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Dibuat</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReimbursements?.map((reimbursement) => (
                        <TableRow key={reimbursement.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{getEmployeeName(reimbursement.employeeId)}</div>
                              <div className="text-sm text-muted-foreground">
                                {reimbursement.employee?.employeeId}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getCategoryName(reimbursement.category)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              Rp {parseFloat(reimbursement.amount).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(reimbursement.date), 'dd MMM yyyy', { locale: id })}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(reimbursement.status)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{format(new Date(reimbursement.createdAt), 'dd MMM yyyy', { locale: id })}</div>
                              <div className="text-muted-foreground">
                                {format(new Date(reimbursement.createdAt), 'HH:mm', { locale: id })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Lihat Detail"
                                onClick={() => {
                                  setSelectedReimbursement(reimbursement);
                                  setIsViewDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {reimbursement.status === "pending" && canApprove && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Setujui"
                                    onClick={() => approveReimbursementMutation.mutate({ id: reimbursement.id, action: "approve" })}
                                    disabled={approveReimbursementMutation.isPending}
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Tolak"
                                    onClick={() => approveReimbursementMutation.mutate({ id: reimbursement.id, action: "reject", reason: "Tidak sesuai kebijakan" })}
                                    disabled={approveReimbursementMutation.isPending}
                                  >
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                
                {!isLoading && (!filteredReimbursements || filteredReimbursements.length === 0) && (
                  <div className="text-center py-8">
                    <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada reimbursement</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Belum ada pengajuan reimbursement yang sesuai dengan filter.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Reimbursement View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Reimbursement</DialogTitle>
          </DialogHeader>
          {selectedReimbursement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Karyawan</label>
                  <p className="text-sm font-medium">{getEmployeeName(selectedReimbursement.employeeId)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Kategori</label>
                  <div className="text-sm font-medium">
                    <Badge variant="outline">
                      {getCategoryName(selectedReimbursement.category)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Jumlah</label>
                  <p className="text-sm font-medium">
                    Rp {parseFloat(selectedReimbursement.amount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="text-sm font-medium">
                    {getStatusBadge(selectedReimbursement.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tanggal Transaksi</label>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedReimbursement.date), 'dd MMM yyyy', { locale: id })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dibuat</label>
                  <p className="text-sm font-medium">
                    {format(new Date(selectedReimbursement.createdAt), 'dd MMM yyyy HH:mm', { locale: id })}
                  </p>
                </div>
              </div>
              
              {selectedReimbursement.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Deskripsi</label>
                  <p className="text-sm">{selectedReimbursement.description}</p>
                </div>
              )}

              {selectedReimbursement.rejectionReason && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Alasan Penolakan</label>
                  <p className="text-sm text-red-600">{selectedReimbursement.rejectionReason}</p>
                </div>
              )}

              {selectedReimbursement.receiptPhoto && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Bukti Transaksi</label>
                  <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Receipt className="h-8 w-8 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Receipt Image</p>
                        <p className="text-xs text-muted-foreground">{selectedReimbursement.receiptPhoto}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(selectedReimbursement.receiptPhoto, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Lihat
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex space-x-2">
                  {selectedReimbursement.receiptPhoto && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        window.open(selectedReimbursement.receiptPhoto, '_blank');
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Lihat Bukti
                    </Button>
                  )}
                </div>
                <div className="flex space-x-2">
                  {selectedReimbursement.status === "pending" && (
                    <>
                      <Button
                        onClick={() => {
                          approveReimbursementMutation.mutate({ id: selectedReimbursement.id, action: "approve" });
                          setIsViewDialogOpen(false);
                        }}
                        disabled={approveReimbursementMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Setujui
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          approveReimbursementMutation.mutate({ id: selectedReimbursement.id, action: "reject", reason: "Tidak sesuai kebijakan" });
                          setIsViewDialogOpen(false);
                        }}
                        disabled={approveReimbursementMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Tolak
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
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
  Check, 
  X, 
  Camera,
  DollarSign,
  Clock,
  User,
  Search
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Reimbursement {
  id: number;
  employeeId: number;
  category: string;
  amount: string;
  description: string;
  receiptPhoto?: string;
  ocrData?: any;
  date: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approvedBy?: number;
  approvedAt?: string;
  rejectionReason?: string;
  paidAt?: string;
  createdAt: string;
  employee: {
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

export default function Reimbursement() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

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
        description: "Pengajuan reimbursement berhasil dibuat",
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
        description: "Gagal membuat pengajuan reimbursement",
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
      receiptPhoto: `/receipts/${Date.now()}_receipt.jpg`, // Placeholder path
    };

    createReimbursementMutation.mutate(reimbursementData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Disetujui</Badge>;
      case "rejected":
        return <Badge variant="destructive">Ditolak</Badge>;
      case "paid":
        return <Badge className="bg-blue-100 text-blue-800">Dibayar</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Menunggu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case "transport":
        return "Transportasi";
      case "meal":
        return "Makan";
      case "medical":
        return "Kesehatan";
      case "office":
        return "Kantor";
      case "training":
        return "Pelatihan";
      default:
        return category;
    }
  };

  const filteredReimbursements = reimbursements?.filter(reimb => {
    const matchesSearch = reimb.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reimb.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reimb.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || reimb.status === filterStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header pageTitle="Reimbursement" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            {/* Stats Cards */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Pengajuan</p>
                    <p className="text-3xl font-bold text-foreground">{reimbursements?.length || 0}</p>
                  </div>
                  <Receipt className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Menunggu Persetujuan</p>
                    <p className="text-3xl font-bold text-foreground">
                      {reimbursements?.filter(r => r.status === 'pending').length || 0}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Nilai</p>
                    <p className="text-3xl font-bold text-foreground">
                      Rp {reimbursements?.reduce((sum, r) => sum + parseFloat(r.amount), 0).toLocaleString('id-ID') || 0}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">OCR Processed</p>
                    <p className="text-3xl font-bold text-foreground">
                      {reimbursements?.filter(r => r.ocrData).length || 0}
                    </p>
                  </div>
                  <Camera className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="text-xl font-semibold">Pengajuan Reimbursement</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari reimbursement..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="pending">Menunggu</SelectItem>
                      <SelectItem value="approved">Disetujui</SelectItem>
                      <SelectItem value="rejected">Ditolak</SelectItem>
                      <SelectItem value="paid">Dibayar</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajukan Reimbursement
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Pengajuan Reimbursement Baru</DialogTitle>
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
                                {employees?.map((emp) => (
                                  <SelectItem key={emp.id} value={emp.id.toString()}>
                                    {emp.firstName} {emp.lastName} ({emp.employeeId})
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
                                <SelectItem value="medical">Kesehatan</SelectItem>
                                <SelectItem value="office">Kantor</SelectItem>
                                <SelectItem value="training">Pelatihan</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="amount">Nominal</Label>
                            <Input 
                              id="amount" 
                              name="amount" 
                              type="number" 
                              required 
                              placeholder="0"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="date">Tanggal</Label>
                            <Input 
                              id="date" 
                              name="date" 
                              type="date" 
                              required 
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="description">Deskripsi</Label>
                          <Textarea 
                            id="description" 
                            name="description" 
                            placeholder="Masukkan deskripsi pengeluaran..."
                            required 
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="receipt">Foto Struk</Label>
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                            <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Upload foto struk untuk OCR otomatis
                            </p>
                            <Input 
                              id="receipt" 
                              name="receipt" 
                              type="file" 
                              className="mt-2"
                              accept="image/*"
                            />
                          </div>
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
                            {createReimbursementMutation.isPending ? "Menyimpan..." : "Ajukan Reimbursement"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredReimbursements.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg mb-2">
                    {searchTerm || filterStatus !== "all" ? "Tidak ada reimbursement yang sesuai" : "Belum ada pengajuan reimbursement"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {searchTerm || filterStatus !== "all" ? "Coba ubah filter atau kata kunci pencarian" : "Buat pengajuan reimbursement pertama Anda"}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Karyawan</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Nominal</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReimbursements.map((reimbursement) => (
                        <TableRow key={reimbursement.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {reimbursement.employee.firstName} {reimbursement.employee.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {reimbursement.employee.employeeId}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getCategoryName(reimbursement.category)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="truncate" title={reimbursement.description}>
                                {reimbursement.description}
                              </p>
                              {reimbursement.ocrData && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs mt-1">
                                  OCR Processed
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              Rp {parseFloat(reimbursement.amount).toLocaleString('id-ID')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(reimbursement.date), 'dd MMM yyyy', { locale: id })}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(reimbursement.status)}</TableCell>
                          <TableCell className="text-right">
                            {reimbursement.status === 'pending' && (
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700"
                                  title="Setujui"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive/80"
                                  title="Tolak"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {reimbursement.receiptPhoto && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Lihat Struk"
                              >
                                <Camera className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

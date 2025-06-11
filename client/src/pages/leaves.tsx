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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Calendar, 
  Plus, 
  Check, 
  X, 
  Clock,
  CalendarDays,
  User,
  Filter,
  MoreHorizontal,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: number;
  approvedAt?: string;
  rejectionReason?: string;
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

export default function Leaves() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedLeaveForReject, setSelectedLeaveForReject] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedLeaveForDetail, setSelectedLeaveForDetail] = useState<LeaveRequest | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const { data: leaves, isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leaves"],
    enabled: isAuthenticated,
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: isAuthenticated,
  });

  const createLeaveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/leaves", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaves"] });
      setIsDialogOpen(false);
      toast({
        title: "Berhasil",
        description: "Pengajuan cuti berhasil dibuat",
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
        description: "Gagal membuat pengajuan cuti",
        variant: "destructive",
      });
    },
  });

  const approveLeaveMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PUT", `/api/leaves/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaves"] });
      toast({
        title: "Berhasil",
        description: "Pengajuan cuti telah disetujui",
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
        description: "Gagal menyetujui pengajuan cuti",
        variant: "destructive",
      });
    },
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => 
      apiRequest("PUT", `/api/leaves/${id}/reject`, { rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaves"] });
      setIsRejectDialogOpen(false);
      setSelectedLeaveForReject(null);
      setRejectionReason("");
      toast({
        title: "Berhasil",
        description: "Pengajuan cuti telah ditolak",
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
        description: "Gagal menolak pengajuan cuti",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const leaveData = {
      employeeId: parseInt(formData.get("employeeId") as string),
      leaveTypeId: parseInt(formData.get("leaveTypeId") as string),
      startDate,
      endDate,
      totalDays,
      reason: formData.get("reason") as string,
    };

    createLeaveMutation.mutate(leaveData);
  };

  const handleRejectLeave = (leave: LeaveRequest) => {
    setSelectedLeaveForReject(leave);
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (selectedLeaveForReject && rejectionReason.trim()) {
      rejectLeaveMutation.mutate({
        id: selectedLeaveForReject.id,
        reason: rejectionReason
      });
    }
  };

  const handleViewDetail = (leave: LeaveRequest) => {
    setSelectedLeaveForDetail(leave);
    setIsDetailDialogOpen(true);
  };

  const getLeaveTypeName = (typeId: number) => {
    const types = {
      1: "Cuti Tahunan",
      2: "Cuti Sakit", 
      3: "Cuti Melahirkan",
      4: "Cuti Khusus"
    };
    return types[typeId as keyof typeof types] || "Unknown";
  };

  // Filter leaves based on status and type
  const filteredLeaves = leaves?.filter((leave) => {
    const statusMatch = statusFilter === "all" || leave.status === statusFilter;
    const typeMatch = typeFilter === "all" || leave.leaveTypeId.toString() === typeFilter;
    return statusMatch && typeMatch;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Disetujui</Badge>;
      case "rejected":
        return <Badge variant="destructive">Ditolak</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Menunggu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
        <Header pageTitle="Cuti & Izin" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            {/* Stats Cards */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Pengajuan</p>
                    <p className="text-3xl font-bold text-foreground">{leaves?.length || 0}</p>
                  </div>
                  <CalendarDays className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Menunggu Persetujuan</p>
                    <p className="text-3xl font-bold text-foreground">
                      {leaves?.filter(l => l.status === 'pending').length || 0}
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
                    <p className="text-sm font-medium text-muted-foreground">Disetujui</p>
                    <p className="text-3xl font-bold text-foreground">
                      {leaves?.filter(l => l.status === 'approved').length || 0}
                    </p>
                  </div>
                  <Check className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ditolak</p>
                    <p className="text-3xl font-bold text-foreground">
                      {leaves?.filter(l => l.status === 'rejected').length || 0}
                    </p>
                  </div>
                  <X className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center mb-4">
                <CardTitle className="text-xl font-semibold">Daftar Pengajuan Cuti</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajukan Cuti
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Pengajuan Cuti Baru</DialogTitle>
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
                          <Label htmlFor="leaveTypeId">Jenis Cuti</Label>
                          <Select name="leaveTypeId" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih jenis cuti" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Cuti Tahunan</SelectItem>
                              <SelectItem value="2">Cuti Sakit</SelectItem>
                              <SelectItem value="3">Cuti Melahirkan</SelectItem>
                              <SelectItem value="4">Cuti Khusus</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startDate">Tanggal Mulai</Label>
                          <Input 
                            id="startDate" 
                            name="startDate" 
                            type="date" 
                            required 
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="endDate">Tanggal Selesai</Label>
                          <Input 
                            id="endDate" 
                            name="endDate" 
                            type="date" 
                            required 
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="reason">Alasan Cuti</Label>
                        <Textarea 
                          id="reason" 
                          name="reason" 
                          placeholder="Masukkan alasan pengajuan cuti..."
                          required 
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
                          disabled={createLeaveMutation.isPending}
                        >
                          {createLeaveMutation.isPending ? "Menyimpan..." : "Ajukan Cuti"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Filter Controls */}
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filter:</span>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="approved">Disetujui</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Jenis Cuti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenis</SelectItem>
                    <SelectItem value="1">Cuti Tahunan</SelectItem>
                    <SelectItem value="2">Cuti Sakit</SelectItem>
                    <SelectItem value="3">Cuti Melahirkan</SelectItem>
                    <SelectItem value="4">Cuti Khusus</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="text-sm text-muted-foreground">
                  Menampilkan {filteredLeaves.length} dari {leaves?.length || 0} pengajuan
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
              ) : !filteredLeaves || filteredLeaves.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg mb-2">
                    Belum ada pengajuan cuti
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Buat pengajuan cuti pertama Anda
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Karyawan</TableHead>
                        <TableHead>Jenis Cuti</TableHead>
                        <TableHead>Periode</TableHead>
                        <TableHead>Durasi</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Alasan</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeaves.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {leave.employee.firstName} {leave.employee.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {leave.employee.employeeId}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {leave.leaveTypeId === 1 ? "Cuti Tahunan" :
                             leave.leaveTypeId === 2 ? "Cuti Sakit" :
                             leave.leaveTypeId === 3 ? "Cuti Melahirkan" : "Cuti Khusus"}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{format(new Date(leave.startDate), 'dd MMM yyyy', { locale: id })}</div>
                              <div className="text-muted-foreground">
                                s/d {format(new Date(leave.endDate), 'dd MMM yyyy', { locale: id })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {leave.totalDays} hari
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(leave.status)}</TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate" title={leave.reason}>
                              {leave.reason}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center space-x-2">
                              {leave.status === 'pending' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                    onClick={() => approveLeaveMutation.mutate(leave.id)}
                                    disabled={approveLeaveMutation.isPending}
                                  >
                                    {approveLeaveMutation.isPending ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                                    ) : (
                                      <>
                                        <Check className="h-4 w-4 mr-1" />
                                        Setujui
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                    onClick={() => handleRejectLeave(leave)}
                                    disabled={rejectLeaveMutation.isPending}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Tolak
                                  </Button>
                                </>
                              )}
                              
                              {leave.status !== 'pending' && (
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                  {leave.status === 'approved' && (
                                    <div className="flex items-center text-green-600">
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Disetujui
                                    </div>
                                  )}
                                  {leave.status === 'rejected' && (
                                    <div className="flex items-center text-red-600">
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Ditolak
                                      {leave.rejectionReason && (
                                        <div className="text-xs text-muted-foreground ml-1">
                                          ({leave.rejectionReason})
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    className="text-sm cursor-pointer"
                                    onClick={() => handleViewDetail(leave)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Lihat Detail
                                  </DropdownMenuItem>
                                  {leave.status === 'pending' && (
                                    <>
                                      <DropdownMenuItem 
                                        className="text-sm text-green-600"
                                        onClick={() => approveLeaveMutation.mutate(leave.id)}
                                      >
                                        <Check className="h-4 w-4 mr-2" />
                                        Setujui Cuti
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        className="text-sm text-red-600"
                                        onClick={() => handleRejectLeave(leave)}
                                      >
                                        <X className="h-4 w-4 mr-2" />
                                        Tolak Cuti
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-sm text-muted-foreground">
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Kirim Pesan
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
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

      {/* Reject Leave Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Tolak Pengajuan Cuti
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedLeaveForReject && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span className="font-medium">
                    {selectedLeaveForReject.employee.firstName} {selectedLeaveForReject.employee.lastName}
                  </span>
                  <Badge variant="outline">{selectedLeaveForReject.employee.employeeId}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(selectedLeaveForReject.startDate), 'dd MMM yyyy', { locale: id })} - 
                    {format(new Date(selectedLeaveForReject.endDate), 'dd MMM yyyy', { locale: id })}
                  </span>
                  <Badge variant="outline">{selectedLeaveForReject.totalDays} hari</Badge>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Jenis: </span>
                  <span className="font-medium">{getLeaveTypeName(selectedLeaveForReject.leaveTypeId)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Alasan: </span>
                  <span>{selectedLeaveForReject.reason}</span>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="rejection-reason" className="text-sm font-medium">
                Alasan Penolakan <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="Masukkan alasan penolakan pengajuan cuti..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Alasan ini akan dikirimkan kepada karyawan sebagai notifikasi penolakan.
              </p>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectDialogOpen(false);
                  setSelectedLeaveForReject(null);
                  setRejectionReason("");
                }}
                disabled={rejectLeaveMutation.isPending}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectConfirm}
                disabled={rejectLeaveMutation.isPending || !rejectionReason.trim()}
                className="min-w-[100px]"
              >
                {rejectLeaveMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Menolak...</span>
                  </div>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Tolak Cuti
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leave Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Detail Pengajuan Cuti
            </DialogTitle>
          </DialogHeader>
          
          {selectedLeaveForDetail && (
            <div className="space-y-6">
              {/* Employee Information */}
              <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informasi Karyawan
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Nama Lengkap</Label>
                    <p className="font-medium">
                      {selectedLeaveForDetail.employee.firstName} {selectedLeaveForDetail.employee.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">ID Karyawan</Label>
                    <p className="font-medium">{selectedLeaveForDetail.employee.employeeId}</p>
                  </div>
                </div>
              </div>

              {/* Leave Information */}
              <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Informasi Cuti
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Jenis Cuti</Label>
                    <p className="font-medium">{getLeaveTypeName(selectedLeaveForDetail.leaveTypeId)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedLeaveForDetail.status)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Tanggal Mulai</Label>
                    <p className="font-medium">
                      {format(new Date(selectedLeaveForDetail.startDate), 'EEEE, dd MMMM yyyy', { locale: id })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Tanggal Selesai</Label>
                    <p className="font-medium">
                      {format(new Date(selectedLeaveForDetail.endDate), 'EEEE, dd MMMM yyyy', { locale: id })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Total Hari</Label>
                    <p className="font-medium">
                      <Badge variant="outline" className="text-sm">
                        {selectedLeaveForDetail.totalDays} hari
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Tanggal Pengajuan</Label>
                    <p className="font-medium">
                      {format(new Date(selectedLeaveForDetail.createdAt), 'dd MMMM yyyy, HH:mm', { locale: id })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Alasan Pengajuan
                </h3>
                <p className="text-sm leading-relaxed bg-background p-3 rounded border">
                  {selectedLeaveForDetail.reason}
                </p>
              </div>

              {/* Approval Information */}
              {selectedLeaveForDetail.status !== 'pending' && (
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                    {selectedLeaveForDetail.status === 'approved' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    Informasi {selectedLeaveForDetail.status === 'approved' ? 'Persetujuan' : 'Penolakan'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLeaveForDetail.approvedAt && (
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Tanggal {selectedLeaveForDetail.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                        </Label>
                        <p className="font-medium">
                          {format(new Date(selectedLeaveForDetail.approvedAt), 'dd MMMM yyyy, HH:mm', { locale: id })}
                        </p>
                      </div>
                    )}
                    {selectedLeaveForDetail.approvedBy && (
                      <div>
                        <Label className="text-sm text-muted-foreground">
                          {selectedLeaveForDetail.status === 'approved' ? 'Disetujui oleh' : 'Ditolak oleh'}
                        </Label>
                        <p className="font-medium">Admin/HR</p>
                      </div>
                    )}
                  </div>
                  {selectedLeaveForDetail.rejectionReason && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Alasan Penolakan</Label>
                      <p className="text-sm leading-relaxed bg-red-50 border border-red-200 p-3 rounded mt-1">
                        {selectedLeaveForDetail.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions for Pending Requests */}
              {selectedLeaveForDetail.status === 'pending' && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-semibold text-base mb-3">Aksi Admin/HR</h3>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                      onClick={() => {
                        setIsDetailDialogOpen(false);
                        approveLeaveMutation.mutate(selectedLeaveForDetail.id);
                      }}
                      disabled={approveLeaveMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Setujui Cuti
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => {
                        setIsDetailDialogOpen(false);
                        handleRejectLeave(selectedLeaveForDetail);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Tolak Cuti
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailDialogOpen(false);
                    setSelectedLeaveForDetail(null);
                  }}
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

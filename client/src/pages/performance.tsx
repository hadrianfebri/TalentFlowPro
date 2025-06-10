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
  BarChart3, 
  Plus, 
  Star, 
  TrendingUp,
  User,
  Search,
  Target,
  Award,
  Calendar
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface PerformanceReview {
  id: number;
  employeeId: number;
  period: string;
  targets?: any;
  achievements?: any;
  rating?: number;
  feedback?: string;
  reviewedBy?: number;
  status: 'draft' | 'completed';
  createdAt: string;
  updatedAt: string;
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

export default function Performance() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");

  const { data: performanceReviews, isLoading } = useQuery<PerformanceReview[]>({
    queryKey: ["/api/performance"],
    enabled: isAuthenticated,
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: isAuthenticated,
  });

  const createPerformanceMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/performance", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance"] });
      setIsDialogOpen(false);
      toast({
        title: "Berhasil",
        description: "Review performa berhasil dibuat",
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
        description: "Gagal membuat review performa",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const targets = {
      monthly_target: formData.get("monthlyTarget") as string,
      kpi_1: formData.get("kpi1") as string,
      kpi_2: formData.get("kpi2") as string,
    };

    const achievements = {
      achievement_1: formData.get("achievement1") as string,
      achievement_2: formData.get("achievement2") as string,
    };

    const performanceData = {
      employeeId: parseInt(formData.get("employeeId") as string),
      period: formData.get("period") as string,
      targets,
      achievements,
      rating: parseInt(formData.get("rating") as string),
      feedback: formData.get("feedback") as string,
      status: formData.get("status") as string || "draft",
    };

    createPerformanceMutation.mutate(performanceData);
  };

  const getRatingBadge = (rating?: number) => {
    if (!rating) return <Badge variant="outline">Belum Dinilai</Badge>;
    
    if (rating >= 4.5) return <Badge className="bg-green-100 text-green-800">Excellent ({rating})</Badge>;
    if (rating >= 3.5) return <Badge className="bg-blue-100 text-blue-800">Good ({rating})</Badge>;
    if (rating >= 2.5) return <Badge className="bg-yellow-100 text-yellow-800">Average ({rating})</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement ({rating})</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Selesai</Badge>;
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredReviews = performanceReviews?.filter(review => {
    const matchesSearch = review.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPeriod = filterPeriod === "all" || review.period === filterPeriod;
    return matchesSearch && matchesPeriod;
  }) || [];

  const averageRating = performanceReviews?.reduce((sum, review) => sum + (review.rating || 0), 0) / (performanceReviews?.length || 1);

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
        <Header pageTitle="Performance Mini" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            {/* Stats Cards */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Review</p>
                    <p className="text-3xl font-bold text-foreground">{performanceReviews?.length || 0}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rating Rata-rata</p>
                    <p className="text-3xl font-bold text-foreground">
                      {averageRating ? averageRating.toFixed(1) : "0.0"}
                    </p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Target Tercapai</p>
                    <p className="text-3xl font-bold text-foreground">
                      {performanceReviews?.filter(r => r.rating && r.rating >= 3.5).length || 0}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Top Performer</p>
                    <p className="text-3xl font-bold text-foreground">
                      {performanceReviews?.filter(r => r.rating && r.rating >= 4.5).length || 0}
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="text-xl font-semibold">Performance Reviews</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari karyawan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Periode</SelectItem>
                      <SelectItem value="2024-01">Januari 2024</SelectItem>
                      <SelectItem value="2024-02">Februari 2024</SelectItem>
                      <SelectItem value="2024-03">Maret 2024</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Review Baru
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Performance Review Baru</DialogTitle>
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
                            <Label htmlFor="period">Periode</Label>
                            <Input 
                              id="period" 
                              name="period" 
                              placeholder="YYYY-MM (contoh: 2024-01)"
                              required 
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg">Target Bulanan</h3>
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <Label htmlFor="monthlyTarget">Target Utama</Label>
                              <Input 
                                id="monthlyTarget" 
                                name="monthlyTarget" 
                                placeholder="Masukkan target utama..."
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="kpi1">KPI 1</Label>
                                <Input 
                                  id="kpi1" 
                                  name="kpi1" 
                                  placeholder="Key Performance Indicator 1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="kpi2">KPI 2</Label>
                                <Input 
                                  id="kpi2" 
                                  name="kpi2" 
                                  placeholder="Key Performance Indicator 2"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg">Pencapaian</h3>
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <Label htmlFor="achievement1">Pencapaian Utama</Label>
                              <Textarea 
                                id="achievement1" 
                                name="achievement1" 
                                placeholder="Deskripsikan pencapaian utama..."
                              />
                            </div>
                            <div>
                              <Label htmlFor="achievement2">Pencapaian Tambahan</Label>
                              <Textarea 
                                id="achievement2" 
                                name="achievement2" 
                                placeholder="Deskripsikan pencapaian tambahan..."
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="rating">Rating (1-5)</Label>
                            <Select name="rating" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih rating" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 - Needs Improvement</SelectItem>
                                <SelectItem value="2">2 - Below Average</SelectItem>
                                <SelectItem value="3">3 - Average</SelectItem>
                                <SelectItem value="4">4 - Good</SelectItem>
                                <SelectItem value="5">5 - Excellent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="status">Status</Label>
                            <Select name="status" defaultValue="draft">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="completed">Selesai</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="feedback">Feedback & Saran</Label>
                          <Textarea 
                            id="feedback" 
                            name="feedback" 
                            placeholder="Berikan feedback dan saran untuk pengembangan..."
                            rows={4}
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
                            disabled={createPerformanceMutation.isPending}
                          >
                            {createPerformanceMutation.isPending ? "Menyimpan..." : "Simpan Review"}
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
              ) : filteredReviews.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg mb-2">
                    {searchTerm || filterPeriod !== "all" ? "Tidak ada review yang sesuai" : "Belum ada performance review"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {searchTerm || filterPeriod !== "all" ? "Coba ubah filter atau kata kunci pencarian" : "Buat performance review pertama Anda"}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Karyawan</TableHead>
                        <TableHead>Periode</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Feedback</TableHead>
                        <TableHead>Tanggal Review</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReviews.map((review) => (
                        <TableRow key={review.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {review.employee.firstName} {review.employee.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {review.employee.employeeId}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              {review.period}
                            </div>
                          </TableCell>
                          <TableCell>{getRatingBadge(review.rating)}</TableCell>
                          <TableCell>{getStatusBadge(review.status)}</TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="text-sm truncate">
                                {review.targets?.monthly_target || "Belum diset"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="text-sm truncate" title={review.feedback}>
                                {review.feedback || "Belum ada feedback"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(review.updatedAt), 'dd MMM yyyy', { locale: id })}
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
    </div>
  );
}

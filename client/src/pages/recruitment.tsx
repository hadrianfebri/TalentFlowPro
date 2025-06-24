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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  UserPlus, 
  Plus, 
  Search,
  MapPin,
  DollarSign,
  Users,
  FileText,
  Star,
  Calendar,
  Briefcase,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Job {
  id: number;
  companyId: string;
  title: string;
  departmentId?: number;
  description?: string;
  requirements?: string;
  location?: string;
  salaryRange?: string;
  type: string;
  status: string;
  openings: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface JobApplication {
  id: number;
  jobId: number;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  resumePath?: string;
  coverLetter?: string;
  parsedResume?: any;
  keywordScore?: string;
  stage: string;
  notes?: string;
  interviewDate?: string;
  interview_date?: string; // Add snake_case version for backend compatibility
  offerAmount?: string;
  hiredDate?: string;
  createdAt: string;
  updatedAt: string;
  job: {
    title: string;
    department?: number;
  };
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
}

export default function Recruitment() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [isJobStatusDialogOpen, setIsJobStatusDialogOpen] = useState(false);
  const [isEditJobDialogOpen, setIsEditJobDialogOpen] = useState(false);
  const [isPostExternalDialogOpen, setIsPostExternalDialogOpen] = useState(false);

  const { data: jobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: isAuthenticated,
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<JobApplication[]>({
    queryKey: ["/api/job-applications"],
    enabled: isAuthenticated,
  });

  const createJobMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/jobs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setIsJobDialogOpen(false);
      toast({
        title: "Berhasil",
        description: "Lowongan pekerjaan berhasil dibuat",
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
        description: "Gagal membuat lowongan pekerjaan",
        variant: "destructive",
      });
    },
  });

  const updateApplicationMutation = useMutation({
    mutationFn: (data: { id: number; stage: string; notes?: string; interviewDate?: string; offerAmount?: string }) => 
      apiRequest("PATCH", `/api/job-applications/${data.id}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications"] });
      setIsApplicationDialogOpen(false);
      setSelectedApplication(null);
      toast({
        title: "Berhasil",
        description: "Status lamaran berhasil diperbarui",
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
        description: "Gagal memperbarui status lamaran",
        variant: "destructive",
      });
    },
  });

  const updateJobStatusMutation = useMutation({
    mutationFn: (data: { id: number; status: string }) => 
      apiRequest("PATCH", `/api/jobs/${data.id}/status`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setIsJobStatusDialogOpen(false);
      setSelectedJob(null);
      toast({
        title: "Berhasil",
        description: "Status lowongan berhasil diperbarui",
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
        description: "Gagal memperbarui status lowongan",
        variant: "destructive",
      });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: (data: { id: number; [key: string]: any }) => 
      apiRequest("PUT", `/api/jobs/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setIsEditJobDialogOpen(false);
      setSelectedJob(null);
      toast({
        title: "Berhasil",
        description: "Lowongan berhasil diperbarui",
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
        description: "Gagal memperbarui lowongan",
        variant: "destructive",
      });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/jobs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Berhasil",
        description: "Lowongan berhasil dihapus",
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
        description: "Gagal menghapus lowongan",
        variant: "destructive",
      });
    },
  });

  // Get platform status
  const { data: platformStatus } = useQuery({
    queryKey: ['/api/platform-status']
  });

  const postExternalMutation = useMutation({
    mutationFn: (data: { id: number; platforms: string[] }) => 
      apiRequest("POST", `/api/jobs/${data.id}/post-external`, { platforms: data.platforms }),
    onSuccess: (result: any) => {
      setIsPostExternalDialogOpen(false);
      setSelectedJob(null);
      
      const successfulPosts = result.results?.filter((r: any) => r.success) || [];
      const failedPosts = result.results?.filter((r: any) => !r.success) || [];

      if (successfulPosts.length > 0) {
        toast({
          title: "Berhasil Posting",
          description: `Berhasil posting ke ${successfulPosts.length} platform: ${successfulPosts.map((p: any) => p.platform).join(', ')}`,
        });
      }

      if (failedPosts.length > 0) {
        toast({
          title: "Sebagian Gagal",
          description: `Gagal posting ke: ${failedPosts.map((p: any) => `${p.platform} (${p.error})`).join(', ')}`,
          variant: "destructive",
        });
      }
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
        description: "Gagal posting ke platform eksternal",
        variant: "destructive",
      });
    },
  });

  const handleJobSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const jobData = {
      title: formData.get("title") as string,
      departmentId: formData.get("departmentId") ? parseInt(formData.get("departmentId") as string) : null,
      description: formData.get("description") as string,
      requirements: formData.get("requirements") as string,
      location: formData.get("location") as string,
      salaryRange: formData.get("salaryRange") as string,
      type: formData.get("type") as string,
      openings: parseInt(formData.get("openings") as string),
      status: "active",
    };

    createJobMutation.mutate(jobData);
  };

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Aktif</Badge>;
      case "inactive":
        return <Badge variant="secondary">Tidak Aktif</Badge>;
      case "closed":
        return <Badge variant="destructive">Ditutup</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getApplicationStageBadge = (stage: string) => {
    switch (stage) {
      case "applied":
        return <Badge className="bg-blue-100 text-blue-800">Melamar</Badge>;
      case "screening":
        return <Badge className="bg-yellow-100 text-yellow-800">Screening</Badge>;
      case "interview":
        return <Badge className="bg-purple-100 text-purple-800">Interview</Badge>;
      case "offer":
        return <Badge className="bg-green-100 text-green-800">Penawaran</Badge>;
      case "hired":
        return <Badge className="bg-green-500 text-white">Diterima</Badge>;
      case "rejected":
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{stage}</Badge>;
    }
  };

  const getJobTypeName = (type: string) => {
    switch (type) {
      case "full-time":
        return "Full Time";
      case "part-time":
        return "Part Time";
      case "contract":
        return "Kontrak";
      case "internship":
        return "Magang";
      default:
        return type;
    }
  };

  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || job.status === filterStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  const filteredApplications = applications?.filter(app => {
    const matchesSearch = app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.job.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
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
        <Header pageTitle="Recruitment Mini" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            {/* Stats Cards */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Lowongan</p>
                    <p className="text-3xl font-bold text-foreground">{jobs?.length || 0}</p>
                  </div>
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Pelamar</p>
                    <p className="text-3xl font-bold text-foreground">{applications?.length || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Interview</p>
                    <p className="text-3xl font-bold text-foreground">
                      {applications?.filter(a => a.stage === 'interview').length || 0}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Diterima</p>
                    <p className="text-3xl font-bold text-foreground">
                      {applications?.filter(a => a.stage === 'hired').length || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="jobs" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="jobs">Lowongan Pekerjaan</TabsTrigger>
              <TabsTrigger value="applications">Pelamar</TabsTrigger>
            </TabsList>

            {/* Jobs Tab */}
            <TabsContent value="jobs">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <CardTitle className="text-xl font-semibold">Manajemen Lowongan</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cari lowongan..."
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
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="inactive">Tidak Aktif</SelectItem>
                          <SelectItem value="closed">Ditutup</SelectItem>
                        </SelectContent>
                      </Select>
                      <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-primary hover:bg-primary/90">
                            <Plus className="h-4 w-4 mr-2" />
                            Buat Lowongan
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Buat Lowongan Pekerjaan Baru</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleJobSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="title">Judul Posisi</Label>
                                <Input 
                                  id="title" 
                                  name="title" 
                                  required 
                                  placeholder="Frontend Developer"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="departmentId">Departemen</Label>
                                <Select name="departmentId">
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih departemen" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">IT & Development</SelectItem>
                                    <SelectItem value="2">Sales & Marketing</SelectItem>
                                    <SelectItem value="3">Operations</SelectItem>
                                    <SelectItem value="4">HR & Admin</SelectItem>
                                    <SelectItem value="5">Finance</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="location">Lokasi</Label>
                                <Input 
                                  id="location" 
                                  name="location" 
                                  placeholder="Jakarta, Indonesia"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="type">Tipe Pekerjaan</Label>
                                <Select name="type" defaultValue="full-time">
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="full-time">Full Time</SelectItem>
                                    <SelectItem value="part-time">Part Time</SelectItem>
                                    <SelectItem value="contract">Kontrak</SelectItem>
                                    <SelectItem value="internship">Magang</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="salaryRange">Range Gaji</Label>
                                <Input 
                                  id="salaryRange" 
                                  name="salaryRange" 
                                  placeholder="Rp 8.000.000 - Rp 12.000.000"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="openings">Jumlah Posisi</Label>
                                <Input 
                                  id="openings" 
                                  name="openings" 
                                  type="number" 
                                  defaultValue="1"
                                  min="1"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="description">Deskripsi Pekerjaan</Label>
                              <Textarea 
                                id="description" 
                                name="description" 
                                placeholder="Deskripsikan tanggung jawab dan tugas pekerjaan..."
                                rows={4}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="requirements">Persyaratan</Label>
                              <Textarea 
                                id="requirements" 
                                name="requirements" 
                                placeholder="Deskripsikan kualifikasi dan persyaratan yang dibutuhkan..."
                                rows={4}
                              />
                            </div>
                            
                            <div className="flex justify-end space-x-2 pt-4">
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsJobDialogOpen(false)}
                              >
                                Batal
                              </Button>
                              <Button 
                                type="submit" 
                                disabled={createJobMutation.isPending}
                              >
                                {createJobMutation.isPending ? "Menyimpan..." : "Buat Lowongan"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {jobsLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </div>
                  ) : filteredJobs.length === 0 ? (
                    <div className="text-center py-12">
                      <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground text-lg mb-2">
                        {searchTerm || filterStatus !== "all" ? "Tidak ada lowongan yang sesuai" : "Belum ada lowongan pekerjaan"}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {searchTerm || filterStatus !== "all" ? "Coba ubah filter atau kata kunci pencarian" : "Buat lowongan pekerjaan pertama Anda"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredJobs.map((job) => (
                        <Card key={job.id} className="border border-border hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                                  {getJobStatusBadge(job.status)}
                                  <Badge variant="outline">{getJobTypeName(job.type)}</Badge>
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                  {job.location && (
                                    <div className="flex items-center">
                                      <MapPin className="h-4 w-4 mr-1" />
                                      {job.location}
                                    </div>
                                  )}
                                  {job.salaryRange && (
                                    <div className="flex items-center">
                                      <DollarSign className="h-4 w-4 mr-1" />
                                      {job.salaryRange}
                                    </div>
                                  )}
                                  <div className="flex items-center">
                                    <Users className="h-4 w-4 mr-1" />
                                    {job.openings} posisi
                                  </div>
                                </div>
                                
                                {job.description && (
                                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                    {job.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center justify-between">
                                  <div className="text-xs text-muted-foreground">
                                    Dibuat: {format(new Date(job.createdAt), 'dd MMM yyyy', { locale: id })}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">
                                      {applications?.filter(a => a.jobId === job.id).length || 0} pelamar
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-2 ml-4">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedJob(job);
                                    setIsEditJobDialogOpen(true);
                                  }}
                                  title="Edit Lowongan"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedJob(job);
                                    setIsPostExternalDialogOpen(true);
                                  }}
                                  title="Posting ke Platform Eksternal"
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    if (window.confirm('Yakin ingin menghapus lowongan ini?')) {
                                      deleteJobMutation.mutate(job.id);
                                    }
                                  }}
                                  title="Hapus Lowongan"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <CardTitle className="text-xl font-semibold">Pipeline Pelamar</CardTitle>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari pelamar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:w-64"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {applicationsLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : filteredApplications.length === 0 ? (
                    <div className="text-center py-12">
                      <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground text-lg mb-2">
                        {searchTerm ? "Tidak ada pelamar yang sesuai" : "Belum ada lamaran"}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {searchTerm ? "Coba ubah kata kunci pencarian" : "Pelamar akan muncul disini setelah mereka melamar"}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pelamar</TableHead>
                            <TableHead>Posisi</TableHead>
                            <TableHead>Stage</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Tanggal Lamar</TableHead>
                            <TableHead>Interview</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredApplications.map((application) => (
                            <TableRow key={application.id}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                    <UserPlus className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{application.applicantName}</p>
                                    <p className="text-xs text-muted-foreground">{application.applicantEmail}</p>
                                    {application.applicantPhone && (
                                      <p className="text-xs text-muted-foreground">{application.applicantPhone}</p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{application.job.title}</p>
                                </div>
                              </TableCell>
                              <TableCell>{getApplicationStageBadge(application.stage)}</TableCell>
                              <TableCell>
                                {application.keywordScore ? (
                                  <div className="flex items-center">
                                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                                    <span className="font-medium">{parseFloat(application.keywordScore).toFixed(1)}</span>
                                  </div>
                                ) : (
                                  <Badge variant="outline">Belum dianalisis</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {format(new Date(application.createdAt), 'dd MMM yyyy', { locale: id })}
                                </div>
                              </TableCell>
                              <TableCell>
                                {(application.interviewDate || application.interview_date) ? (
                                  <div className="text-sm">
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-1 text-primary" />
                                      {format(new Date(application.interviewDate || application.interview_date), 'dd MMM yyyy HH:mm', { locale: id })}
                                    </div>
                                  </div>
                                ) : (
                                  <Badge variant="outline">Belum dijadwalkan</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  {application.resumePath && (
                                    <Button variant="ghost" size="sm" title="Lihat CV">
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    title="Kelola Status"
                                    onClick={() => {
                                      setSelectedApplication(application);
                                      setIsApplicationDialogOpen(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
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
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Application Status Management Dialog */}
      <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kelola Status Lamaran</DialogTitle>
          </DialogHeader>
          
          {selectedApplication && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const stage = formData.get("stage") as string;
              const notes = formData.get("notes") as string;
              const interviewDate = formData.get("interviewDate") as string;
              const offerAmount = formData.get("offerAmount") as string;

              updateApplicationMutation.mutate({
                id: selectedApplication.id,
                stage,
                notes: notes || undefined,
                interviewDate: interviewDate || undefined,
                offerAmount: offerAmount || undefined,
              });
            }} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Pelamar</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedApplication.applicantName} - {selectedApplication.job.title}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Status Baru</Label>
                <Select name="stage" defaultValue={selectedApplication.stage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="applied">Melamar</SelectItem>
                    <SelectItem value="screening">Screening</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="test">Tes</SelectItem>
                    <SelectItem value="offer">Penawaran</SelectItem>
                    <SelectItem value="hired">Diterima</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interviewDate">Tanggal Interview (opsional)</Label>
                <Input 
                  name="interviewDate" 
                  type="datetime-local"
                  defaultValue={(selectedApplication.interviewDate || selectedApplication.interview_date) ? 
                    new Date(selectedApplication.interviewDate || selectedApplication.interview_date).toISOString().slice(0, 16) : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offerAmount">Nominal Penawaran (opsional)</Label>
                <Input 
                  name="offerAmount" 
                  placeholder="Rp 8.000.000"
                  defaultValue={selectedApplication.offerAmount || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea 
                  name="notes" 
                  placeholder="Tambahkan catatan mengenai status ini..."
                  defaultValue={selectedApplication.notes || ""}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsApplicationDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateApplicationMutation.isPending}
                >
                  {updateApplicationMutation.isPending ? "Menyimpan..." : "Perbarui Status"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Job Status Management Dialog */}
      <Dialog open={isJobStatusDialogOpen} onOpenChange={setIsJobStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kelola Status Lowongan</DialogTitle>
          </DialogHeader>
          
          {selectedJob && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const status = formData.get("status") as string;

              updateJobStatusMutation.mutate({
                id: selectedJob.id,
                status,
              });
            }} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Lowongan</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedJob.title} - {selectedJob.location}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status Baru</Label>
                <Select name="status" defaultValue={selectedJob.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Tidak Aktif</SelectItem>
                    <SelectItem value="closed">Ditutup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsJobStatusDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateJobStatusMutation.isPending}
                >
                  {updateJobStatusMutation.isPending ? "Menyimpan..." : "Perbarui Status"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Job Dialog */}
      <Dialog open={isEditJobDialogOpen} onOpenChange={setIsEditJobDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lowongan Pekerjaan</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const jobData = {
                id: selectedJob.id,
                title: formData.get("title"),
                description: formData.get("description"),
                requirements: formData.get("requirements"),
                location: formData.get("location"),
                salaryRange: formData.get("salaryRange"),
                type: formData.get("type"),
                openings: parseInt(formData.get("openings") as string),
              };
              updateJobMutation.mutate(jobData);
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Posisi</Label>
                  <Input name="title" defaultValue={selectedJob.title} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipe Pekerjaan</Label>
                  <Select name="type" defaultValue={selectedJob.type}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full Time</SelectItem>
                      <SelectItem value="part-time">Part Time</SelectItem>
                      <SelectItem value="contract">Kontrak</SelectItem>
                      <SelectItem value="internship">Magang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Lokasi</Label>
                  <Input name="location" defaultValue={selectedJob.location || ""} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salaryRange">Rentang Gaji</Label>
                  <Input name="salaryRange" defaultValue={selectedJob.salaryRange || ""} placeholder="Rp 5.000.000 - Rp 8.000.000" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="openings">Jumlah Posisi</Label>
                  <Input name="openings" type="number" defaultValue={selectedJob.openings} min="1" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi Pekerjaan</Label>
                <Textarea 
                  name="description" 
                  defaultValue={selectedJob.description || ""} 
                  rows={4} 
                  placeholder="Deskripsikan tanggung jawab dan tugas utama..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Persyaratan</Label>
                <Textarea 
                  name="requirements" 
                  defaultValue={selectedJob.requirements || ""} 
                  rows={4} 
                  placeholder="Tuliskan kualifikasi dan persyaratan yang dibutuhkan..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditJobDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateJobMutation.isPending}
                >
                  {updateJobMutation.isPending ? "Menyimpan..." : "Perbarui Lowongan"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Post to External Platforms Dialog */}
      <Dialog open={isPostExternalDialogOpen} onOpenChange={setIsPostExternalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Posting ke Platform Eksternal</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const selectedPlatforms = [];
              if (formData.get("jobstreet")) selectedPlatforms.push("jobstreet");
              if (formData.get("indeed")) selectedPlatforms.push("indeed");
              if (formData.get("linkedin")) selectedPlatforms.push("linkedin");
              if (formData.get("glints")) selectedPlatforms.push("glints");
              if (formData.get("kalibrr")) selectedPlatforms.push("kalibrr");
              
              if (selectedPlatforms.length === 0) {
                toast({
                  title: "Error",
                  description: "Pilih minimal satu platform",
                  variant: "destructive",
                });
                return;
              }
              
              postExternalMutation.mutate({
                id: selectedJob.id,
                platforms: selectedPlatforms
              });
            }} className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Pilih platform untuk memposting lowongan "{selectedJob.title}":
                </p>
                
                <div className="space-y-2">
                  {platformStatus ? (
                    platformStatus.platforms.map((platform: any) => (
                      <div key={platform.platform} className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            name={platform.platform} 
                            id={platform.platform} 
                            className="rounded" 
                            disabled={!platform.configured}
                          />
                          <label 
                            htmlFor={platform.platform} 
                            className={`text-sm ${!platform.configured ? 'text-muted-foreground' : ''}`}
                          >
                            {platform.name}
                          </label>
                        </div>
                        <div className="flex items-center space-x-1">
                          {platform.configured ? (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Siap
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                              Perlu API Key
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    // Fallback jika platform status belum dimuat
                    ['jobstreet', 'indeed', 'linkedin', 'glints', 'kalibrr'].map(platform => (
                      <div key={platform} className="flex items-center justify-between space-x-2">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" name={platform} id={platform} className="rounded" disabled />
                          <label htmlFor={platform} className="text-sm text-muted-foreground">
                            {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          </label>
                        </div>
                        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500 border-gray-200">
                          Loading...
                        </Badge>
                      </div>
                    ))
                  )}
                </div>

                {platformStatus && platformStatus.configuredCount === 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      <strong>Tidak ada platform yang terkonfigurasi.</strong> 
                      Silakan tambahkan API credentials untuk menggunakan posting eksternal. 
                      Lihat dokumentasi integrasi untuk panduan setup.
                    </p>
                  </div>
                )}

                {platformStatus && platformStatus.configuredCount > 0 && platformStatus.configuredCount < platformStatus.totalPlatforms && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      {platformStatus.configuredCount} dari {platformStatus.totalPlatforms} platform siap digunakan. 
                      Tambahkan API credentials untuk platform lainnya untuk jangkauan maksimal.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsPostExternalDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={postExternalMutation.isPending}
                >
                  {postExternalMutation.isPending ? "Posting..." : "Posting Lowongan"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

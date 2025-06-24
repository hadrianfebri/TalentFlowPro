import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, isUnauthorizedError } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Upload, FileText, Eye, Trash2, Download } from "lucide-react";
import { z } from "zod";
import { insertJobApplicationSchema } from "@shared/schema";

interface Job {
  id: number;
  title: string;
  location?: string;
  type: string;
  status: string;
}

interface JobApplication {
  id: number;
  jobId: number;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  resumePath?: string;
  stage: string;
  status: string;
  aiMatchScore?: string;
  createdAt: string;
  job: {
    title: string;
  };
}

const manualApplicantSchema = insertJobApplicationSchema.extend({
  resume_file: z.any().optional(),
  portfolio_files: z.array(z.any()).optional(),
  photo_file: z.any().optional(),
});

export default function ApplicantManagement() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { data: jobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: isAuthenticated,
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<JobApplication[]>({
    queryKey: ["/api/job-applications"],
    enabled: isAuthenticated,
  });

  // Manual form submission
  const createManualApplicationMutation = useMutation({
    mutationFn: (formData: FormData) => {
      return fetch('/api/job-applications', {
        method: 'POST',
        body: formData,
      }).then(res => {
        if (!res.ok) throw new Error('Failed to create application');
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications"] });
      setIsManualDialogOpen(false);
      toast({
        title: "Berhasil",
        description: "Pelamar berhasil ditambahkan",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Gagal menambahkan pelamar",
        variant: "destructive",
      });
    },
  });

  // AI scoring mutation
  const aiScoringMutation = useMutation({
    mutationFn: (applicationId: number) => {
      return apiRequest(`/api/job-applications/${applicationId}/ai-score`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications"] });
      toast({
        title: "AI Scoring Complete",
        description: "CV telah dianalisis dan diberi score",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Gagal melakukan AI scoring",
        variant: "destructive",
      });
    },
  });

  // Bulk CV upload
  const bulkUploadMutation = useMutation({
    mutationFn: (data: { files: FileList; jobId?: number }) => {
      const formData = new FormData();
      
      // Add each CV file with proper field name for multer
      Array.from(data.files).forEach((file, index) => {
        formData.append(`cv_file`, file);
      });
      
      if (data.jobId) {
        formData.append('jobId', data.jobId.toString());
      }

      return fetch('/api/job-applications/bulk-cv-upload', {
        method: 'POST',
        body: formData,
      }).then(res => {
        if (!res.ok) throw new Error('Failed to upload CVs');
        return res.json();
      });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications"] });
      setIsBulkUploadDialogOpen(false);
      setSelectedFiles(null);
      
      toast({
        title: "Upload Berhasil",
        description: `${result.successCount} CV berhasil diproses, ${result.failedCount} gagal`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Gagal upload CV",
        variant: "destructive",
      });
    },
  });

  const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    createManualApplicationMutation.mutate(formData);
  };

  const handleBulkUpload = (files: FileList, jobId?: number) => {
    bulkUploadMutation.mutate({ files, jobId });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFiles(e.dataTransfer.files);
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
        <Header pageTitle="Manajemen Pelamar" />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header with action buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Manajemen Pelamar</h1>
              <p className="text-muted-foreground">Tambah pelamar secara manual atau upload CV massal</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Tambah Manual
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Tambah Pelamar Manual</DialogTitle>
                    <DialogDescription>
                      Isi form untuk menambah pelamar baru secara manual
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="applicantName">Nama Lengkap</Label>
                        <Input name="applicantName" required />
                      </div>
                      <div>
                        <Label htmlFor="applicantEmail">Email</Label>
                        <Input name="applicantEmail" type="email" required />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="applicantPhone">Nomor Telepon</Label>
                        <Input name="applicantPhone" />
                      </div>
                      <div>
                        <Label htmlFor="jobId">Posisi yang Dilamar</Label>
                        <Select name="jobId">
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih posisi" />
                          </SelectTrigger>
                          <SelectContent>
                            {jobs?.map((job) => (
                              <SelectItem key={job.id} value={job.id.toString()}>
                                {job.title} - {job.location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>



                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="experienceYears">Pengalaman (Tahun)</Label>
                        <Input name="experienceYears" type="number" min="0" />
                      </div>
                      <div>
                        <Label htmlFor="educationLevel">Pendidikan Terakhir</Label>
                        <Select name="educationLevel">
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih pendidikan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sma">SMA/SMK</SelectItem>
                            <SelectItem value="diploma">Diploma</SelectItem>
                            <SelectItem value="sarjana">S1</SelectItem>
                            <SelectItem value="magister">S2</SelectItem>
                            <SelectItem value="doktor">S3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="resume_file">Upload CV (PDF/DOC)</Label>
                      <Input name="resume_file" type="file" accept=".pdf,.doc,.docx" />
                    </div>

                    <div>
                      <Label htmlFor="photo_file">Foto (Opsional)</Label>
                      <Input name="photo_file" type="file" accept="image/*" />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsManualDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button type="submit" disabled={createManualApplicationMutation.isPending}>
                        {createManualApplicationMutation.isPending ? "Menyimpan..." : "Simpan"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isBulkUploadDialogOpen} onOpenChange={setIsBulkUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CV Massal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Upload CV Massal</DialogTitle>
                    <DialogDescription>
                      Upload beberapa file CV sekaligus untuk ekstraksi otomatis
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bulk_job_id">Posisi yang Dilamar (Opsional)</Label>
                      <Select name="bulk_job_id">
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih posisi atau kosongkan untuk umum" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobs?.map((job) => (
                            <SelectItem key={job.id} value={job.id.toString()}>
                              {job.title} - {job.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-lg font-medium mb-2">Upload File CV</p>
                      <p className="text-gray-500 mb-4">
                        Drag & drop file CV atau klik untuk browse
                      </p>
                      <p className="text-sm text-gray-400 mb-4">
                        Format: PDF, DOC, DOCX (Max 10MB per file)
                      </p>
                      
                      <Input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setSelectedFiles(e.target.files)}
                        className="hidden"
                        id="cv-upload"
                      />
                      <Label htmlFor="cv-upload" className="cursor-pointer">
                        <Button type="button" variant="outline">
                          Pilih File
                        </Button>
                      </Label>
                    </div>

                    {selectedFiles && selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <Label>File yang dipilih:</Label>
                        <div className="max-h-32 overflow-y-auto">
                          {Array.from(selectedFiles).map((file, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm truncate">{file.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(file.size / 1024 / 1024).toFixed(1)} MB)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsBulkUploadDialogOpen(false);
                        setSelectedFiles(null);
                      }}>
                        Batal
                      </Button>
                      <Button 
                        onClick={() => selectedFiles && handleBulkUpload(selectedFiles)}
                        disabled={!selectedFiles || selectedFiles.length === 0 || bulkUploadMutation.isPending}
                      >
                        {bulkUploadMutation.isPending ? "Mengupload..." : "Upload & Proses"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Applications Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Pelamar</CardTitle>
              <CardDescription>
                {applications?.length || 0} pelamar terdaftar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Posisi</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>AI Score</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications?.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">
                          {application.applicantName}
                        </TableCell>
                        <TableCell>{application.applicantEmail}</TableCell>
                        <TableCell>{application.job.title}</TableCell>
                        <TableCell>
                          {getApplicationStageBadge(application.stage)}
                        </TableCell>
                        <TableCell>
                          {application.aiMatchScore ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {Math.round(parseFloat(application.aiMatchScore))}%
                            </Badge>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => aiScoringMutation.mutate(application.id)}
                              disabled={aiScoringMutation.isPending}
                            >
                              {aiScoringMutation.isPending ? "Analyzing..." : "Score CV"}
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(application.createdAt).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedApplication(application);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {application.resumePath && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => window.open(`/uploads/${application.resumePath}`, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* View Applicant Sheet */}
          <Sheet open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <SheetContent className="w-[600px] sm:w-[600px]">
              <SheetHeader>
                <SheetTitle>Detail Pelamar</SheetTitle>
                <SheetDescription>
                  Informasi lengkap kandidat dan analisis CV
                </SheetDescription>
              </SheetHeader>
              
              {selectedApplication && (
                <div className="mt-6 space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informasi Dasar</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Nama Lengkap</Label>
                        <p className="text-sm text-muted-foreground">{selectedApplication.applicantName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Email</Label>
                        <p className="text-sm text-muted-foreground">{selectedApplication.applicantEmail}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Telepon</Label>
                        <p className="text-sm text-muted-foreground">{selectedApplication.applicantPhone || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Posisi</Label>
                        <p className="text-sm text-muted-foreground">{selectedApplication.job?.title || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Analisis AI</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Match Score</Label>
                        <div className="flex items-center gap-2 mt-1">
                          {selectedApplication.aiMatchScore ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {Math.round(parseFloat(selectedApplication.aiMatchScore))}%
                            </Badge>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => aiScoringMutation.mutate(selectedApplication.id)}
                              disabled={aiScoringMutation.isPending}
                            >
                              {aiScoringMutation.isPending ? "Analyzing..." : "Generate Score"}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="mt-1">
                          {getApplicationStageBadge(selectedApplication.stage)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Files */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Dokumen</h3>
                    <div className="space-y-2">
                      {selectedApplication.resumePath && (
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">CV / Resume</span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`/uploads/${selectedApplication.resumePath}`, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Application Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Info Aplikasi</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Tanggal Melamar</Label>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedApplication.createdAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Source</Label>
                        <p className="text-sm text-muted-foreground">Manual Entry</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </main>
      </div>
    </div>
  );
}
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
  FileText, 
  Plus, 
  Download, 
  Edit, 
  Search,
  Upload,
  File,
  FileCheck,
  Users
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Document {
  id: number;
  employeeId?: number;
  companyId: string;
  type: string;
  name: string;
  description?: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  isTemplate: boolean;
  templateVariables?: any;
  signedBy?: any;
  signedAt?: string;
  createdBy: string;
  createdAt: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
}

export default function Documents() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterEmployee, setFilterEmployee] = useState("all");

  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    enabled: isAuthenticated,
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: isAuthenticated,
  });

  const createDocumentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/documents", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setIsDialogOpen(false);
      toast({
        title: "Berhasil",
        description: "Dokumen berhasil ditambahkan",
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
        description: "Gagal menambahkan dokumen",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const documentData = {
      employeeId: formData.get("employeeId") ? parseInt(formData.get("employeeId") as string) : null,
      type: formData.get("type") as string,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      filePath: `/documents/${Date.now()}_${formData.get("name")}`, // Placeholder path
      isTemplate: formData.get("isTemplate") === "true",
    };

    createDocumentMutation.mutate(documentData);
  };

  const filteredDocuments = documents?.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || doc.type === filterType;
    const matchesEmployee = filterEmployee === "all" || 
                           (filterEmployee === "company" && !doc.employeeId) ||
                           doc.employeeId?.toString() === filterEmployee;
    return matchesSearch && matchesType && matchesEmployee;
  }) || [];

  const getEmployeeName = (employeeId?: number) => {
    if (!employeeId) return "Dokumen Perusahaan";
    const employee = employees?.find(emp => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "Karyawan Tidak Ditemukan";
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "contract":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "policy":
        return <FileCheck className="h-5 w-5 text-green-500" />;
      case "letter":
        return <File className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getDocumentTypeName = (type: string) => {
    switch (type) {
      case "contract":
        return "Kontrak";
      case "policy":
        return "Kebijakan";
      case "letter":
        return "Surat";
      case "template":
        return "Template";
      default:
        return type;
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
        <Header pageTitle="Dokumen & Template" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            {/* Stats Cards */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Dokumen</p>
                    <p className="text-3xl font-bold text-foreground">{documents?.length || 0}</p>
                  </div>
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Template</p>
                    <p className="text-3xl font-bold text-foreground">
                      {documents?.filter(d => d.isTemplate).length || 0}
                    </p>
                  </div>
                  <File className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Kontrak</p>
                    <p className="text-3xl font-bold text-foreground">
                      {documents?.filter(d => d.type === 'contract').length || 0}
                    </p>
                  </div>
                  <FileCheck className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">E-Sign Ready</p>
                    <p className="text-3xl font-bold text-foreground">
                      {documents?.filter(d => d.signedBy).length || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="text-xl font-semibold">Manajemen Dokumen</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari dokumen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Jenis</SelectItem>
                      <SelectItem value="contract">Kontrak</SelectItem>
                      <SelectItem value="policy">Kebijakan</SelectItem>
                      <SelectItem value="letter">Surat</SelectItem>
                      <SelectItem value="template">Template</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter Karyawan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Dokumen</SelectItem>
                      <SelectItem value="company">Dokumen Perusahaan</SelectItem>
                      {employees?.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.firstName} {emp.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Dokumen
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Tambah Dokumen Baru</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Nama Dokumen</Label>
                            <Input 
                              id="name" 
                              name="name" 
                              required 
                              placeholder="Masukkan nama dokumen"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="type">Jenis Dokumen</Label>
                            <Select name="type" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih jenis dokumen" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="contract">Kontrak</SelectItem>
                                <SelectItem value="policy">Kebijakan</SelectItem>
                                <SelectItem value="letter">Surat</SelectItem>
                                <SelectItem value="template">Template</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="employeeId">Karyawan (Opsional)</Label>
                          <Select name="employeeId">
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih karyawan (kosongkan untuk dokumen umum)" />
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
                          <Label htmlFor="description">Deskripsi</Label>
                          <Textarea 
                            id="description" 
                            name="description" 
                            placeholder="Masukkan deskripsi dokumen..."
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="file">Upload File</Label>
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Drag & drop file atau klik untuk upload
                            </p>
                            <Input 
                              id="file" 
                              name="file" 
                              type="file" 
                              className="mt-2"
                              accept=".pdf,.doc,.docx,.xls,.xlsx"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="isTemplate" 
                            name="isTemplate" 
                            value="true"
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="isTemplate" className="text-sm">
                            Jadikan sebagai template untuk dokumen serupa
                          </Label>
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
                            disabled={createDocumentMutation.isPending}
                          >
                            {createDocumentMutation.isPending ? "Menyimpan..." : "Simpan Dokumen"}
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
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg mb-2">
                    {searchTerm || filterType !== "all" ? "Tidak ada dokumen yang sesuai" : "Belum ada dokumen"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {searchTerm || filterType !== "all" ? "Coba ubah filter atau kata kunci pencarian" : "Tambahkan dokumen pertama Anda"}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dokumen</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Karyawan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Dibuat</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.map((document) => (
                        <TableRow key={document.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              {getDocumentIcon(document.type)}
                              <div>
                                <p className="font-medium">{document.name}</p>
                                {document.description && (
                                  <p className="text-xs text-muted-foreground max-w-xs truncate">
                                    {document.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getDocumentTypeName(document.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {document.employeeId ? (
                              <div className="text-sm">
                                <p className="font-medium">{getEmployeeName(document.employeeId)}</p>
                                <p className="text-muted-foreground">
                                  ID: {employees?.find(emp => emp.id === document.employeeId)?.employeeId || document.employeeId}
                                </p>
                              </div>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800">
                                Dokumen Perusahaan
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {document.isTemplate && (
                                <Badge className="bg-purple-100 text-purple-800 w-fit">
                                  Template
                                </Badge>
                              )}
                              {document.signedBy ? (
                                <Badge className="bg-green-100 text-green-800 w-fit">
                                  Ditandatangani
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="w-fit">
                                  Draft
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{format(new Date(document.createdAt), 'dd MMM yyyy', { locale: id })}</div>
                              <div className="text-muted-foreground">
                                {format(new Date(document.createdAt), 'HH:mm', { locale: id })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
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
        </main>
      </div>
    </div>
  );
}

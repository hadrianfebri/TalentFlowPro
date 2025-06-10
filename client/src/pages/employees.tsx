import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, PlusIcon, EyeIcon, EditIcon, Trash2Icon, UserIcon, BriefcaseIcon, CreditCardIcon, FileTextIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

interface Employee {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  birthPlace?: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  religion?: string;
  homeAddress?: string;
  phone?: string;
  personalEmail?: string;
  workEmail: string;
  emergencyContact?: any;
  nik?: string;
  npwp?: string;
  bpjsHealthNumber?: string;
  bpjsEmploymentNumber?: string;
  education?: any;
  position: string;
  departmentId?: number;
  hireDate: string;
  employmentStatus: string;
  workLocation?: string;
  basicSalary?: string;
  bankAccount?: string;
  bankName?: string;
  status: string;
  companyId: string;
  notes?: string;
  createdAt: string;
}

const employeeFormSchema = z.object({
  // Data Pribadi - Identitas
  employeeId: z.string().min(1, "ID Karyawan wajib diisi"),
  firstName: z.string().min(1, "Nama depan wajib diisi"),
  lastName: z.string().min(1, "Nama belakang wajib diisi"),
  birthPlace: z.string().optional(),
  birthDate: z.date().optional(),
  gender: z.enum(["L", "P"]).optional(),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional(),
  nationality: z.string().default("Indonesia"),
  religion: z.enum(["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"]).optional(),
  
  // Data Pribadi - Kontak
  homeAddress: z.string().optional(),
  phone: z.string().optional(),
  personalEmail: z.string().email().optional().or(z.literal("")),
  workEmail: z.string().email("Email kerja wajib valid"),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  
  // Data Pribadi - Identifikasi
  nik: z.string().optional(),
  npwp: z.string().optional(),
  bpjsHealthNumber: z.string().optional(),
  bpjsEmploymentNumber: z.string().optional(),
  
  // Data Pribadi - Pendidikan
  educationLevel: z.string().optional(),
  educationInstitution: z.string().optional(),
  educationMajor: z.string().optional(),
  educationYear: z.string().optional(),
  certifications: z.string().optional(),
  
  // Data Pekerjaan
  position: z.string().min(1, "Posisi wajib diisi"),
  hireDate: z.date(),
  employmentStatus: z.enum(["permanent", "contract", "internship", "part_time"]),
  workLocation: z.enum(["head_office", "branch", "remote", "hybrid"]).optional(),
  
  // Data Finansial
  basicSalary: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  
  // Meta
  notes: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

export default function Employees() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [employmentStatusFilter, setEmploymentStatusFilter] = useState<string>("all");
  const [tenureFilter, setTenureFilter] = useState<string>("all");
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { isAdminOrHR } = usePermissions();

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["/api/employees"],
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      employmentStatus: "permanent",
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const payload = {
        ...data,
        birthDate: data.birthDate?.toISOString().split('T')[0],
        hireDate: data.hireDate.toISOString().split('T')[0],
        emergencyContact: data.emergencyContactName ? {
          name: data.emergencyContactName,
          phone: data.emergencyContactPhone,
          relationship: data.emergencyContactRelation,
        } : null,
        education: data.educationLevel ? {
          level: data.educationLevel,
          institution: data.educationInstitution,
          major: data.educationMajor,
          graduationYear: data.educationYear,
          certifications: data.certifications?.split(',').map(c => c.trim()).filter(Boolean) || [],
        } : null,
      };
      
      // Remove form-specific fields
      const { emergencyContactName, emergencyContactPhone, emergencyContactRelation, 
              educationLevel, educationInstitution, educationMajor, educationYear, certifications, 
              ...finalPayload } = payload;
      
      return apiRequest("POST", "/api/employees", finalPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Berhasil",
        description: "Data karyawan berhasil ditambahkan",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan karyawan",
        variant: "destructive",
      });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      return apiRequest("DELETE", `/api/employees/${employeeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Berhasil",
        description: "Data karyawan berhasil dihapus",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus karyawan",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      active: "default",
      inactive: "secondary",
      terminated: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getEmploymentStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      permanent: "default",
      contract: "secondary",
      internship: "outline",
      part_time: "outline",
    };
    const labels: Record<string, string> = {
      permanent: "Tetap",
      contract: "Kontrak", 
      internship: "Magang",
      part_time: "Paruh Waktu",
    };
    return <Badge variant={variants[status] || "secondary"}>
      {labels[status] || status}
    </Badge>;
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const calculateTenure = (hireDate: string) => {
    const hire = new Date(hireDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hire.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years} tahun ${months} bulan`;
    } else {
      return `${months} bulan`;
    }
  };

  const checkContractExpiry = (employee: Employee) => {
    if (employee.employmentStatus !== 'contract') return null;
    
    // Assuming contract is 1 year from hire date for demo
    const hireDate = new Date(employee.hireDate);
    const contractEndDate = new Date(hireDate);
    contractEndDate.setFullYear(contractEndDate.getFullYear() + 1);
    
    const now = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    
    if (contractEndDate <= oneMonthFromNow && contractEndDate > now) {
      const daysLeft = Math.ceil((contractEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        expiring: true,
        daysLeft,
        endDate: contractEndDate
      };
    }
    
    return null;
  };

  const filteredEmployees = employees.filter((employee: Employee) => {
    // Search filter
    const searchMatch = !searchQuery || 
      employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.workEmail.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const statusMatch = statusFilter === "all" || employee.status === statusFilter;

    // Employment status filter
    const empStatusMatch = employmentStatusFilter === "all" || employee.employmentStatus === employmentStatusFilter;

    // Tenure filter
    let tenureMatch = true;
    if (tenureFilter !== "all") {
      const hireDate = new Date(employee.hireDate);
      const now = new Date();
      const diffMonths = (now.getFullYear() - hireDate.getFullYear()) * 12 + now.getMonth() - hireDate.getMonth();
      
      switch (tenureFilter) {
        case "new": // < 6 months
          tenureMatch = diffMonths < 6;
          break;
        case "junior": // 6 months - 2 years
          tenureMatch = diffMonths >= 6 && diffMonths <= 24;
          break;
        case "senior": // 2-5 years
          tenureMatch = diffMonths > 24 && diffMonths <= 60;
          break;
        case "veteran": // > 5 years
          tenureMatch = diffMonths > 60;
          break;
      }
    }

    return searchMatch && statusMatch && empStatusMatch && tenureMatch;
  });

  const contractExpiryNotifications = employees
    .map((emp: Employee) => ({ employee: emp, expiry: checkContractExpiry(emp) }))
    .filter(item => item.expiry?.expiring);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoadingEmployees) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header pageTitle="Data Karyawan" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Memuat data karyawan...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header pageTitle="Data Karyawan" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Data Karyawan</h1>
                <p className="text-muted-foreground">Kelola informasi karyawan sesuai standar HR Indonesia</p>
              </div>
              {isAdminOrHR() && (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Tambah Karyawan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Tambah Karyawan Baru</DialogTitle>
                      <DialogDescription>
                        Lengkapi data karyawan sesuai standar HR Indonesia
                      </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit((data) => createEmployeeMutation.mutate(data))} className="space-y-6">
                        <Tabs defaultValue="personal" className="w-full">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="personal" className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4" />
                              Data Pribadi
                            </TabsTrigger>
                            <TabsTrigger value="job" className="flex items-center gap-2">
                              <BriefcaseIcon className="h-4 w-4" />
                              Data Pekerjaan
                            </TabsTrigger>
                            <TabsTrigger value="financial" className="flex items-center gap-2">
                              <CreditCardIcon className="h-4 w-4" />
                              Data Finansial
                            </TabsTrigger>
                            <TabsTrigger value="additional" className="flex items-center gap-2">
                              <FileTextIcon className="h-4 w-4" />
                              Tambahan
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="personal" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="employeeId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>ID Karyawan *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="EMP006" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div></div>
                              
                              <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nama Depan *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Ahmad" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nama Belakang *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Santoso" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="birthPlace"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Tempat Lahir</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Jakarta" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="birthDate"
                                render={({ field }) => (
                                  <FormItem className="flex flex-col">
                                    <FormLabel>Tanggal Lahir</FormLabel>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <FormControl>
                                          <Button
                                            variant={"outline"}
                                            className={cn(
                                              "w-full pl-3 text-left font-normal",
                                              !field.value && "text-muted-foreground"
                                            )}
                                          >
                                            {field.value ? (
                                              format(field.value, "dd/MM/yyyy")
                                            ) : (
                                              <span>Pilih tanggal</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                          </Button>
                                        </FormControl>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                          mode="single"
                                          selected={field.value}
                                          onSelect={field.onChange}
                                          disabled={(date) =>
                                            date > new Date() || date < new Date("1900-01-01")
                                          }
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Jenis Kelamin</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Pilih jenis kelamin" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="L">Laki-laki</SelectItem>
                                        <SelectItem value="P">Perempuan</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="maritalStatus"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Status Pernikahan</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Pilih status" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="single">Belum Menikah</SelectItem>
                                        <SelectItem value="married">Menikah</SelectItem>
                                        <SelectItem value="divorced">Cerai</SelectItem>
                                        <SelectItem value="widowed">Janda/Duda</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="religion"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Agama</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Pilih agama" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="Islam">Islam</SelectItem>
                                        <SelectItem value="Kristen">Kristen</SelectItem>
                                        <SelectItem value="Katolik">Katolik</SelectItem>
                                        <SelectItem value="Hindu">Hindu</SelectItem>
                                        <SelectItem value="Buddha">Buddha</SelectItem>
                                        <SelectItem value="Konghucu">Konghucu</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="nationality"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Kewarganegaraan</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <Separator />
                            
                            <div className="space-y-4">
                              <h4 className="font-medium">Informasi Kontak</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                  <FormField
                                    control={form.control}
                                    name="homeAddress"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Alamat Rumah</FormLabel>
                                        <FormControl>
                                          <Textarea placeholder="Jl. Sudirman No. 123, Jakarta Selatan" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                
                                <FormField
                                  control={form.control}
                                  name="phone"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>No. Telepon</FormLabel>
                                      <FormControl>
                                        <Input placeholder="+62-812-3456-7890" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="personalEmail"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Email Pribadi</FormLabel>
                                      <FormControl>
                                        <Input type="email" placeholder="ahmad@gmail.com" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="workEmail"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Email Kerja *</FormLabel>
                                      <FormControl>
                                        <Input type="email" placeholder="ahmad@talentflow.co.id" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="space-y-4">
                              <h4 className="font-medium">Kontak Darurat</h4>
                              <div className="grid grid-cols-3 gap-4">
                                <FormField
                                  control={form.control}
                                  name="emergencyContactName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Nama</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Siti Ahmad" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="emergencyContactPhone"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>No. Telepon</FormLabel>
                                      <FormControl>
                                        <Input placeholder="+62-813-9876-5432" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="emergencyContactRelation"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Hubungan</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Istri/Suami/Orang Tua" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="space-y-4">
                              <h4 className="font-medium">Data Identifikasi</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="nik"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>NIK (Nomor Induk Kependudukan)</FormLabel>
                                      <FormControl>
                                        <Input placeholder="3171051505900001" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="npwp"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>NPWP</FormLabel>
                                      <FormControl>
                                        <Input placeholder="12.345.678.9-012.000" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="bpjsHealthNumber"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>No. BPJS Kesehatan</FormLabel>
                                      <FormControl>
                                        <Input placeholder="0001234567890" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={form.control}
                                  name="bpjsEmploymentNumber"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>No. BPJS Ketenagakerjaan</FormLabel>
                                      <FormControl>
                                        <Input placeholder="13010001234567" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="job" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="position"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Posisi/Jabatan *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Software Engineer" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="hireDate"
                                render={({ field }) => (
                                  <FormItem className="flex flex-col">
                                    <FormLabel>Tanggal Mulai Kerja *</FormLabel>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <FormControl>
                                          <Button
                                            variant={"outline"}
                                            className={cn(
                                              "w-full pl-3 text-left font-normal",
                                              !field.value && "text-muted-foreground"
                                            )}
                                          >
                                            {field.value ? (
                                              format(field.value, "dd/MM/yyyy")
                                            ) : (
                                              <span>Pilih tanggal</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                          </Button>
                                        </FormControl>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                          mode="single"
                                          selected={field.value}
                                          onSelect={field.onChange}
                                          disabled={(date) =>
                                            date > new Date() || date < new Date("2000-01-01")
                                          }
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="employmentStatus"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Status Karyawan *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Pilih status" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="permanent">Karyawan Tetap</SelectItem>
                                        <SelectItem value="contract">Kontrak</SelectItem>
                                        <SelectItem value="internship">Magang</SelectItem>
                                        <SelectItem value="part_time">Paruh Waktu</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="workLocation"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Lokasi Kerja</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Pilih lokasi" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="head_office">Kantor Pusat</SelectItem>
                                        <SelectItem value="branch">Cabang</SelectItem>
                                        <SelectItem value="remote">Remote</SelectItem>
                                        <SelectItem value="hybrid">Hybrid</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </TabsContent>

                          <TabsContent value="financial" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="basicSalary"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Gaji Pokok</FormLabel>
                                    <FormControl>
                                      <Input placeholder="8000000" type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div></div>
                              
                              <FormField
                                control={form.control}
                                name="bankName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nama Bank</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Bank Mandiri" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="bankAccount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>No. Rekening</FormLabel>
                                    <FormControl>
                                      <Input placeholder="1234567890" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </TabsContent>

                          <TabsContent value="additional" className="space-y-4">
                            <FormField
                              control={form.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Catatan Tambahan</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="Catatan khusus tentang karyawan..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TabsContent>
                        </Tabs>

                        <div className="flex justify-end space-x-4">
                          <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Batal
                          </Button>
                          <Button type="submit" disabled={createEmployeeMutation.isPending}>
                            {createEmployeeMutation.isPending ? "Menyimpan..." : "Simpan Karyawan"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Contract Expiry Notifications */}
            {contractExpiryNotifications.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangleIcon className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Peringatan Kontrak Berakhir
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc space-y-1 pl-5">
                        {contractExpiryNotifications.map(({ employee, expiry }) => (
                          <li key={employee.id}>
                            <strong>{employee.firstName} {employee.lastName}</strong> ({employee.employeeId}) - 
                            Kontrak berakhir dalam {expiry?.daysLeft} hari ({format(expiry?.endDate || new Date(), "dd/MM/yyyy")})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg border space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Cari karyawan (nama, ID, posisi, email)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Tidak Aktif</SelectItem>
                      <SelectItem value="terminated">Berhenti</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={employmentStatusFilter} onValueChange={setEmploymentStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tipe</SelectItem>
                      <SelectItem value="permanent">Tetap</SelectItem>
                      <SelectItem value="contract">Kontrak</SelectItem>
                      <SelectItem value="internship">Magang</SelectItem>
                      <SelectItem value="part_time">Paruh Waktu</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={tenureFilter} onValueChange={setTenureFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Lama Kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="new">Baru (&lt; 6 bulan)</SelectItem>
                      <SelectItem value="junior">Junior (6 bulan - 2 tahun)</SelectItem>
                      <SelectItem value="senior">Senior (2-5 tahun)</SelectItem>
                      <SelectItem value="veteran">Veteran (&gt; 5 tahun)</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex border rounded-md">
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-r-none"
                    >
                      <ListIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-l-none"
                    >
                      <GridIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  Menampilkan {filteredEmployees.length} dari {employees.length} karyawan
                </span>
                {contractExpiryNotifications.length > 0 && (
                  <span className="text-yellow-600 font-medium">
                    {contractExpiryNotifications.length} kontrak akan berakhir bulan ini
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-6">
              {filteredEmployees.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <UserIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Belum Ada Data Karyawan</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Mulai dengan menambahkan karyawan pertama Anda
                    </p>
                    {isAdminOrHR() && (
                      <Button onClick={() => setIsAddDialogOpen(true)}>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Tambah Karyawan
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {(employees as Employee[]).map((employee: Employee) => (
                    <Card key={employee.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {employee.firstName} {employee.lastName}
                            </CardTitle>
                            <CardDescription>{employee.position}</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            {getStatusBadge(employee.status)}
                            {getEmploymentStatusBadge(employee.employmentStatus)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">ID Karyawan:</span>
                            <span className="font-medium">{employee.employeeId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-medium truncate ml-2">{employee.workEmail}</span>
                          </div>
                          {employee.phone && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Telepon:</span>
                              <span className="font-medium">{employee.phone}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bergabung:</span>
                            <span className="font-medium">
                              {format(new Date(employee.hireDate), "dd/MM/yyyy")}
                            </span>
                          </div>
                          {employee.basicSalary && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Gaji:</span>
                              <span className="font-medium">{formatCurrency(employee.basicSalary)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setIsViewDialogOpen(true);
                            }}
                            className="flex-1"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            Lihat
                          </Button>
                          {isAdminOrHR() && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setIsEditDialogOpen(true);
                                }}
                                className="flex-1"
                              >
                                <EditIcon className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Apakah Anda yakin ingin menghapus karyawan ${employee.firstName} ${employee.lastName}?`)) {
                                    deleteEmployeeMutation.mutate(employee.id);
                                  }
                                }}
                                className="flex-1"
                              >
                                <Trash2Icon className="w-4 h-4 mr-1" />
                                Hapus
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* View Employee Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Karyawan</DialogTitle>
            <DialogDescription>
              Informasi lengkap {selectedEmployee?.firstName} {selectedEmployee?.lastName}
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <ScrollArea className="h-full max-h-[70vh]">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="personal">Data Pribadi</TabsTrigger>
                  <TabsTrigger value="job">Data Pekerjaan</TabsTrigger>
                  <TabsTrigger value="financial">Data Finansial</TabsTrigger>
                  <TabsTrigger value="additional">Tambahan</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ID Karyawan</label>
                      <p className="text-sm font-medium">{selectedEmployee.employeeId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nama Lengkap</label>
                      <p className="text-sm font-medium">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tempat Lahir</label>
                      <p className="text-sm font-medium">{selectedEmployee.birthPlace || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tanggal Lahir</label>
                      <p className="text-sm font-medium">
                        {selectedEmployee.birthDate ? format(new Date(selectedEmployee.birthDate), "dd/MM/yyyy") : "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Jenis Kelamin</label>
                      <p className="text-sm font-medium">
                        {selectedEmployee.gender === "L" ? "Laki-laki" : selectedEmployee.gender === "P" ? "Perempuan" : "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status Pernikahan</label>
                      <p className="text-sm font-medium">
                        {selectedEmployee.maritalStatus === "single" ? "Belum Menikah" :
                         selectedEmployee.maritalStatus === "married" ? "Menikah" :
                         selectedEmployee.maritalStatus === "divorced" ? "Cerai" :
                         selectedEmployee.maritalStatus === "widowed" ? "Janda/Duda" : "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Kewarganegaraan</label>
                      <p className="text-sm font-medium">{selectedEmployee.nationality || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Agama</label>
                      <p className="text-sm font-medium">{selectedEmployee.religion || "-"}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Informasi Kontak</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">Alamat Rumah</label>
                        <p className="text-sm font-medium">{selectedEmployee.homeAddress || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">No. Telepon</label>
                        <p className="text-sm font-medium">{selectedEmployee.phone || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email Pribadi</label>
                        <p className="text-sm font-medium">{selectedEmployee.personalEmail || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email Kerja</label>
                        <p className="text-sm font-medium">{selectedEmployee.workEmail}</p>
                      </div>
                    </div>
                    
                    {selectedEmployee.emergencyContact && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Kontak Darurat</label>
                        <p className="text-sm font-medium">
                          {selectedEmployee.emergencyContact.name} ({selectedEmployee.emergencyContact.relationship}) - {selectedEmployee.emergencyContact.phone}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Data Identifikasi</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">NIK</label>
                        <p className="text-sm font-medium">{selectedEmployee.nik || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">NPWP</label>
                        <p className="text-sm font-medium">{selectedEmployee.npwp || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">No. BPJS Kesehatan</label>
                        <p className="text-sm font-medium">{selectedEmployee.bpjsHealthNumber || "-"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">No. BPJS Ketenagakerjaan</label>
                        <p className="text-sm font-medium">{selectedEmployee.bpjsEmploymentNumber || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {selectedEmployee.education && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="font-medium">Riwayat Pendidikan</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Jenjang</label>
                            <p className="text-sm font-medium">{selectedEmployee.education.level || "-"}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Institusi</label>
                            <p className="text-sm font-medium">{selectedEmployee.education.institution || "-"}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Jurusan</label>
                            <p className="text-sm font-medium">{selectedEmployee.education.major || "-"}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Tahun Lulus</label>
                            <p className="text-sm font-medium">{selectedEmployee.education.graduationYear || "-"}</p>
                          </div>
                          {selectedEmployee.education.certifications && selectedEmployee.education.certifications.length > 0 && (
                            <div className="col-span-2">
                              <label className="text-sm font-medium text-muted-foreground">Sertifikasi</label>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {selectedEmployee.education.certifications.map((cert: string, index: number) => (
                                  <Badge key={index} variant="secondary">{cert}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="job" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Posisi/Jabatan</label>
                      <p className="text-sm font-medium">{selectedEmployee.position}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tanggal Mulai Kerja</label>
                      <p className="text-sm font-medium">{format(new Date(selectedEmployee.hireDate), "dd/MM/yyyy")}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status Karyawan</label>
                      <div className="mt-1">{getEmploymentStatusBadge(selectedEmployee.employmentStatus)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Lokasi Kerja</label>
                      <p className="text-sm font-medium">
                        {selectedEmployee.workLocation === "head_office" ? "Kantor Pusat" :
                         selectedEmployee.workLocation === "branch" ? "Cabang" :
                         selectedEmployee.workLocation === "remote" ? "Remote" :
                         selectedEmployee.workLocation === "hybrid" ? "Hybrid" : "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedEmployee.status)}</div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Gaji Pokok</label>
                      <p className="text-sm font-medium">
                        {selectedEmployee.basicSalary ? formatCurrency(selectedEmployee.basicSalary) : "-"}
                      </p>
                    </div>
                    <div></div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nama Bank</label>
                      <p className="text-sm font-medium">{selectedEmployee.bankName || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">No. Rekening</label>
                      <p className="text-sm font-medium">{selectedEmployee.bankAccount || "-"}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="additional" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Catatan</label>
                    <p className="text-sm font-medium">{selectedEmployee.notes || "Tidak ada catatan"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tanggal Dibuat</label>
                    <p className="text-sm font-medium">{format(new Date(selectedEmployee.createdAt), "dd/MM/yyyy HH:mm")}</p>
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
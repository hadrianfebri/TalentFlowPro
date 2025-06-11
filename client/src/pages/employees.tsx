import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, differenceInDays, parseISO, isAfter, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  PlusIcon, 
  UserIcon, 
  SearchIcon, 
  AlertTriangle,
  EyeIcon,
  EditIcon,
  Trash2Icon,
  List,
  Grid3X3,
  Search,
  FilterIcon,
  CalendarIcon
} from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import type { Employee, InsertEmployee } from "@shared/schema";
import { z } from "zod";

// Define form schema for employee data
const employeeFormSchema = z.object({
  employeeId: z.string().min(1, "ID Karyawan wajib diisi"),
  firstName: z.string().min(1, "Nama depan wajib diisi"),
  lastName: z.string().min(1, "Nama belakang wajib diisi"),
  workEmail: z.string().email("Email kerja wajib valid"),
  position: z.string().min(1, "Posisi wajib diisi"),
  hireDate: z.date(),
  employmentStatus: z.enum(["permanent", "contract", "internship", "part_time"]),
  birthPlace: z.string().optional(),
  birthDate: z.date().optional(),
  gender: z.enum(["L", "P"]).optional(),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional(),
  nationality: z.string().default("Indonesia"),
  religion: z.enum(["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"]).optional(),
  homeAddress: z.string().optional(),
  phone: z.string().optional(),
  personalEmail: z.string().email().optional().or(z.literal("")),
  nik: z.string().optional(),
  npwp: z.string().optional(),
  bpjsHealthNumber: z.string().optional(),
  bpjsEmploymentNumber: z.string().optional(),
  workLocation: z.enum(["head_office", "branch", "remote", "hybrid"]).optional(),
  basicSalary: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  notes: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

export default function Employees() {
  const { toast } = useToast();
  const { userRole } = usePermissions();

  // State for filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employmentStatusFilter, setEmploymentStatusFilter] = useState("all");
  const [tenureFilter, setTenureFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Form for adding/editing employees
  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      nationality: "Indonesia",
      employmentStatus: "permanent",
    },
  });

  // Check user permissions
  const isAdminOrHR = () => {
    return userRole.role === "admin" || userRole.role === "hr";
  };

  // Fetch employees data
  const { data: employees, isLoading } = useQuery({
    queryKey: ["/api/employees"],
  });

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete employee");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Berhasil",
        description: "Karyawan berhasil dihapus",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menghapus karyawan",
        variant: "destructive",
      });
    },
  });

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          companyId: userRole.companyId,
          hireDate: data.hireDate.toISOString().split('T')[0],
          birthDate: data.birthDate ? data.birthDate.toISOString().split('T')[0] : undefined,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create employee");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Berhasil",
        description: "Karyawan berhasil ditambahkan",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menambahkan karyawan",
        variant: "destructive",
      });
    },
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormData & { id: number }) => {
      const response = await fetch(`/api/employees/${data.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          hireDate: data.hireDate.toISOString().split('T')[0],
          birthDate: data.birthDate ? data.birthDate.toISOString().split('T')[0] : undefined,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to update employee");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsEditDialogOpen(false);
      form.reset();
      toast({
        title: "Berhasil",
        description: "Data karyawan berhasil diperbarui",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal memperbarui data karyawan",
        variant: "destructive",
      });
    },
  });

  // Form submission handlers
  const onSubmitAdd = (data: EmployeeFormData) => {
    createEmployeeMutation.mutate(data);
  };

  const onSubmitEdit = (data: EmployeeFormData) => {
    if (selectedEmployee) {
      updateEmployeeMutation.mutate({ ...data, id: selectedEmployee.id });
    }
  };

  // Handle edit button click
  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    form.reset({
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      workEmail: employee.workEmail,
      position: employee.position,
      hireDate: new Date(employee.hireDate),
      employmentStatus: employee.employmentStatus as any,
      birthPlace: employee.birthPlace || "",
      birthDate: employee.birthDate ? new Date(employee.birthDate) : undefined,
      gender: employee.gender as any,
      maritalStatus: employee.maritalStatus as any,
      nationality: employee.nationality || "Indonesia",
      religion: employee.religion as any,
      homeAddress: employee.homeAddress || "",
      phone: employee.phone || "",
      personalEmail: employee.personalEmail || "",
      nik: employee.nik || "",
      npwp: employee.npwp || "",
      bpjsHealthNumber: employee.bpjsHealthNumber || "",
      bpjsEmploymentNumber: employee.bpjsEmploymentNumber || "",
      workLocation: employee.workLocation as any,
      basicSalary: employee.basicSalary || "",
      bankAccount: employee.bankAccount || "",
      bankName: employee.bankName || "",
      notes: employee.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  // Helper functions
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const calculateTenure = (hireDate: string) => {
    const hire = parseISO(hireDate);
    const now = new Date();
    const diffDays = differenceInDays(now, hire);
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years} tahun ${months > 0 ? `${months} bulan` : ""}`;
    } else if (months > 0) {
      return `${months} bulan`;
    } else {
      return `${diffDays} hari`;
    }
  };

  const checkContractExpiry = (employee: Employee) => {
    if (employee.employmentStatus !== "kontrak") return null;
    
    // Assuming contract duration is 1 year from hire date
    const hireDate = parseISO(employee.hireDate);
    const contractEndDate = addDays(hireDate, 365);
    const today = new Date();
    const daysLeft = differenceInDays(contractEndDate, today);
    
    if (daysLeft <= 30 && daysLeft > 0) {
      return {
        expiring: true,
        daysLeft,
        endDate: contractEndDate,
      };
    }
    
    return null;
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    switch (status) {
      case "aktif":
        return <Badge variant="default" className="bg-green-100 text-green-800">Aktif</Badge>;
      case "non-aktif":
        return <Badge variant="destructive">Non-aktif</Badge>;
      case "cuti":
        return <Badge variant="secondary">Cuti</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEmploymentStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    switch (status) {
      case "tetap":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Tetap</Badge>;
      case "kontrak":
        return <Badge variant="outline" className="border-orange-300 text-orange-700">Kontrak</Badge>;
      case "magang":
        return <Badge variant="secondary">Magang</Badge>;
      case "paruh_waktu":
        return <Badge variant="outline">Paruh Waktu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter employees based on search and filters
  const filteredEmployees = (employees as Employee[] || []).filter((employee: Employee) => {
    const searchMatch = 
      employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.workEmail.toLowerCase().includes(searchQuery.toLowerCase());

    const statusMatch = statusFilter === "all" || employee.status === statusFilter;
    const empStatusMatch = employmentStatusFilter === "all" || employee.employmentStatus === employmentStatusFilter;
    
    let tenureMatch = true;
    if (tenureFilter !== "all") {
      const hireDays = differenceInDays(new Date(), parseISO(employee.hireDate));
      switch (tenureFilter) {
        case "new":
          tenureMatch = hireDays <= 90;
          break;
        case "1year":
          tenureMatch = hireDays > 90 && hireDays <= 365;
          break;
        case "senior":
          tenureMatch = hireDays > 365;
          break;
      }
    }

    return searchMatch && statusMatch && empStatusMatch && tenureMatch;
  });

  const contractExpiryNotifications = (employees as Employee[] || [])
    .map((emp: Employee) => ({ employee: emp, expiry: checkContractExpiry(emp) }))
    .filter((item: any) => item.expiry?.expiring);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data karyawan...</p>
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
                <p className="text-muted-foreground">
                  Kelola informasi karyawan dan data kepegawaian
                </p>
              </div>
              {isAdminOrHR() && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Tambah Karyawan
                </Button>
              )}
            </div>

            {/* Contract Expiry Notifications */}
            {contractExpiryNotifications.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Peringatan Kontrak Berakhir
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc space-y-1 pl-5">
                        {contractExpiryNotifications.map(({ employee, expiry }: any) => (
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

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-lg border space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Cari karyawan (nama, ID, posisi, email)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="aktif">Aktif</SelectItem>
                      <SelectItem value="non-aktif">Non-aktif</SelectItem>
                      <SelectItem value="cuti">Cuti</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={employmentStatusFilter} onValueChange={setEmploymentStatusFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Jenis</SelectItem>
                      <SelectItem value="tetap">Tetap</SelectItem>
                      <SelectItem value="kontrak">Kontrak</SelectItem>
                      <SelectItem value="magang">Magang</SelectItem>
                      <SelectItem value="paruh_waktu">Paruh Waktu</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={tenureFilter} onValueChange={setTenureFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Masa Kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="new">Baru (≤3 bulan)</SelectItem>
                      <SelectItem value="1year">1 Tahun</SelectItem>
                      <SelectItem value="senior">Senior (&gt;1 tahun)</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex rounded-md border">
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-r-none"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-l-none"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  Menampilkan {filteredEmployees.length} dari {(employees as Employee[] || []).length} karyawan
                </span>
                {contractExpiryNotifications.length > 0 && (
                  <span className="text-yellow-600 font-medium">
                    {contractExpiryNotifications.length} kontrak akan berakhir bulan ini
                  </span>
                )}
              </div>
            </div>

            {/* Employee List */}
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
              ) : viewMode === "grid" ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredEmployees.map((employee: Employee) => (
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
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">ID:</span>
                            <span className="font-medium">{employee.employeeId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="text-xs">{employee.workEmail}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Masa Kerja:</span>
                            <span>{calculateTenure(employee.hireDate)}</span>
                          </div>
                          {employee.basicSalary && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Gaji:</span>
                              <span className="font-medium">{formatCurrency(employee.basicSalary)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            Lihat
                          </Button>
                          {isAdminOrHR() && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(employee)}
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
                              >
                                <Trash2Icon className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                // List/Table View
                <div className="bg-white rounded-lg border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Karyawan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Posisi
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Lama Kerja
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Gaji
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredEmployees.map((employee: Employee) => {
                          const contractExpiry = checkContractExpiry(employee);
                          return (
                            <tr key={employee.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                      <span className="text-sm font-medium text-indigo-600">
                                        {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {employee.firstName} {employee.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {employee.employeeId} • {employee.workEmail}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {employee.position}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  {getStatusBadge(employee.status)}
                                  {getEmploymentStatusBadge(employee.employmentStatus)}
                                  {contractExpiry && (
                                    <Badge variant="destructive" className="text-xs">
                                      Kontrak: {contractExpiry.daysLeft} hari
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {calculateTenure(employee.hireDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {employee.basicSalary ? formatCurrency(employee.basicSalary) : "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedEmployee(employee);
                                      setIsViewDialogOpen(true);
                                    }}
                                  >
                                    <EyeIcon className="w-4 h-4" />
                                  </Button>
                                  {isAdminOrHR() && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(employee)}
                                      >
                                        <EditIcon className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                          if (confirm(`Apakah Anda yakin ingin menghapus karyawan ${employee.firstName} ${employee.lastName}?`)) {
                                            deleteEmployeeMutation.mutate(employee.id);
                                          }
                                        }}
                                      >
                                        <Trash2Icon className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
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
                        {selectedEmployee.maritalStatus === "menikah" ? "Menikah" : 
                         selectedEmployee.maritalStatus === "belum_menikah" ? "Belum Menikah" : 
                         selectedEmployee.maritalStatus === "cerai" ? "Cerai" : "-"}
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
                </TabsContent>

                <TabsContent value="job" className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Posisi</label>
                      <p className="text-sm font-medium">{selectedEmployee.position}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status Kepegawaian</label>
                      <div className="text-sm font-medium">{getEmploymentStatusBadge(selectedEmployee.employmentStatus)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tanggal Masuk</label>
                      <p className="text-sm font-medium">{format(new Date(selectedEmployee.hireDate), "dd/MM/yyyy")}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Masa Kerja</label>
                      <p className="text-sm font-medium">{calculateTenure(selectedEmployee.hireDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Lokasi Kerja</label>
                      <p className="text-sm font-medium">{selectedEmployee.workLocation || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="text-sm font-medium">{getStatusBadge(selectedEmployee.status)}</div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Gaji Pokok</label>
                      <p className="text-sm font-medium">
                        {selectedEmployee.basicSalary ? formatCurrency(selectedEmployee.basicSalary) : "-"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Rekening Bank</label>
                      <p className="text-sm font-medium">{selectedEmployee.bankAccount || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nama Bank</label>
                      <p className="text-sm font-medium">{selectedEmployee.bankName || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">NPWP</label>
                      <p className="text-sm font-medium">{selectedEmployee.npwp || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">BPJS Kesehatan</label>
                      <p className="text-sm font-medium">{selectedEmployee.bpjsHealthNumber || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">BPJS Ketenagakerjaan</label>
                      <p className="text-sm font-medium">{selectedEmployee.bpjsEmploymentNumber || "-"}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="additional" className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email Kerja</label>
                      <p className="text-sm font-medium">{selectedEmployee.workEmail}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email Pribadi</label>
                      <p className="text-sm font-medium">{selectedEmployee.personalEmail || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Telepon</label>
                      <p className="text-sm font-medium">{selectedEmployee.phone || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">NIK</label>
                      <p className="text-sm font-medium">{selectedEmployee.nik || "-"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Alamat</label>
                    <p className="text-sm font-medium">{selectedEmployee.homeAddress || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Catatan</label>
                    <p className="text-sm font-medium">{selectedEmployee.notes || "-"}</p>
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Karyawan Baru</DialogTitle>
            <DialogDescription>
              Lengkapi informasi karyawan baru
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitAdd)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Data Dasar</TabsTrigger>
                  <TabsTrigger value="personal">Data Pribadi</TabsTrigger>
                  <TabsTrigger value="work">Data Pekerjaan</TabsTrigger>
                  <TabsTrigger value="additional">Tambahan</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="employeeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Karyawan *</FormLabel>
                          <FormControl>
                            <Input placeholder="EMP001" {...field} />
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
                            <Input placeholder="john@company.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Depan *</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
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
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Posisi *</FormLabel>
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
                          <FormLabel>Tanggal Masuk *</FormLabel>
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
                  </div>

                  <FormField
                    control={form.control}
                    name="employmentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status Kepegawaian *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih status kepegawaian" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="permanent">Tetap</SelectItem>
                            <SelectItem value="contract">Kontrak</SelectItem>
                            <SelectItem value="internship">Magang</SelectItem>
                            <SelectItem value="part_time">Paruh Waktu</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                                <SelectValue placeholder="Pilih status pernikahan" />
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor Telepon</FormLabel>
                          <FormControl>
                            <Input placeholder="08123456789" {...field} />
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
                            <Input placeholder="john.personal@email.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="homeAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alamat Rumah</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Alamat lengkap..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="work" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="workLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lokasi Kerja</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih lokasi kerja" />
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
                    <FormField
                      control={form.control}
                      name="basicSalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gaji Pokok</FormLabel>
                          <FormControl>
                            <Input placeholder="5000000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nik"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIK</FormLabel>
                          <FormControl>
                            <Input placeholder="3174012345678901" {...field} />
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
                            <Input placeholder="12.345.678.9-012.345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="additional" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bankAccount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rekening Bank</FormLabel>
                          <FormControl>
                            <Input placeholder="1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Bank</FormLabel>
                          <FormControl>
                            <Input placeholder="Bank BCA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Data Karyawan</DialogTitle>
            <DialogDescription>
              Perbarui informasi karyawan
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Data Dasar</TabsTrigger>
                  <TabsTrigger value="personal">Data Pribadi</TabsTrigger>
                  <TabsTrigger value="work">Data Pekerjaan</TabsTrigger>
                  <TabsTrigger value="additional">Tambahan</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="employeeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Karyawan *</FormLabel>
                          <FormControl>
                            <Input placeholder="EMP001" {...field} />
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
                            <Input placeholder="john@company.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Depan *</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
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
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Posisi *</FormLabel>
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
                          <FormLabel>Tanggal Masuk *</FormLabel>
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
                  </div>

                  <FormField
                    control={form.control}
                    name="employmentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status Kepegawaian *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih status kepegawaian" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="permanent">Tetap</SelectItem>
                            <SelectItem value="contract">Kontrak</SelectItem>
                            <SelectItem value="internship">Magang</SelectItem>
                            <SelectItem value="part_time">Paruh Waktu</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Other tabs with similar structure */}
                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor Telepon</FormLabel>
                          <FormControl>
                            <Input placeholder="08123456789" {...field} />
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
                            <Input placeholder="john.personal@email.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="homeAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alamat Rumah</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Alamat lengkap..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="work" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="basicSalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gaji Pokok</FormLabel>
                          <FormControl>
                            <Input placeholder="5000000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nik"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIK</FormLabel>
                          <FormControl>
                            <Input placeholder="3174012345678901" {...field} />
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
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={updateEmployeeMutation.isPending}>
                  {updateEmployeeMutation.isPending ? "Menyimpan..." : "Perbarui Data"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
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
import { CalendarIcon, PlusIcon, EyeIcon, UserIcon } from "lucide-react";
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
  workEmail: string;
  position: string;
  hireDate: string;
  employmentStatus: string;
  basicSalary?: string;
  phone?: string;
  status: string;
  companyId: string;
  createdAt: string;
}

const employeeFormSchema = z.object({
  employeeId: z.string().min(1, "ID Karyawan wajib diisi"),
  firstName: z.string().min(1, "Nama depan wajib diisi"),
  lastName: z.string().min(1, "Nama belakang wajib diisi"),
  workEmail: z.string().email("Email kerja wajib valid"),
  position: z.string().min(1, "Posisi wajib diisi"),
  hireDate: z.date(),
  employmentStatus: z.enum(["permanent", "contract", "internship", "part_time"]),
  basicSalary: z.string().optional(),
  phone: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

export default function Employees() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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
        hireDate: data.hireDate.toISOString().split('T')[0],
      };
      
      return apiRequest("POST", "/api/employees", payload);
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
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Tambah Karyawan Baru</DialogTitle>
                      <DialogDescription>
                        Lengkapi data karyawan dasar
                      </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit((data) => createEmployeeMutation.mutate(data))} className="space-y-4">
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
                        </div>

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

            <div className="grid gap-6">
              {(employees as Employee[]).length === 0 ? (
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
                            className="flex-1"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            Lihat Detail
                          </Button>
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
    </div>
  );
}
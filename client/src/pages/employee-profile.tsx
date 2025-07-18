import { useState, useEffect } from "react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; 
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, MapPin, Calendar, DollarSign, Download, FileText, Clock, Edit } from "lucide-react";
import { format } from "date-fns";

interface EmployeeProfile {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  hireDate: string;
  salary: number;
  status: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

interface PayrollRecord {
  id: number;
  period: string;
  basicSalary: number;
  overtimePay: number;
  allowances: any;
  bpjsHealth: number;
  bpjsEmployment: number;
  pph21: number;
  grossSalary: number;
  netSalary: number;
  status: string;
  createdAt: string;
}

const updateProfileSchema = z.object({
  phone: z.string().optional(),
  homeAddress: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export default function EmployeeProfile() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery<EmployeeProfile>({
    queryKey: ['/api/employee/profile'],
    retry: 1,
  });

  const { data: payrollHistory = [], isLoading: payrollLoading } = useQuery<PayrollRecord[]>({
    queryKey: ['/api/employee/payroll-history'],
    retry: 1,
  });

  const form = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      phone: "",
      homeAddress: "",
      emergencyContact: "",
    },
  });

  // Update form values when profile data is loaded
  React.useEffect(() => {
    if (profile) {
      form.reset({
        phone: profile.phone || "",
        homeAddress: profile.address || "",
        emergencyContact: profile.emergencyContact || "",
      });
    }
  }, [profile, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/employee/profile', {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employee/profile'] });
      setIsEditDialogOpen(false);
      // Force a refetch to ensure UI updates
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/employee/profile'] });
      }, 100);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    updateProfileMutation.mutate(data);
  };

  const handleDownloadSlip = async (payroll: PayrollRecord) => {
    try {
      const response = await fetch(`/api/employee/payroll/${payroll.id}/download`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/pdf',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download slip');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `slip-gaji-${payroll.period}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading slip:', error);
      alert('Gagal mengunduh slip gaji. Silakan coba lagi.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header pageTitle="Profil Karyawan" />
          <main className="flex-1 overflow-auto p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest mx-auto mb-4"></div>
                <p className="text-muted-foreground">Memuat profil karyawan...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header pageTitle="Profil Karyawan" />
          <main className="flex-1 overflow-auto p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-red-600">
                <p>Gagal memuat profil karyawan. Silakan refresh halaman.</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header pageTitle="Profil Karyawan" />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.firstName} {profile.lastName}
                </h1>
                <p className="text-gray-600">{profile.position}</p>
                <p className="text-sm text-gray-500">Status: 
                  <Badge variant={profile.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                    {profile.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                  </Badge>
                </p>
              </div>
              <div className="flex space-x-3">
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profil
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Profil</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>No. Telepon</FormLabel>
                              <FormControl>
                                <Input placeholder="Masukkan nomor telepon" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="homeAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Alamat Rumah</FormLabel>
                              <FormControl>
                                <Input placeholder="Masukkan alamat rumah" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="emergencyContact"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kontak Darurat</FormLabel>
                              <FormControl>
                                <Input placeholder="Masukkan kontak darurat" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsEditDialogOpen(false)}
                          >
                            Batal
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={updateProfileMutation.isPending}
                          >
                            {updateProfileMutation.isPending ? "Menyimpan..." : "Simpan"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informasi Pribadi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">ID Karyawan</label>
                      <p className="text-gray-900 font-medium">{profile.employeeId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900">{profile.email}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nomor Telepon</label>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900">{profile.phone || 'Tidak tersedia'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Alamat Lengkap</label>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <p className="text-gray-900">{profile.address || 'Alamat belum diisi'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status Karyawan</label>
                      <div className="mt-1">
                        <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
                          {profile.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Kontak Darurat</label>
                      <p className="text-gray-900">{profile.emergencyContact || 'Belum diisi'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Telepon Darurat</label>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900">{profile.emergencyPhone || 'Belum diisi'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informasi Pekerjaan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Posisi</label>
                    <p className="text-gray-900">{profile.position}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Departemen</label>
                    <p className="text-gray-900">{profile.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tanggal Masuk</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">
                        {profile.hireDate ? format(new Date(profile.hireDate), 'dd MMMM yyyy') : 'Tidak tersedia'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gaji</label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">
                        Rp {profile.salary ? Number(profile.salary).toLocaleString('id-ID') : 'Tidak tersedia'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payroll History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Riwayat Slip Gaji
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payrollLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-forest mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Memuat riwayat gaji...</p>
                  </div>
                ) : payrollHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Belum ada riwayat slip gaji tersedia.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payrollHistory.map((payroll) => (
                      <div key={payroll.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium text-gray-900">Periode {payroll.period}</p>
                              <p className="text-sm text-green-600 font-medium">
                                Gaji Bersih: Rp {Number(payroll.netSalary).toLocaleString('id-ID')}
                              </p>
                              <p className="text-xs text-gray-500">
                                Status: <Badge variant={payroll.status === 'paid' ? 'default' : 'secondary'}>
                                  {payroll.status === 'paid' ? 'Sudah Dibayar' : 'Menunggu'}
                                </Badge>
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadSlip(payroll)}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download Slip
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
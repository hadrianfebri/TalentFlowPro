import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, MapPin, Calendar, Building, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

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

export default function EmployeeProfile() {
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['/api/employee/profile'],
    retry: 1,
  });

  const { data: payrollHistory } = useQuery({
    queryKey: ['/api/employee/payroll-history'],
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
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

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-red-600 mb-2">Gagal memuat profil karyawan</p>
                <p className="text-muted-foreground">Silakan coba lagi nanti</p>
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
        <Header />
        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-forest">Profil Karyawan</h1>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Unduh Profil
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informasi Pribadi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-24 h-24 bg-forest/10 rounded-full flex items-center justify-center">
                    <User className="h-12 w-12 text-forest" />
                  </div>
                </div>
                
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-forest">
                    {profile?.firstName} {profile?.lastName}
                  </h2>
                  <p className="text-muted-foreground">{profile?.position}</p>
                  <Badge variant="secondary" className="mt-2">
                    {profile?.status}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">ID Karyawan</p>
                      <p className="font-medium">{profile?.employeeId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{profile?.email}</p>
                    </div>
                  </div>

                  {profile?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Telepon</p>
                        <p className="font-medium">{profile.phone}</p>
                      </div>
                    </div>
                  )}

                  {profile?.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Alamat</p>
                        <p className="font-medium">{profile.address}</p>
                      </div>
                    </div>
                  )}

                  {(profile?.emergencyContact || profile?.emergencyPhone) && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="font-medium text-forest">Kontak Darurat</h4>
                        {profile?.emergencyContact && (
                          <div className="flex items-center gap-3">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Nama Kontak</p>
                              <p className="font-medium">{profile.emergencyContact}</p>
                            </div>
                          </div>
                        )}
                        {profile?.emergencyPhone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Telepon Darurat</p>
                              <p className="font-medium">{profile.emergencyPhone}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Work Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informasi Pekerjaan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Posisi</p>
                      <p className="font-medium">{profile?.position}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Departemen</p>
                      <p className="font-medium">{profile?.department}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tanggal Bergabung</p>
                      <p className="font-medium">
                        {profile?.hireDate ? new Date(profile.hireDate).toLocaleDateString('id-ID') : 'Tidak tersedia'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Gaji</p>
                      <p className="font-medium">
                        {profile?.salary ? `Rp ${profile.salary.toLocaleString('id-ID')}` : 'Tidak tersedia'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payroll History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Riwayat Slip Gaji
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payrollHistory && payrollHistory.length > 0 ? (
                <div className="space-y-4">
                  {payrollHistory.map((payroll: any) => (
                    <div key={payroll.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {new Date(payroll.period + '-01').toLocaleDateString('id-ID', {
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Gaji Bersih: Rp {payroll.netSalary?.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Unduh
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada riwayat slip gaji</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
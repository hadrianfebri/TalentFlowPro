import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, MapPin, Calendar, Building, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const { data: profile, isLoading } = useQuery<EmployeeProfile>({
    queryKey: ["/api/employee/profile"],
  });

  const { data: payrollHistory } = useQuery({
    queryKey: ["/api/employee/payroll-history"],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Gagal memuat profil karyawan
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
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
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-muted-foreground">{profile.position}</p>
              <Badge variant="secondary" className="mt-2">
                {profile.status}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">ID Karyawan</p>
                  <p className="font-medium">{profile.employeeId}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
              </div>

              {profile.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telepon</p>
                    <p className="font-medium">{profile.phone}</p>
                  </div>
                </div>
              )}

              {profile.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Alamat</p>
                    <p className="font-medium">{profile.address}</p>
                  </div>
                </div>
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
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Departemen</p>
                  <p className="font-medium">{profile.department}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Bergabung</p>
                  <p className="font-medium">
                    {new Date(profile.hireDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Gaji Pokok</p>
                  <p className="font-medium">
                    Rp {profile.salary.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {profile.emergencyContact && (
              <div>
                <h3 className="font-semibold mb-3">Kontak Darurat</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Nama</p>
                      <p className="font-medium">{profile.emergencyContact}</p>
                    </div>
                  </div>
                  {profile.emergencyPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Telepon</p>
                        <p className="font-medium">{profile.emergencyPhone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
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
                      Gaji Bersih: Rp {payroll.netSalary.toLocaleString('id-ID')}
                    </p>
                    <Badge variant={payroll.status === 'paid' ? 'default' : 'secondary'}>
                      {payroll.status === 'paid' ? 'Dibayar' : 'Pending'}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm">
                    Unduh Slip
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
    </div>
  );
}
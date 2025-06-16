import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { id } from "date-fns/locale";
import { 
  Clock, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Timer,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

interface AttendanceRecord {
  id: number;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  checkInLocation: string | null;
  checkOutLocation: string | null;
  workingHours: string | null;
  overtimeHours: string | null;
  status: string;
  notes: string | null;
}

export default function EmployeeAttendance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Get current location
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation(`${latitude}, ${longitude}`);
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setCurrentLocation("Lokasi tidak tersedia");
          setIsGettingLocation(false);
        }
      );
    } else {
      setCurrentLocation("Geolocation tidak didukung");
      setIsGettingLocation(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Get today's attendance
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: todayAttendance, isLoading: isLoadingToday } = useQuery({
    queryKey: ["/api/attendance", today],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get monthly attendance
  const monthStart = format(startOfMonth(selectedDate), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(selectedDate), "yyyy-MM-dd");
  
  const { data: monthlyAttendance = [], isLoading: isLoadingMonthly } = useQuery({
    queryKey: ["/api/attendance", "monthly", monthStart, monthEnd],
    queryFn: async () => {
      const days = eachDayOfInterval({
        start: startOfMonth(selectedDate),
        end: endOfMonth(selectedDate)
      });
      
      const attendancePromises = days.map(day => 
        fetch(`/api/attendance?date=${format(day, "yyyy-MM-dd")}`)
          .then(res => res.json())
          .then(data => ({ date: format(day, "yyyy-MM-dd"), records: data }))
          .catch(() => ({ date: format(day, "yyyy-MM-dd"), records: [] }))
      );
      
      return Promise.all(attendancePromises);
    }
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ location: currentLocation })
      });
      if (!response.ok) {
        throw new Error("Check-in failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Check-in Berhasil",
        description: "Anda telah berhasil melakukan check-in",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    },
    onError: (error: any) => {
      toast({
        title: "Check-in Gagal",
        description: error.message || "Terjadi kesalahan saat check-in",
        variant: "destructive",
      });
    },
  });

  // Check-out mutation  
  const checkOutMutation = useMutation({
    mutationFn: async (attendanceId: number) => {
      const response = await fetch(`/api/attendance/${attendanceId}/checkout`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          checkOut: new Date().toISOString(),
          checkOutLocation: currentLocation 
        })
      });
      if (!response.ok) {
        throw new Error("Check-out failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Check-out Berhasil",
        description: "Anda telah berhasil melakukan check-out",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    },
    onError: (error: any) => {
      toast({
        title: "Check-out Gagal",
        description: error.message || "Terjadi kesalahan saat check-out",
        variant: "destructive",
      });
    },
  });

  const handleCheckIn = () => {
    if (!currentLocation) {
      getCurrentLocation();
      return;
    }
    checkInMutation.mutate();
  };

  const handleCheckOut = () => {
    if (!todayAttendance || !Array.isArray(todayAttendance) || todayAttendance.length === 0) return;
    const attendance = todayAttendance[0];
    checkOutMutation.mutate(attendance.id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">Hadir</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800">Terlambat</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800">Tidak Hadir</Badge>;
      default:
        return <Badge variant="secondary">-</Badge>;
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "-";
    return format(new Date(timeString), "HH:mm", { locale: id });
  };

  const calculateWorkingHours = (checkIn: string | null, checkOut: string | null) => {
    if (!checkIn || !checkOut) return "-";
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}j ${minutes}m`;
  };

  const todayRecord = Array.isArray(todayAttendance) ? todayAttendance[0] : null;
  const canCheckIn = !todayRecord?.checkIn;
  const canCheckOut = todayRecord?.checkIn && !todayRecord?.checkOut;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header pageTitle="Absensi Karyawan" />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Absensi Saya</h1>
                <p className="text-gray-600">Kelola absensi dan lihat rekap kehadiran Anda</p>
              </div>
            </div>

      {/* Today's Attendance Card */}
      <Card className="border-2 border-forest-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Absensi Hari Ini
          </CardTitle>
          <CardDescription>
            {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingToday ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-primary"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Check-in</div>
                  <div className="text-xl font-semibold">
                    {todayRecord?.checkIn ? formatTime(todayRecord.checkIn) : "-"}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Check-out</div>
                  <div className="text-xl font-semibold">
                    {todayRecord?.checkOut ? formatTime(todayRecord.checkOut) : "-"}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Jam Kerja</div>
                  <div className="text-xl font-semibold">
                    {calculateWorkingHours(todayRecord?.checkIn, todayRecord?.checkOut)}
                  </div>
                </div>
              </div>

              {todayRecord && (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Lokasi: {todayRecord.checkInLocation || "Tidak tersedia"}
                    </span>
                  </div>
                  {getStatusBadge(todayRecord.status)}
                </div>
              )}

              <div className="flex gap-3">
                {canCheckIn && (
                  <Button
                    onClick={handleCheckIn}
                    disabled={checkInMutation.isPending || isGettingLocation}
                    className="flex-1 bg-forest-primary hover:bg-forest-primary/90"
                  >
                    {checkInMutation.isPending ? (
                      <Timer className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {isGettingLocation ? "Mendapatkan Lokasi..." : "Check-in"}
                  </Button>
                )}
                
                {canCheckOut && (
                  <Button
                    onClick={handleCheckOut}
                    disabled={checkOutMutation.isPending}
                    variant="outline"
                    className="flex-1 border-forest-primary text-forest-primary hover:bg-forest-primary hover:text-white"
                  >
                    {checkOutMutation.isPending ? (
                      <Timer className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Check-out
                  </Button>
                )}
                
                {!canCheckIn && !canCheckOut && (
                  <div className="flex-1 text-center py-2 text-gray-600">
                    Absensi hari ini sudah selesai
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Monthly Attendance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Rekap Absensi Bulanan
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(selectedDate, "MMMM yyyy", { locale: id })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingMonthly ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-primary"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {monthlyAttendance.map((dayData: any) => {
                const record = dayData.records?.[0];
                const dayDate = new Date(dayData.date);
                const isToday = format(dayDate, "yyyy-MM-dd") === today;
                const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
                
                return (
                  <div
                    key={dayData.date}
                    className={`p-3 rounded-lg border ${
                      isToday ? "border-forest-primary bg-forest-primary/5" : "border-gray-200"
                    } ${isWeekend ? "bg-gray-50" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium min-w-[120px]">
                          {format(dayDate, "EEE, dd MMM", { locale: id })}
                          {isToday && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              Hari ini
                            </Badge>
                          )}
                        </div>
                        {!isWeekend && (
                          <>
                            <div className="text-sm text-gray-600">
                              Masuk: {record?.checkIn ? formatTime(record.checkIn) : "-"}
                            </div>
                            <div className="text-sm text-gray-600">
                              Keluar: {record?.checkOut ? formatTime(record.checkOut) : "-"}
                            </div>
                            <div className="text-sm text-gray-600">
                              Kerja: {calculateWorkingHours(record?.checkIn, record?.checkOut)}
                            </div>
                          </>
                        )}
                      </div>
                      <div>
                        {isWeekend ? (
                          <Badge variant="secondary">Libur</Badge>
                        ) : record ? (
                          getStatusBadge(record.status)
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Tidak Hadir</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
  isWeekend,
  isToday
} from "date-fns";
import { id } from "date-fns/locale";
import { 
  Calendar, 
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Heart,
  Plane,
  BarChart3,
  User,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function AttendanceCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch monthly attendance data
  const { data: monthlyAttendance = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/attendance/monthly", format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const response = await fetch(`/api/attendance/range?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        // Fallback to regular attendance endpoint
        const fallbackResponse = await fetch('/api/attendance');
        if (!fallbackResponse.ok) throw new Error('Failed to fetch attendance');
        const allData = await fallbackResponse.json();
        // Filter to current month
        return allData.filter((record: AttendanceRecord) => {
          const recordDate = parseISO(record.date);
          return recordDate >= startOfMonth(currentMonth) && recordDate <= endOfMonth(currentMonth);
        });
      }
      return response.json();
    },
    retry: 1,
  });

  // Calendar helper functions
  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  };

  const getAttendanceForDate = (date: Date) => {
    return monthlyAttendance.find(record => 
      isSameDay(parseISO(record.date), date)
    );
  };

  const getAttendanceStatusColor = (record: AttendanceRecord | undefined, date: Date) => {
    if (!isSameMonth(date, currentMonth)) return 'bg-gray-50 text-gray-300';
    if (isWeekend(date)) return 'bg-blue-50 text-blue-400';
    
    if (!record) {
      if (date > new Date()) return 'bg-gray-50 text-gray-400'; // Future dates
      return 'bg-red-50 text-red-600 border border-red-200'; // Absent
    }
    
    switch (record.status) {
      case 'present': return 'bg-green-50 text-green-700 border border-green-200';
      case 'late': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'absent': return 'bg-red-50 text-red-600 border border-red-200';
      case 'sick': return 'bg-blue-50 text-blue-600 border border-blue-200';
      case 'leave': return 'bg-purple-50 text-purple-600 border border-purple-200';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getStatusIcon = (record: AttendanceRecord | undefined, date: Date) => {
    if (!isSameMonth(date, currentMonth) || isWeekend(date)) return null;
    
    if (!record) {
      if (date > new Date()) return null;
      return <XCircle className="h-3 w-3" />;
    }
    
    switch (record.status) {
      case 'present': return <CheckCircle className="h-3 w-3" />;
      case 'late': return <AlertTriangle className="h-3 w-3" />;
      case 'absent': return <XCircle className="h-3 w-3" />;
      case 'sick': return <Heart className="h-3 w-3" />;
      case 'leave': return <Plane className="h-3 w-3" />;
      default: return null;
    }
  };

  const getStatusLabel = (record: AttendanceRecord | undefined, date: Date) => {
    if (!isSameMonth(date, currentMonth)) return '';
    if (isWeekend(date)) return 'Libur';
    
    if (!record) {
      if (date > new Date()) return '';
      return 'Absent';
    }
    
    switch (record.status) {
      case 'present': return 'Hadir';
      case 'late': return 'Terlambat';
      case 'absent': return 'Absent';
      case 'sick': return 'Sakit';
      case 'leave': return 'Cuti';
      default: return record.status;
    }
  };

  const getMonthlyStats = () => {
    const workingDays = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    }).filter(date => !isWeekend(date) && date <= new Date()).length;
    
    const presentDays = monthlyAttendance.filter(r => r.status === 'present').length;
    const lateDays = monthlyAttendance.filter(r => r.status === 'late').length;
    const absentDays = monthlyAttendance.filter(r => r.status === 'absent').length;
    const sickDays = monthlyAttendance.filter(r => r.status === 'sick').length;
    const leaveDays = monthlyAttendance.filter(r => r.status === 'leave').length;
    
    const totalAttendedDays = presentDays + lateDays;
    const attendanceRate = workingDays > 0 ? (totalAttendedDays / workingDays * 100) : 0;
    
    return {
      workingDays,
      presentDays,
      lateDays,
      absentDays,
      sickDays,
      leaveDays,
      attendanceRate: Math.round(attendanceRate)
    };
  };

  const monthlyStats = getMonthlyStats();
  const days = getDaysInMonth();
  const weekDays = ['Ming', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header pageTitle="Rekap Absensi Bulanan" />
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-6xl mx-auto">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-200 rounded w-64"></div>
                <div className="h-96 bg-gray-200 rounded"></div>
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
        <Header pageTitle="Rekap Absensi Bulanan" />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Navigation Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Rekap Absensi Bulanan</h1>
                <p className="text-gray-600">Lihat rekap kehadiran Anda dalam bentuk kalender</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/employee-attendance'}
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Absensi Harian
                </Button>
                <Button
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Rekap Bulanan
                </Button>
              </div>
            </div>
            
            {/* Monthly Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-600">{monthlyStats.presentDays}</p>
                      <p className="text-xs text-gray-600">Hadir Tepat Waktu</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">{monthlyStats.lateDays}</p>
                      <p className="text-xs text-gray-600">Terlambat</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold text-red-600">{monthlyStats.absentDays}</p>
                      <p className="text-xs text-gray-600">Tidak Hadir</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{monthlyStats.attendanceRate}%</p>
                      <p className="text-xs text-gray-600">Tingkat Kehadiran</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Calendar View */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Kalender Absensi
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[150px] text-center">
                      {format(currentMonth, "MMMM yyyy", { locale: id })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {/* Week Day Headers */}
                  {weekDays.map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-50 rounded">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar Days */}
                  {days.map((date, index) => {
                    const record = getAttendanceForDate(date);
                    const isCurrentMonth = isSameMonth(date, currentMonth);
                    const isCurrentDay = isToday(date);
                    const isWeekendDay = isWeekend(date);
                    
                    return (
                      <div
                        key={index}
                        className={`
                          p-2 min-h-[80px] border rounded-lg transition-all hover:shadow-sm
                          ${getAttendanceStatusColor(record, date)}
                          ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
                          ${!isCurrentMonth ? 'opacity-30' : ''}
                        `}
                      >
                        <div className="flex flex-col h-full">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm font-medium ${isCurrentDay ? 'font-bold' : ''}`}>
                              {format(date, 'd')}
                            </span>
                            {getStatusIcon(record, date)}
                          </div>
                          
                          {isCurrentMonth && !isWeekendDay && (
                            <div className="flex-1 flex flex-col justify-center">
                              {record ? (
                                <div className="space-y-1">
                                  <div className="text-xs font-medium">
                                    {getStatusLabel(record, date)}
                                  </div>
                                  {record.checkIn && (
                                    <div className="text-xs opacity-75">
                                      Masuk: {format(parseISO(record.checkIn), 'HH:mm')}
                                    </div>
                                  )}
                                  {record.checkOut && (
                                    <div className="text-xs opacity-75">
                                      Keluar: {format(parseISO(record.checkOut), 'HH:mm')}
                                    </div>
                                  )}
                                  {record.workingHours && (
                                    <div className="text-xs opacity-75">
                                      {record.workingHours} jam
                                    </div>
                                  )}
                                </div>
                              ) : date <= new Date() ? (
                                <div className="text-xs font-medium">
                                  Tidak Hadir
                                </div>
                              ) : null}
                            </div>
                          )}
                          
                          {isWeekendDay && isCurrentMonth && (
                            <div className="flex-1 flex items-center justify-center">
                              <span className="text-xs font-medium">Libur</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                    <span className="text-xs text-gray-600">Hadir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded"></div>
                    <span className="text-xs text-gray-600">Terlambat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
                    <span className="text-xs text-gray-600">Tidak Hadir</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                    <span className="text-xs text-gray-600">Sakit/Libur</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-50 border border-purple-200 rounded"></div>
                    <span className="text-xs text-gray-600">Cuti</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Ringkasan Bulan Ini
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Hari Kerja:</span>
                    <span className="font-medium">{monthlyStats.workingDays} hari</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Hadir Tepat Waktu:</span>
                    <span className="font-medium text-green-600">{monthlyStats.presentDays} hari</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Terlambat:</span>
                    <span className="font-medium text-yellow-600">{monthlyStats.lateDays} hari</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sakit:</span>
                    <span className="font-medium text-blue-600">{monthlyStats.sickDays} hari</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cuti:</span>
                    <span className="font-medium text-purple-600">{monthlyStats.leaveDays} hari</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Tingkat Kehadiran:</span>
                      <Badge variant={monthlyStats.attendanceRate >= 90 ? 'default' : monthlyStats.attendanceRate >= 75 ? 'secondary' : 'destructive'}>
                        {monthlyStats.attendanceRate}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Status Kehadiran
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {monthlyStats.attendanceRate}%
                      </div>
                      <div className="text-sm text-gray-600">Tingkat Kehadiran</div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          monthlyStats.attendanceRate >= 90 ? 'bg-green-500' : 
                          monthlyStats.attendanceRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${monthlyStats.attendanceRate}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-xs text-center text-gray-600">
                      {monthlyStats.attendanceRate >= 90 ? 'Excellent! Kehadiran sangat baik' :
                       monthlyStats.attendanceRate >= 75 ? 'Good! Kehadiran cukup baik' :
                       'Perlu ditingkatkan lagi'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
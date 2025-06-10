import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Camera, CheckCircle, XCircle } from "lucide-react";

export default function Attendance() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header pageTitle="Absensi & Timesheet" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Mobile Check-in Interface */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Check-in Mobile dengan GPS & Selfie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="w-32 h-32 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Camera className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Fitur Check-in Mobile</h3>
                    <p className="text-muted-foreground mb-6">
                      Face-Match ≥ 95% & geo-fence, anomaly alert
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <Button className="bg-primary hover:bg-primary/90">
                        <MapPin className="h-4 w-4 mr-2" />
                        Check In
                      </Button>
                      <Button variant="outline">
                        <MapPin className="h-4 w-4 mr-2" />
                        Check Out
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Status */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Status Kehadiran</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium">Hadir</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">82</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center">
                        <XCircle className="h-5 w-5 text-red-600 mr-2" />
                        <span className="text-sm font-medium">Tidak Hadir</span>
                      </div>
                      <span className="text-lg font-bold text-red-600">5</span>
                    </div>
                    <div className="text-center pt-4">
                      <p className="text-sm text-muted-foreground">Tingkat Kehadiran</p>
                      <p className="text-2xl font-bold text-primary">94.3%</p>
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

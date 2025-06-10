import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Calculator, FileText, Download } from "lucide-react";

export default function Payroll() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header pageTitle="Payroll & Slip Gaji" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Payroll Calculation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Kalkulasi Payroll
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Gaji Pokok + Lembur</h3>
                    <p className="text-sm text-muted-foreground">
                      Rumus otomatis dengan BPJS & PPh 21
                    </p>
                  </div>
                  <div className="text-center py-4">
                    <p className="text-2xl font-bold text-primary">Rp 245.500.000</p>
                    <p className="text-sm text-muted-foreground">Total Payroll Bulan Ini</p>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    <Calculator className="h-4 w-4 mr-2" />
                    Proses Payroll 1-Klik
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Slip Gaji */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Generator Slip Gaji
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-secondary/5 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Slip PDF & File Bank</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate otomatis dengan integrasi Reward Wallet
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Slip PDF
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download File Bank
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

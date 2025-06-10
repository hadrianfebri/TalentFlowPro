import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, DollarSign, FileText, Receipt, BarChart3, UserPlus, Brain } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Data Karyawan",
    description: "Master data SDM, kontrak, BPJS/NPWP, file repository, self-service karyawan"
  },
  {
    icon: Clock,
    title: "Absensi & Timesheet",
    description: "Mobile check-in GPS + selfie, hitung telat/lembur, dashboard hadir"
  },
  {
    icon: DollarSign,
    title: "Payroll & Slip",
    description: "Rumus gaji pokok + lembur, BPJS & PPh 21, slip PDF, file bank"
  },
  {
    icon: FileText,
    title: "Cuti & Izin",
    description: "Pengajuan via app, multi-approval, saldo otomatis, kalender cuti"
  },
  {
    icon: Receipt,
    title: "Reimbursement",
    description: "Foto struk, OCR nominal/kategori, plafon, approval ke payroll"
  },
  {
    icon: BarChart3,
    title: "Performance",
    description: "Target bulanan, progres, rating 1-5, histori 24 bulan"
  },
  {
    icon: UserPlus,
    title: "Recruitment",
    description: "Form lamaran, parser CV, pipeline 3-tahap, auto-hire → Employee"
  },
  {
    icon: Brain,
    title: "Momentum Loop™",
    description: "Micro-feedback Pulse, Dynamic Reward Wallet, Predictive Stay-Bot"
  }
];

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">TalentFlow.ai</h1>
                <p className="text-xs text-muted-foreground">UMKM Essentials</p>
              </div>
            </div>
            <Button onClick={handleLogin} className="bg-primary hover:bg-primary/90">
              Masuk dengan Replit
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Platform HR Cloud
              <span className="text-primary"> All-in-One</span>
              <br />
              untuk UMKM Indonesia
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              TalentFlow.ai UMKM Essentials mengganti pengelolaan SDM berbasis Excel, 
              mesin absensi konvensional, dan slip gaji kertas dengan satu aplikasi 
              SaaS yang aman, murah, dan mudah dipakai.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleLogin} className="bg-primary hover:bg-primary/90">
                Mulai Gratis Sekarang
              </Button>
              <Button size="lg" variant="outline">
                Lihat Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-background/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              8 Modul Lengkap untuk HR Modern
            </h3>
            <p className="text-muted-foreground text-lg">
              Solusi terintegrasi dengan sentuhan AI dan otomasi untuk efisiensi maksimal
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-border/50 hover:shadow-lg transition-all duration-300 stats-card">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <div className="ai-insight-card rounded-xl p-8 mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                  <Brain className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Momentum Loop™ dengan AI DeepSeek
              </h3>
              <p className="text-muted-foreground text-lg mb-6">
                Fitur revolusioner yang menggunakan AI untuk memberikan insights prediktif, 
                micro-coaching, dan reward system yang dinamis untuk meningkatkan 
                engagement dan retensi karyawan.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-background/80 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">ML Churn Model</h4>
                  <p className="text-muted-foreground">Prediksi turnover dengan akurasi tinggi</p>
                </div>
                <div className="bg-background/80 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">GPT Micro-coaching</h4>
                  <p className="text-muted-foreground">Coaching personal berbasis AI</p>
                </div>
                <div className="bg-background/80 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Real-time Reward</h4>
                  <p className="text-muted-foreground">Sistem reward dinamis dan otomatis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-background/50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">≤ 100</div>
              <p className="text-muted-foreground">Karyawan per Perusahaan</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary mb-2">8</div>
              <p className="text-muted-foreground">Modul HR Terintegrasi</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1</div>
              <p className="text-muted-foreground">Platform All-in-One</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Siap Transformasi HR Perusahaan Anda?
            </h3>
            <p className="text-muted-foreground text-lg mb-8">
              Bergabunglah dengan ribuan UMKM yang telah mempercayai TalentFlow.ai 
              untuk mengelola SDM mereka secara modern dan efisien.
            </p>
            <Button size="lg" onClick={handleLogin} className="bg-primary hover:bg-primary/90">
              Mulai Transformasi Sekarang
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/80 py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">TalentFlow.ai</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2024 TalentFlow.ai. Platform HR Cloud untuk UMKM Indonesia.
          </p>
        </div>
      </footer>
    </div>
  );
}

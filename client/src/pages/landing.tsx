import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, DollarSign, FileText, Receipt, BarChart3, UserPlus, Brain, Building2, UserCheck } from "lucide-react";
import { Link } from "wouter";
import talentWhizLogo from "@assets/TALENTWHIZ_COLOR_1749955055542.png";

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
  const handleReplit = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-[#2f4f2f]/20 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg p-1">
                <img 
                  src={talentWhizLogo} 
                  alt="TalentWhiz.ai Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#2f4f2f]">TalentWhiz.ai</h1>
                <p className="text-xs text-[#519e51] font-medium">UMKM Essentials</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Link href="/hr-login">
                <Button className="bg-[#2f4f2f] hover:bg-[#519e51] text-white">
                  <Building2 className="w-4 h-4 mr-2" />
                  Login Admin/HR
                </Button>
              </Link>
              <Link href="/employee-login">
                <Button variant="outline" className="border-[#2f4f2f] text-[#2f4f2f] hover:bg-[#519e51] hover:text-white">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Login Karyawan
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Animated Green Neon Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-emerald-800/10 to-green-900/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(47,79,47,0.3)_0%,transparent_50%)] animate-pulse"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(81,158,81,0.2)_0%,transparent_50%)] animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(34,197,94,0.15)_0%,transparent_50%)] animate-pulse" style={{animationDelay: '2s'}}></div>
          
          {/* Floating Particles */}
          <div className="absolute top-20 left-10 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-70 float-animation"></div>
          <div className="absolute top-32 right-20 w-1 h-1 bg-emerald-300 rounded-full animate-ping opacity-60 float-animation" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-green-300 rounded-full animate-ping opacity-50 float-animation" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute bottom-60 right-1/3 w-1 h-1 bg-lime-400 rounded-full animate-ping opacity-40 float-animation" style={{animationDelay: '2.5s'}}></div>
          <div className="absolute top-1/2 left-20 w-1 h-1 bg-green-500 rounded-full animate-ping opacity-30 float-animation" style={{animationDelay: '3s'}}></div>
          <div className="absolute top-1/3 right-10 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping opacity-50 float-animation" style={{animationDelay: '3.5s'}}></div>
          
          {/* Glowing Lines */}
          <div className="absolute top-0 left-1/4 w-px h-32 bg-gradient-to-b from-green-400/50 to-transparent animate-pulse"></div>
          <div className="absolute top-20 right-1/3 w-px h-40 bg-gradient-to-b from-emerald-300/40 to-transparent animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 left-2/3 w-px h-24 bg-gradient-to-t from-green-300/30 to-transparent animate-pulse" style={{animationDelay: '1.5s'}}></div>
          
          {/* Additional Neon Grid Lines */}
          <div className="absolute top-10 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400/20 to-transparent animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-10 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-300/15 to-transparent animate-pulse" style={{animationDelay: '2.5s'}}></div>
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 relative">
              Platform HR Cloud
              <span className="text-primary neon-glow"> All-in-One</span>
              <br />
              untuk UMKM Indonesia
              <div className="absolute -inset-2 bg-gradient-to-r from-green-400/20 via-emerald-300/10 to-green-400/20 blur-xl opacity-30 animate-pulse"></div>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              TalentWhiz.ai UMKM Essentials mengganti pengelolaan SDM berbasis Excel, 
              mesin absensi konvensional, dan slip gaji kertas dengan satu aplikasi 
              SaaS yang aman, murah, dan mudah dipakai.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/hr-login">
                <Button size="lg" className="bg-[#2f4f2f] hover:bg-[#519e51] text-white w-full sm:w-auto relative overflow-hidden group">
                  <Building2 className="w-5 h-5 mr-2" />
                  Login Admin/HR
                  <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </Link>
              <Link href="/employee-login">
                <Button size="lg" variant="outline" className="border-[#2f4f2f] text-[#2f4f2f] hover:bg-[#519e51] hover:text-white w-full sm:w-auto relative overflow-hidden group">
                  <UserCheck className="w-5 h-5 mr-2" />
                  Login Karyawan
                  <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </Link>
              <Button size="lg" variant="outline" onClick={handleReplit} className="border-[#2f4f2f] text-[#2f4f2f] hover:bg-[#519e51] hover:text-white w-full sm:w-auto relative overflow-hidden group">
                Login dengan Replit
                <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
              Bergabunglah dengan ribuan UMKM yang telah mempercayai TalentWhiz.ai 
              untuk mengelola SDM mereka secara modern dan efisien.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/hr-login">
                <Button size="lg" className="bg-[#2f4f2f] hover:bg-[#519e51] text-white">
                  <Building2 className="w-5 h-5 mr-2" />
                  Login Admin/HR
                </Button>
              </Link>
              <Link href="/employee-login">
                <Button size="lg" variant="outline" className="border-[#2f4f2f] text-[#2f4f2f] hover:bg-[#519e51] hover:text-white">
                  <UserCheck className="w-5 h-5 mr-2" />
                  Login Karyawan
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2f4f2f]/20 bg-white/80 py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg p-1">
              <img 
                src={talentWhizLogo} 
                alt="TalentWhiz.ai Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-lg font-bold text-[#2f4f2f]">TalentWhiz.ai</span>
          </div>
          <p className="text-[#519e51] text-sm">
            © 2025 TalentWhiz.ai. Platform HR Cloud untuk UMKM Indonesia.
          </p>
        </div>
      </footer>
    </div>
  );
}

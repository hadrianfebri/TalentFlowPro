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
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-green-400/20 bg-black/90 backdrop-blur-sm">
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
                <h1 className="text-xl font-bold text-white">TalentWhiz.ai</h1>
                <p className="text-xs text-green-400 font-medium">UMKM Essentials</p>
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
                <Button variant="outline" className="border-green-400 text-green-400 hover:bg-green-400 hover:text-black">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Login Karyawan
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden organic-glow-background">
        
        <div className="container mx-auto text-center relative z-10 py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 relative z-20">
              Platform HR Cloud
              <span className="text-green-400 neon-glow"> All-in-One</span>
              <br />
              untuk UMKM Indonesia

            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto relative z-20">
              TalentWhiz.ai UMKM Essentials mengganti pengelolaan SDM berbasis Excel, 
              mesin absensi konvensional, dan slip gaji kertas dengan satu aplikasi 
              SaaS yang aman, murah, dan mudah dipakai.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/hr-login">
                <Button size="lg" className="bg-[#2f4f2f] hover:bg-[#2f4f2f]/80 text-white border border-[#2f4f2f] hover:border-green-400/60 hover:text-green-400 w-full sm:w-auto relative overflow-hidden group px-8 py-4 text-lg transition-all duration-300">
                  <Building2 className="w-6 h-6 mr-3" />
                  Login Admin/HR
                  <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </Link>
              <Link href="/employee-login">
                <Button size="lg" variant="outline" className="border-green-400 text-green-400 hover:bg-green-400/10 hover:text-green-400 hover:border-green-400/60 w-full sm:w-auto relative overflow-hidden group px-8 py-4 text-lg transition-all duration-300">
                  <UserCheck className="w-6 h-6 mr-3" />
                  Login Karyawan
                  <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </Link>
              <Button size="lg" variant="outline" onClick={handleReplit} className="border-green-400/50 text-green-400/80 hover:bg-green-400/10 hover:text-green-400 w-full sm:w-auto relative overflow-hidden group px-8 py-4 text-lg">
                Login dengan Replit
                <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-gradient-to-b from-black/0 via-gray-900/30 to-gray-900/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-white mb-4">
              8 Modul Lengkap untuk HR Modern
            </h3>
            <p className="text-gray-300 text-lg">
              Solusi terintegrasi dengan sentuhan AI dan otomasi untuk efisiensi maksimal
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="glass-morphism border-green-400/20 hover:border-green-400/40 hover:shadow-xl hover:shadow-green-400/10 transition-all duration-500 group">
                <CardHeader className="pb-4 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <feature.icon className="w-8 h-8 text-green-400 group-hover:text-green-300 transition-colors duration-300" />
                  </div>
                  <CardTitle className="text-lg text-white group-hover:text-green-400 transition-colors duration-300">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-sm leading-relaxed text-gray-300">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="py-16 px-4 bg-black">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass-morphism-ai rounded-xl p-8 mb-8 border border-green-400/30 hover:border-green-400/50 transition-all duration-500">
              <div className="flex items-center justify-center mb-6">
                <Brain className="w-12 h-12 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Momentum Loop™ dengan AI DeepSeek
              </h3>
              <p className="text-gray-300 text-lg mb-6">
                Fitur revolusioner yang menggunakan AI untuk memberikan insights prediktif, 
                micro-coaching, dan reward system yang dinamis untuk meningkatkan 
                engagement dan retensi karyawan.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="glass-morphism-small rounded-lg p-4 border border-green-400/20 hover:border-green-400/40 transition-all duration-300 group text-center">
                  <h4 className="font-semibold mb-2 text-white group-hover:text-green-400 transition-colors duration-300">ML Churn Model</h4>
                  <p className="text-gray-300">Prediksi turnover dengan akurasi tinggi</p>
                </div>
                <div className="glass-morphism-small rounded-lg p-4 border border-green-400/20 hover:border-green-400/40 transition-all duration-300 group text-center">
                  <h4 className="font-semibold mb-2 text-white group-hover:text-green-400 transition-colors duration-300">GPT Micro-coaching</h4>
                  <p className="text-gray-300">Coaching personal berbasis AI</p>
                </div>
                <div className="glass-morphism-small rounded-lg p-4 border border-green-400/20 hover:border-green-400/40 transition-all duration-300 group text-center">
                  <h4 className="font-semibold mb-2 text-white group-hover:text-green-400 transition-colors duration-300">Real-time Reward</h4>
                  <p className="text-gray-300">Sistem reward dinamis dan otomatis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-gray-900/50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">≤ 100</div>
              <p className="text-gray-300">Karyawan per Perusahaan</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">8</div>
              <p className="text-gray-300">Modul HR Terintegrasi</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">1</div>
              <p className="text-gray-300">Platform All-in-One</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-black">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-4">
              Siap Transformasi HR Perusahaan Anda?
            </h3>
            <p className="text-gray-300 text-lg mb-8">
              Bergabunglah dengan ribuan UMKM yang telah mempercayai TalentWhiz.ai 
              untuk mengelola SDM mereka secara modern dan efisien.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/hr-login">
                <Button size="lg" className="bg-[#2f4f2f] hover:bg-[#2f4f2f]/80 text-white border border-[#2f4f2f] hover:border-green-400/60 hover:text-green-400 relative overflow-hidden group transition-all duration-300">
                  <Building2 className="w-5 h-5 mr-2" />
                  Login Admin/HR
                  <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </Link>
              <Link href="/employee-login">
                <Button size="lg" variant="outline" className="border-green-400 text-green-400 hover:bg-green-400/10 hover:text-green-400 hover:border-green-400/60 relative overflow-hidden group transition-all duration-300">
                  <UserCheck className="w-5 h-5 mr-2" />
                  Login Karyawan
                  <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-400/20 bg-black/90 py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg p-1">
              <img 
                src={talentWhizLogo} 
                alt="TalentWhiz.ai Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-lg font-bold text-white">TalentWhiz.ai</span>
          </div>
          <p className="text-green-400 text-sm">
            © 2025 TalentWhiz.ai. Platform HR Cloud untuk UMKM Indonesia.
          </p>
        </div>
      </footer>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, Key, ExternalLink, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("integrations");

  // Get platform status
  const { data: platformStatus, isLoading: platformLoading } = useQuery({
    queryKey: ['/api/platform-status']
  });

  // Get current integration settings
  const { data: integrationSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/integration-settings']
  });

  const updateIntegrationMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/integration-settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/platform-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/integration-settings'] });
      toast({
        title: "Berhasil",
        description: "Pengaturan integrasi berhasil disimpan",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan integrasi",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: (platform: string) => apiRequest("POST", `/api/test-integration/${platform}`),
    onSuccess: (data, platform) => {
      toast({
        title: "Koneksi Berhasil",
        description: `Koneksi ke ${platform} berhasil diuji`,
      });
    },
    onError: (error, platform) => {
      toast({
        title: "Koneksi Gagal",
        description: `Gagal terhubung ke ${platform}. Periksa API credentials`,
        variant: "destructive",
      });
    },
  });

  const handleSaveIntegration = (platform: string, credentials: any) => {
    updateIntegrationMutation.mutate({
      platform,
      credentials,
      enabled: true
    });
  };

  const handleTestConnection = (platform: string) => {
    testConnectionMutation.mutate(platform);
  };

  const getPlatformStatusIcon = (platform: any) => {
    if (platform.configured) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const platforms = [
    {
      id: 'jobstreet',
      name: 'JobStreet Indonesia',
      description: 'Platform rekrutmen terbesar di Asia Tenggara',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Masukkan JobStreet API Key' }
      ],
      docs: 'https://developer.jobstreet.co.id/',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'indeed',
      name: 'Indeed',
      description: 'Platform pencarian kerja global',
      fields: [
        { key: 'publisherId', label: 'Publisher ID', type: 'text', placeholder: 'Masukkan Publisher ID' },
        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Masukkan Indeed API Key' }
      ],
      docs: 'https://ads.indeed.com/jobroll/xmlfeed',
      color: 'bg-green-50 border-green-200'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn Jobs',
      description: 'Platform profesional untuk posisi level menengah-tinggi',
      fields: [
        { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Masukkan LinkedIn Client ID' },
        { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Masukkan Client Secret' },
        { key: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'Masukkan Access Token' }
      ],
      docs: 'https://developer.linkedin.com/',
      color: 'bg-indigo-50 border-indigo-200'
    },
    {
      id: 'glints',
      name: 'Glints',
      description: 'Platform untuk fresh graduate dan startup',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Masukkan Glints API Key' }
      ],
      docs: 'mailto:business@glints.com',
      color: 'bg-purple-50 border-purple-200'
    },
    {
      id: 'kalibrr',
      name: 'Kalibrr',
      description: 'Platform teknologi dengan algoritma matching canggih',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Masukkan Kalibrr API Key' }
      ],
      docs: 'https://www.kalibrr.com/business',
      color: 'bg-orange-50 border-orange-200'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">
          Kelola integrasi platform eksternal dan pengaturan sistem
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="integrations">Integrasi Platform</TabsTrigger>
          <TabsTrigger value="general">Pengaturan Umum</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Status Platform
              </CardTitle>
              <CardDescription>
                Status koneksi ke platform posting eksternal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {platformLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {platformStatus?.platforms?.map((platform: any) => (
                    <div key={platform.platform} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {getPlatformStatusIcon(platform)}
                        <div>
                          <div className="font-medium">{platform.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {platform.configured ? 'Terkonfigurasi' : 'Perlu Setup'}
                          </div>
                        </div>
                      </div>
                      <Badge variant={platform.configured ? "default" : "secondary"}>
                        {platform.status === 'ready' ? 'Siap' : 'Perlu API Key'}
                      </Badge>
                    </div>
                  )) || []}
                </div>
              )}

              {platformStatus && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900">Status Integrasi</div>
                      <div className="text-sm text-blue-700">
                        {platformStatus.configuredCount} dari {platformStatus.totalPlatforms} platform terkonfigurasi.
                        {platformStatus.configuredCount === 0 && " Konfigurasikan API credentials untuk mulai posting otomatis."}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            {platforms.map((platform) => (
              <Card key={platform.id} className={`border-2 ${platform.color}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {platform.name}
                        {platformStatus?.platforms?.find((p: any) => p.platform === platform.id)?.configured && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </CardTitle>
                      <CardDescription>{platform.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(platform.docs, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Dokumentasi
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnection(platform.id)}
                        disabled={testConnectionMutation.isPending}
                      >
                        Test Koneksi
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const credentials: any = {};
                    platform.fields.forEach(field => {
                      credentials[field.key] = formData.get(field.key);
                    });
                    handleSaveIntegration(platform.id, credentials);
                  }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {platform.fields.map((field) => (
                        <div key={field.key} className="space-y-2">
                          <Label htmlFor={`${platform.id}-${field.key}`}>
                            {field.label}
                          </Label>
                          <Input
                            id={`${platform.id}-${field.key}`}
                            name={field.key}
                            type={field.type}
                            placeholder={field.placeholder}
                            defaultValue={integrationSettings?.[platform.id]?.[field.key] || ''}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={updateIntegrationMutation.isPending}
                      >
                        {updateIntegrationMutation.isPending ? "Menyimpan..." : "Simpan Konfigurasi"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Pengaturan Umum
              </CardTitle>
              <CardDescription>
                Konfigurasi pengaturan aplikasi dan notifikasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Notifikasi Email</Label>
                    <div className="text-sm text-muted-foreground">
                      Terima notifikasi melalui email untuk aktivitas penting
                    </div>
                  </div>
                  <Switch />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto-posting</Label>
                    <div className="text-sm text-muted-foreground">
                      Posting otomatis lowongan ke semua platform yang dikonfigurasi
                    </div>
                  </div>
                  <Switch />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="company-name">Nama Perusahaan</Label>
                  <Input 
                    id="company-name" 
                    placeholder="PT TalentFlow Indonesia"
                    defaultValue="PT TalentFlow Indonesia"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-email">Email Perusahaan</Label>
                  <Input 
                    id="company-email" 
                    type="email"
                    placeholder="hr@company.com"
                    defaultValue="hr@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-website">Website Perusahaan</Label>
                  <Input 
                    id="company-website" 
                    placeholder="https://company.com"
                    defaultValue="https://company.com"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button>Simpan Pengaturan</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
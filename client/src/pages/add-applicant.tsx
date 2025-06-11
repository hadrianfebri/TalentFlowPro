import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRouter } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertJobApplicationSchema, type InsertJobApplication, type Job } from "@/../../shared/schema";
import { Upload, UserPlus, FileText, Camera } from "lucide-react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

const formSchema = z.object({
  applicant_name: z.string().min(1, "Nama lengkap wajib diisi"),
  applicant_email: z.string().email("Format email tidak valid"),
  applicant_phone: z.string().optional(),
  position_applied: z.string().optional(),
  experience_years: z.number().min(0, "Pengalaman tidak boleh negatif"),
  education_level: z.string().optional(),
  skills: z.string().optional(),
  resume_text: z.string().optional(),
  cover_letter: z.string().optional(),
  stage: z.string().default("review"),
  status: z.string().optional(),
  job_id: z.number().optional(),
});

type FormData = {
  applicant_name: string;
  applicant_email: string;
  applicant_phone?: string;
  position_applied?: string;
  experience_years: number;
  education_level?: string;
  skills?: string;
  resume_text?: string;
  cover_letter?: string;
  stage: string;
  status?: string;
  job_id?: number;
  resume_file?: FileList;
  portfolio_files?: FileList;
  photo_file?: FileList;
};

export default function AddApplicantPage() {
  const navigate = (path: string) => {
    window.location.href = path;
  };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("form");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      applicant_name: "",
      applicant_email: "",
      applicant_phone: "",
      position_applied: "",
      experience_years: 0,
      education_level: "",
      skills: "",
      resume_text: "",
      cover_letter: "",
      stage: "review",
      status: "pending",
      job_id: undefined,
    },
  });

  const { data: jobs } = useQuery({
    queryKey: ["/api/jobs"],
  });

  const createApplicantMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      // Add text fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && key !== "resume_file" && key !== "portfolio_files" && key !== "photo_file") {
          formData.append(key, String(value));
        }
      });

      // Add files with validation
      if (data.resume_file?.[0]) {
        const file = data.resume_file[0];
        console.log("Resume file details:", {
          name: file.name,
          type: file.type,
          size: file.size
        });
        formData.append("resume_file", file);
      }
      if (data.portfolio_files) {
        Array.from(data.portfolio_files).forEach((file, index) => {
          console.log(`Portfolio file ${index} details:`, {
            name: file.name,
            type: file.type,
            size: file.size
          });
          formData.append(`portfolio_file_${index}`, file);
        });
      }
      if (data.photo_file?.[0]) {
        const file = data.photo_file[0];
        console.log("Photo file details:", {
          name: file.name,
          type: file.type,
          size: file.size
        });
        formData.append("photo_file", file);
      }

      return apiRequest("/api/job-applications", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Data pelamar berhasil ditambahkan",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications"] });
      navigate("/recruitment");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan data pelamar",
        variant: "destructive",
      });
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/job-applications/bulk-upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }
      
      return await response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Berhasil",
        description: `${result.success} pelamar berhasil diimport, ${result.failed} gagal`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications"] });
      navigate("/recruitment");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal mengupload file",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createApplicantMutation.mutate(data);
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      bulkUploadMutation.mutate(file);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header pageTitle="Tambah Pelamar" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Tambah Pelamar</h1>
            <p className="text-muted-foreground">
              Tambahkan data pelamar secara manual atau upload CV dalam format Excel/PDF
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Form Manual
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload CV
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Input Data Pelamar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="applicant_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap</FormLabel>
                          <FormControl>
                            <Input placeholder="Masukkan nama lengkap" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="applicant_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contoh@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="applicant_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor Telepon</FormLabel>
                          <FormControl>
                            <Input placeholder="+62 812-3456-7890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="job_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Posisi yang Dilamar</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih posisi" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {jobs?.map((job: Job) => (
                                <SelectItem key={job.id} value={job.id.toString()}>
                                  {job.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="position_applied"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Posisi Khusus (Opsional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Misal: Senior Developer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="experience_years"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pengalaman (Tahun)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="education_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tingkat Pendidikan</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih pendidikan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SMA">SMA/SMK</SelectItem>
                              <SelectItem value="D3">Diploma 3</SelectItem>
                              <SelectItem value="S1">Sarjana (S1)</SelectItem>
                              <SelectItem value="S2">Magister (S2)</SelectItem>
                              <SelectItem value="S3">Doktor (S3)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tahapan</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih tahapan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="review">Review</SelectItem>
                              <SelectItem value="phone_interview">Phone Interview</SelectItem>
                              <SelectItem value="technical_interview">Technical Interview</SelectItem>
                              <SelectItem value="final_interview">Final Interview</SelectItem>
                              <SelectItem value="reference_check">Reference Check</SelectItem>
                              <SelectItem value="offer">Offer</SelectItem>
                              <SelectItem value="accepted">Accepted</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Keahlian</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="JavaScript, React, Node.js, Python, etc."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="resume_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ringkasan CV (Opsional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Ringkasan pengalaman dan kualifikasi..."
                            className="min-h-[150px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cover_letter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Surat Lamaran (Opsional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Surat lamaran dari pelamar..."
                            className="min-h-[150px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Upload Dokumen</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="resume_file"
                        render={({ field: { onChange, value, ...field } }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              File CV
                            </FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Input
                                  id="resume-file-input"
                                  type="file"
                                  accept=".pdf,application/pdf"
                                  onChange={(e) => {
                                    const files = e.target.files;
                                    console.log("CV file input changed:", files);
                                    
                                    const fileNameSpan = document.getElementById('selected-file-name');
                                    if (files && files.length > 0) {
                                      const file = files[0];
                                      console.log("CV file selected:", {
                                        name: file.name,
                                        type: file.type,
                                        size: file.size,
                                        lastModified: file.lastModified
                                      });
                                      
                                      if (fileNameSpan) {
                                        fileNameSpan.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
                                        fileNameSpan.className = "text-green-600 font-medium";
                                      }
                                    } else {
                                      if (fileNameSpan) {
                                        fileNameSpan.textContent = "Belum ada file";
                                        fileNameSpan.className = "text-gray-500";
                                      }
                                    }
                                    onChange(files);
                                  }}
                                  {...field}
                                  value=""
                                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                <div className="text-sm text-gray-600">
                                  File yang dipilih: <span id="selected-file-name">Belum ada file</span>
                                </div>
                              </div>
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Format yang didukung: PDF, Word (.doc/.docx). Maksimal 10MB
                            </p>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                                console.log("File input element:", input);
                                console.log("Accept attribute:", input?.accept);
                                console.log("Files in input:", input?.files);
                              }}
                            >
                              Test File Detection
                            </Button>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="portfolio_files"
                        render={({ field: { onChange, value, ...field } }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Upload className="h-4 w-4" />
                              Portofolio
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="file"
                                multiple
                                accept="application/pdf,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.doc,.docx,image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (files) {
                                    console.log("Portfolio files selected:", Array.from(files).map(f => ({
                                      name: f.name,
                                      type: f.type,
                                      size: f.size
                                    })));
                                  }
                                  onChange(files);
                                }}
                                {...field}
                                value=""
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Format yang didukung: PDF, Word (.doc/.docx), gambar (.jpg/.png). Maksimal 10MB per file
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="photo_file"
                        render={({ field: { onChange, value, ...field } }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Camera className="h-4 w-4" />
                              Foto
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="file"
                                accept=".png,.jpg,.jpeg"
                                onChange={(e) => onChange(e.target.files)}
                                {...field}
                                value=""
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      type="submit" 
                      disabled={createApplicantMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      {createApplicantMutation.isPending ? "Menyimpan..." : "Simpan Pelamar"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate("/recruitment")}
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload CV Massal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload File CV</h3>
                <p className="text-gray-600 mb-4">
                  Pilih file Excel (.xlsx/.xls) atau PDF yang berisi data pelamar untuk diimport secara massal
                </p>
                <Input
                  id="cv-bulk-file-input"
                  type="file"
                  accept=".xlsx,.xls,.pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/pdf"
                  onChange={(e) => {
                    console.log("CV bulk file selection changed:", e.target.files);
                    
                    const cvFileNameSpan = document.getElementById('selected-cv-bulk-file-name');
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      console.log("CV bulk file selected:", {
                        name: file.name,
                        type: file.type,
                        size: file.size
                      });
                      
                      if (cvFileNameSpan) {
                        cvFileNameSpan.textContent = `${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
                        cvFileNameSpan.className = "text-green-600 font-medium";
                      }
                    } else {
                      if (cvFileNameSpan) {
                        cvFileNameSpan.textContent = "Belum ada file";
                        cvFileNameSpan.className = "text-gray-500";
                      }
                    }
                    handleBulkUpload(e);
                  }}
                  disabled={bulkUploadMutation.isPending}
                  className="max-w-xs mx-auto file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <div className="mt-4 space-y-2">
                  <div className="text-sm text-gray-600">
                    File CV yang dipilih: <span id="selected-cv-bulk-file-name" className="text-gray-500">Belum ada file</span>
                  </div>
                  {bulkUploadMutation.isPending && (
                    <p className="text-sm text-blue-600">Mengupload...</p>
                  )}
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById('cv-bulk-file-input') as HTMLInputElement;
                      console.log("CV bulk input element:", input);
                      console.log("CV bulk accept attribute:", input?.accept);
                      console.log("CV bulk files in input:", input?.files);
                    }}
                  >
                    Test CV Detection
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Format File yang Didukung:</h4>
                <div className="text-sm text-gray-700 space-y-3">
                  <div>
                    <p><strong>1. File Excel (.xlsx/.xls):</strong></p>
                    <p className="text-gray-600">Kolom yang dibutuhkan:</p>
                    <div className="text-xs bg-white p-2 rounded mt-1">
                      <p><strong>Wajib:</strong> applicant_name, applicant_email, job_id</p>
                      <p><strong>Opsional:</strong> applicant_phone, experience_years, education_level, skills</p>
                    </div>
                  </div>
                  <div>
                    <p><strong>2. File PDF:</strong></p>
                    <p className="text-gray-600">CV pelamar dalam format PDF akan diproses menggunakan AI untuk mengekstrak informasi secara otomatis.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Contoh format Excel:</h4>
                <div className="text-xs bg-white p-2 rounded overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-1">applicant_name</th>
                        <th className="text-left p-1">applicant_email</th>
                        <th className="text-left p-1">job_id</th>
                        <th className="text-left p-1">experience_years</th>
                        <th className="text-left p-1">skills</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-1">John Doe</td>
                        <td className="p-1">john@email.com</td>
                        <td className="p-1">1</td>
                        <td className="p-1">3</td>
                        <td className="p-1">JavaScript, React</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </main>
      </div>
    </div>
  );
}
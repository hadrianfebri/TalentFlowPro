import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "wouter";
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
  const [, navigate] = useRouter();
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

      // Add files
      if (data.resume_file?.[0]) {
        formData.append("resume_file", data.resume_file[0]);
      }
      if (data.portfolio_files) {
        Array.from(data.portfolio_files).forEach((file, index) => {
          formData.append(`portfolio_file_${index}`, file);
        });
      }
      if (data.photo_file?.[0]) {
        formData.append("photo_file", data.photo_file[0]);
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
      
      return apiRequest("/api/job-applications/bulk-upload", {
        method: "POST",
        body: formData,
      });
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
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tambah Pelamar</h1>
        <p className="text-muted-foreground">
          Tambahkan data pelamar secara manual atau upload file CSV
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
            Upload CSV
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
                              <Input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => onChange(e.target.files)}
                                {...field}
                                value=""
                              />
                            </FormControl>
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
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                onChange={(e) => onChange(e.target.files)}
                                {...field}
                                value=""
                              />
                            </FormControl>
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
                Upload Data Pelamar (CSV)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload File CSV</h3>
                <p className="text-gray-600 mb-4">
                  Pilih file CSV yang berisi data pelamar untuk diimport secara massal
                </p>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleBulkUpload}
                  disabled={bulkUploadMutation.isPending}
                  className="max-w-xs mx-auto"
                />
                {bulkUploadMutation.isPending && (
                  <p className="text-sm text-blue-600 mt-2">Mengupload...</p>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Format CSV yang Dibutuhkan:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Kolom wajib:</strong> applicant_name, applicant_email, job_id</p>
                  <p><strong>Kolom opsional:</strong> applicant_phone, position_applied, experience_years, education_level, skills, resume_text, cover_letter, stage</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Contoh format CSV:</h4>
                <code className="text-xs bg-white p-2 rounded block overflow-x-auto">
                  applicant_name,applicant_email,job_id,applicant_phone,experience_years,education_level,skills<br/>
                  John Doe,john@email.com,1,+62812345678,3,S1,"JavaScript, React"<br/>
                  Jane Smith,jane@email.com,2,+62887654321,5,S1,"Python, Django"
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
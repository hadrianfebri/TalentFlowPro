import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertJobApplicationSchema } from "../../../shared/schema";
import { apiRequest } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Plus, X, Upload, Brain, FileText, User, Briefcase, GraduationCap, Award } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import * as z from "zod";

// Enhanced schema for manual applicant upload
const manualApplicantSchema = insertJobApplicationSchema.extend({
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string(),
    year: z.string(),
    gpa: z.string().optional(),
  })).optional(),
  experience: z.array(z.object({
    company: z.string(),
    position: z.string(),
    duration: z.string(),
    description: z.string(),
    achievements: z.array(z.string()).optional(),
  })).optional(),
  skills: z.array(z.string()).optional(),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
    year: z.string(),
  })).optional(),
});

type FormData = z.infer<typeof manualApplicantSchema>;

export default function ApplicantUpload() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentEducation, setCurrentEducation] = useState({ institution: "", degree: "", field: "", year: "", gpa: "" });
  const [currentExperience, setCurrentExperience] = useState({ company: "", position: "", duration: "", description: "", achievements: [""] });
  const [currentSkill, setCurrentSkill] = useState("");
  const [currentCertification, setCurrentCertification] = useState({ name: "", issuer: "", year: "" });
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // Get available jobs
  const { data: jobs = [] } = useQuery({
    queryKey: ["/api/jobs"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(manualApplicantSchema),
    defaultValues: {
      applicantName: "",
      applicantEmail: "",
      applicantPhone: "",
      applicantAddress: "",
      dateOfBirth: "",
      gender: "",
      education: [],
      experience: [],
      skills: [],
      certifications: [],
      expectedSalary: "",
      availableStartDate: "",
      coverLetter: "",
      source: "manual",
      createdBy: "user-1", // Should be from auth context
    },
  });

  // Create application mutation
  const createApplicationMutation = useMutation({
    mutationFn: (data: FormData) => apiRequest("/api/job-applications", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Data pelamar berhasil disimpan",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications"] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Gagal menyimpan data pelamar",
        variant: "destructive",
      });
    },
  });

  // AI Analysis mutation
  const aiAnalysisMutation = useMutation({
    mutationFn: (applicationId: number) => apiRequest(`/api/job-applications/${applicationId}/analyze`, {
      method: "POST",
    }),
    onSuccess: (data) => {
      toast({
        title: "Analisis AI Selesai",
        description: `Skor kesesuaian: ${data.aiMatchScore}%`,
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await createApplicationMutation.mutateAsync(data);
      
      // Trigger AI analysis if application created successfully
      if (result.id && data.jobId) {
        setAiAnalyzing(true);
        await aiAnalysisMutation.mutateAsync(result.id);
        setAiAnalyzing(false);
      }
    } catch (error) {
      setAiAnalyzing(false);
    }
  };

  // Education management
  const addEducation = () => {
    if (currentEducation.institution && currentEducation.degree) {
      const currentEducations = form.getValues("education") || [];
      form.setValue("education", [...currentEducations, currentEducation]);
      setCurrentEducation({ institution: "", degree: "", field: "", year: "", gpa: "" });
    }
  };

  const removeEducation = (index: number) => {
    const currentEducations = form.getValues("education") || [];
    form.setValue("education", currentEducations.filter((_, i) => i !== index));
  };

  // Experience management
  const addExperience = () => {
    if (currentExperience.company && currentExperience.position) {
      const currentExperiences = form.getValues("experience") || [];
      const experienceToAdd = {
        ...currentExperience,
        achievements: currentExperience.achievements.filter(a => a.trim() !== "")
      };
      form.setValue("experience", [...currentExperiences, experienceToAdd]);
      setCurrentExperience({ company: "", position: "", duration: "", description: "", achievements: [""] });
    }
  };

  const removeExperience = (index: number) => {
    const currentExperiences = form.getValues("experience") || [];
    form.setValue("experience", currentExperiences.filter((_, i) => i !== index));
  };

  // Skills management
  const addSkill = () => {
    if (currentSkill.trim()) {
      const currentSkills = form.getValues("skills") || [];
      if (!currentSkills.includes(currentSkill.trim())) {
        form.setValue("skills", [...currentSkills, currentSkill.trim()]);
        setCurrentSkill("");
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const currentSkills = form.getValues("skills") || [];
    form.setValue("skills", currentSkills.filter(skill => skill !== skillToRemove));
  };

  // Certifications management
  const addCertification = () => {
    if (currentCertification.name && currentCertification.issuer) {
      const currentCertifications = form.getValues("certifications") || [];
      form.setValue("certifications", [...currentCertifications, currentCertification]);
      setCurrentCertification({ name: "", issuer: "", year: "" });
    }
  };

  const removeCertification = (index: number) => {
    const currentCertifications = form.getValues("certifications") || [];
    form.setValue("certifications", currentCertifications.filter((_, i) => i !== index));
  };

  const updateAchievement = (index: number, value: string) => {
    const newAchievements = [...currentExperience.achievements];
    newAchievements[index] = value;
    setCurrentExperience({ ...currentExperience, achievements: newAchievements });
  };

  const addAchievement = () => {
    setCurrentExperience({
      ...currentExperience,
      achievements: [...currentExperience.achievements, ""]
    });
  };

  const removeAchievement = (index: number) => {
    const newAchievements = currentExperience.achievements.filter((_, i) => i !== index);
    setCurrentExperience({ ...currentExperience, achievements: newAchievements });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Data Pelamar</h1>
          <p className="text-muted-foreground">
            Input data pelamar secara manual dengan analisis AI otomatis
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informasi Pribadi
                </CardTitle>
                <CardDescription>
                  Data diri dan kontak pelamar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="jobId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posisi yang Dilamar</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih posisi" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {jobs.map((job: any) => (
                            <SelectItem key={job.id} value={job.id.toString()}>
                              {job.title} - {job.departmentId}
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
                  name="applicantName"
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="applicantEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="applicantPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomor Telepon</FormLabel>
                        <FormControl>
                          <Input placeholder="+62 xxx xxxx xxxx" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="applicantAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Alamat lengkap" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Lahir</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis Kelamin</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih jenis kelamin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="laki-laki">Laki-laki</SelectItem>
                            <SelectItem value="perempuan">Perempuan</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expectedSalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ekspektasi Gaji</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="5000000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="availableStartDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Mulai Tersedia</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Riwayat Pendidikan
                </CardTitle>
                <CardDescription>
                  Tambahkan riwayat pendidikan pelamar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current education entries */}
                <div className="space-y-2">
                  {form.watch("education")?.map((edu, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{edu.degree} - {edu.field}</p>
                        <p className="text-sm text-muted-foreground">{edu.institution} ({edu.year})</p>
                        {edu.gpa && <p className="text-sm">IPK: {edu.gpa}</p>}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEducation(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add new education */}
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Institusi"
                      value={currentEducation.institution}
                      onChange={(e) => setCurrentEducation({ ...currentEducation, institution: e.target.value })}
                    />
                    <Input
                      placeholder="Jenjang (S1, S2, dll)"
                      value={currentEducation.degree}
                      onChange={(e) => setCurrentEducation({ ...currentEducation, degree: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      placeholder="Bidang studi"
                      value={currentEducation.field}
                      onChange={(e) => setCurrentEducation({ ...currentEducation, field: e.target.value })}
                    />
                    <Input
                      placeholder="Tahun lulus"
                      value={currentEducation.year}
                      onChange={(e) => setCurrentEducation({ ...currentEducation, year: e.target.value })}
                    />
                    <Input
                      placeholder="IPK (opsional)"
                      value={currentEducation.gpa}
                      onChange={(e) => setCurrentEducation({ ...currentEducation, gpa: e.target.value })}
                    />
                  </div>
                  <Button type="button" onClick={addEducation} size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Pendidikan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Experience */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Pengalaman Kerja
              </CardTitle>
              <CardDescription>
                Tambahkan pengalaman kerja pelamar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current experience entries */}
              <div className="space-y-3">
                {form.watch("experience")?.map((exp, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{exp.position}</p>
                        <p className="text-sm text-muted-foreground">{exp.company} • {exp.duration}</p>
                        <p className="text-sm mt-2">{exp.description}</p>
                        {exp.achievements && exp.achievements.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium">Pencapaian:</p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                              {exp.achievements.map((achievement, i) => (
                                <li key={i}>{achievement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExperience(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add new experience */}
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Nama perusahaan"
                    value={currentExperience.company}
                    onChange={(e) => setCurrentExperience({ ...currentExperience, company: e.target.value })}
                  />
                  <Input
                    placeholder="Posisi/Jabatan"
                    value={currentExperience.position}
                    onChange={(e) => setCurrentExperience({ ...currentExperience, position: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Durasi (contoh: Jan 2020 - Des 2022)"
                  value={currentExperience.duration}
                  onChange={(e) => setCurrentExperience({ ...currentExperience, duration: e.target.value })}
                />
                <Textarea
                  placeholder="Deskripsi pekerjaan dan tanggung jawab"
                  value={currentExperience.description}
                  onChange={(e) => setCurrentExperience({ ...currentExperience, description: e.target.value })}
                />
                
                {/* Achievements */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pencapaian (opsional):</label>
                  {currentExperience.achievements.map((achievement, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Pencapaian ${index + 1}`}
                        value={achievement}
                        onChange={(e) => updateAchievement(index, e.target.value)}
                      />
                      {currentExperience.achievements.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeAchievement(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addAchievement}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Pencapaian
                  </Button>
                </div>

                <Button type="button" onClick={addExperience} size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Pengalaman
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Keahlian
                </CardTitle>
                <CardDescription>
                  Tambahkan keahlian dan kompetensi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current skills */}
                <div className="flex flex-wrap gap-2">
                  {form.watch("skills")?.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                {/* Add new skill */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Tambah keahlian"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <Button type="button" onClick={addSkill} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Sertifikasi
                </CardTitle>
                <CardDescription>
                  Tambahkan sertifikasi yang dimiliki
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current certifications */}
                <div className="space-y-2">
                  {form.watch("certifications")?.map((cert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{cert.name}</p>
                        <p className="text-sm text-muted-foreground">{cert.issuer} ({cert.year})</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCertification(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add new certification */}
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <Input
                    placeholder="Nama sertifikat"
                    value={currentCertification.name}
                    onChange={(e) => setCurrentCertification({ ...currentCertification, name: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Penerbit"
                      value={currentCertification.issuer}
                      onChange={(e) => setCurrentCertification({ ...currentCertification, issuer: e.target.value })}
                    />
                    <Input
                      placeholder="Tahun"
                      value={currentCertification.year}
                      onChange={(e) => setCurrentCertification({ ...currentCertification, year: e.target.value })}
                    />
                  </div>
                  <Button type="button" onClick={addCertification} size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Sertifikasi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cover Letter */}
          <Card>
            <CardHeader>
              <CardTitle>Cover Letter</CardTitle>
              <CardDescription>
                Surat lamaran atau motivasi pelamar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="coverLetter"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Tuliskan cover letter atau surat motivasi..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => form.reset()}>
              Reset Form
            </Button>
            <Button 
              type="submit" 
              disabled={createApplicationMutation.isPending || aiAnalyzing}
              className="min-w-[200px]"
            >
              {aiAnalyzing ? (
                <>
                  <Brain className="mr-2 h-4 w-4 animate-spin" />
                  Menganalisis dengan AI...
                </>
              ) : createApplicationMutation.isPending ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Simpan & Analisis AI
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
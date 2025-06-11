import OpenAI from "openai";
import { JobApplication, Job } from "../shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AIMatchingResult {
  overallScore: number;
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  culturalFit: number;
  recommendations: string[];
  strengths: string[];
  concerns: string[];
  summary: string;
}

export class AIJobMatcher {
  async analyzeApplicantJobCompatibility(
    application: JobApplication,
    job: Job
  ): Promise<AIMatchingResult> {
    try {
      const prompt = this.buildAnalysisPrompt(application, job);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Anda adalah AI HR expert yang menganalisis kesesuaian pelamar dengan lowongan kerja. Berikan analisis mendalam dan objektif dalam bahasa Indonesia.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        overallScore: Math.max(0, Math.min(100, result.overallScore || 0)),
        skillsMatch: Math.max(0, Math.min(100, result.skillsMatch || 0)),
        experienceMatch: Math.max(0, Math.min(100, result.experienceMatch || 0)),
        educationMatch: Math.max(0, Math.min(100, result.educationMatch || 0)),
        culturalFit: Math.max(0, Math.min(100, result.culturalFit || 0)),
        recommendations: result.recommendations || [],
        strengths: result.strengths || [],
        concerns: result.concerns || [],
        summary: result.summary || "Analisis tidak tersedia",
      };
    } catch (error) {
      console.error("AI matching analysis failed:", error);
      throw new Error("Gagal menganalisis kesesuaian pelamar: " + error.message);
    }
  }

  private buildAnalysisPrompt(application: JobApplication, job: Job): string {
    const applicantProfile = {
      name: application.applicantName,
      email: application.applicantEmail,
      phone: application.applicantPhone,
      address: application.applicantAddress,
      education: application.education,
      experience: application.experience,
      skills: application.skills,
      certifications: application.certifications,
      expectedSalary: application.expectedSalary,
      coverLetter: application.coverLetter,
    };

    const jobRequirements = {
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      location: job.location,
      salaryRange: job.salaryRange,
      type: job.type,
    };

    return `
Analisis kesesuaian pelamar kerja berikut dengan posisi yang ditawarkan:

PROFIL PELAMAR:
${JSON.stringify(applicantProfile, null, 2)}

PERSYARATAN PEKERJAAN:
${JSON.stringify(jobRequirements, null, 2)}

Berikan analisis mendalam dalam format JSON dengan struktur berikut:
{
  "overallScore": [nilai 0-100],
  "skillsMatch": [nilai 0-100 untuk kesesuaian keahlian],
  "experienceMatch": [nilai 0-100 untuk kesesuaian pengalaman],
  "educationMatch": [nilai 0-100 untuk kesesuaian pendidikan],
  "culturalFit": [nilai 0-100 untuk kesesuaian budaya kerja],
  "recommendations": [
    "Rekomendasi spesifik 1",
    "Rekomendasi spesifik 2"
  ],
  "strengths": [
    "Kekuatan pelamar 1",
    "Kekuatan pelamar 2"
  ],
  "concerns": [
    "Kekhawatiran atau kekurangan 1",
    "Kekhawatiran atau kekurangan 2"
  ],
  "summary": "Ringkasan analisis lengkap dalam 2-3 kalimat"
}

Kriteria penilaian:
1. Skills Match: Seberapa cocok keahlian teknis pelamar dengan requirements
2. Experience Match: Relevansi dan level pengalaman kerja
3. Education Match: Kesesuaian latar belakang pendidikan
4. Cultural Fit: Potensi adaptasi dengan budaya dan nilai perusahaan
5. Overall Score: Rata-rata tertimbang dari semua aspek

Berikan penilaian yang objektif, konstruktif, dan actionable.
`;
  }

  async extractResumeData(resumeText: string): Promise<any> {
    try {
      const prompt = `
Ekstrak data structured dari resume berikut dalam format JSON:

RESUME TEXT:
${resumeText}

Format JSON yang diinginkan:
{
  "personalInfo": {
    "name": "nama lengkap",
    "email": "email",
    "phone": "nomor telepon",
    "address": "alamat"
  },
  "education": [
    {
      "institution": "nama institusi",
      "degree": "tingkat pendidikan",
      "field": "bidang studi",
      "year": "tahun lulus/periode",
      "gpa": "IPK jika ada"
    }
  ],
  "experience": [
    {
      "company": "nama perusahaan",
      "position": "posisi/jabatan",
      "duration": "periode kerja",
      "description": "deskripsi pekerjaan dan tanggung jawab",
      "achievements": ["pencapaian 1", "pencapaian 2"]
    }
  ],
  "skills": [
    "skill 1",
    "skill 2"
  ],
  "certifications": [
    {
      "name": "nama sertifikat",
      "issuer": "penerbit",
      "year": "tahun"
    }
  ],
  "languages": [
    {
      "language": "bahasa",
      "level": "tingkat kemampuan"
    }
  ]
}

Ekstrak semua informasi yang tersedia, gunakan null untuk data yang tidak tersedia.
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Anda adalah AI expert dalam mengekstrak data terstruktur dari resume. Berikan hasil ekstraksi yang akurat dan lengkap.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Resume extraction failed:", error);
      throw new Error("Gagal mengekstrak data resume: " + error.message);
    }
  }

  async generateInterviewQuestions(application: JobApplication, job: Job): Promise<string[]> {
    try {
      const prompt = `
Berdasarkan profil pelamar dan posisi yang dilamar, buatkan 8-10 pertanyaan interview yang relevan:

PROFIL PELAMAR:
- Nama: ${application.applicantName}
- Pendidikan: ${JSON.stringify(application.education)}
- Pengalaman: ${JSON.stringify(application.experience)}
- Keahlian: ${JSON.stringify(application.skills)}

POSISI YANG DILAMAR:
- Jabatan: ${job.title}
- Deskripsi: ${job.description}
- Requirements: ${job.requirements}

Format JSON yang diinginkan:
{
  "questions": [
    "Pertanyaan interview 1",
    "Pertanyaan interview 2",
    "dst..."
  ]
}

Buatkan pertanyaan yang:
1. Menggali pengalaman spesifik yang relevan
2. Menguji keahlian teknis
3. Mengeksplorasi motivasi dan culture fit
4. Mengidentifikasi potensi dan pembelajaran
5. Menanyakan situasi challenging yang pernah dihadapi
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Anda adalah HR expert yang membuat pertanyaan interview berkualitas tinggi untuk menilai kandidat secara komprehensif.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result.questions || [];
    } catch (error) {
      console.error("Interview questions generation failed:", error);
      throw new Error("Gagal membuat pertanyaan interview: " + error.message);
    }
  }
}

export const aiJobMatcher = new AIJobMatcher();
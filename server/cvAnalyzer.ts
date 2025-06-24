import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

// Using GPT-4.1 as requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CVAnalysisResult {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location?: string;
  };
  education: {
    degree: string;
    institution: string;
    year: string;
    gpa?: string;
  }[];
  workExperience: {
    position: string;
    company: string;
    duration: string;
    responsibilities: string[];
    yearsTotal: number;
  }[];
  skills: {
    technical: string[];
    soft: string[];
    languages: string[];
    certifications: string[];
  };
  summary: string;
}

export interface JobMatchScore {
  overallScore: number;
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  recommendations: string[];
  strengths: string[];
  concerns: string[];
  breakdown: {
    education: { score: number; reason: string };
    experience: { score: number; reason: string };
    skills: { score: number; reason: string };
    overall: { score: number; reason: string };
  };
}

export class CVAnalyzer {
  async extractCVContent(filePath: string): Promise<string> {
    try {
      const fullPath = path.join(process.cwd(), 'uploads', filePath);
      const fileExists = await fs.access(fullPath).then(() => true).catch(() => false);
      
      if (!fileExists) {
        throw new Error(`CV file not found: ${fullPath}`);
      }

      console.log("Reading CV file:", fullPath);
      const fileBuffer = await fs.readFile(fullPath);
      
      // Check file type and extract accordingly
      if (filePath.toLowerCase().endsWith('.pdf')) {
        console.log("Extracting PDF text using pdf.js...");
        
        try {
          // Use pdf.js to extract text from PDF
          const doc = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
          let fullText = '';
          
          for (let pageNum = 1; pageNum <= Math.min(doc.numPages, 3); pageNum++) {
            const page = await doc.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
          }
          
          console.log("PDF text extracted, length:", fullText.length);
          
          if (fullText.length < 50) {
            throw new Error("Insufficient text extracted from PDF");
          }
          
          return fullText;
        } catch (pdfError) {
          console.log("PDF.js extraction failed, using form data fallback:", pdfError.message);
          
          // Fallback: Return a simple text indicating CV is available but cannot be parsed
          return "CV document available but text extraction failed. Please analyze based on provided form data: education level, experience years, and other application details.";
        }
      } else {
        // For other file types (Word docs, images), use OpenAI vision
        console.log("Using OpenAI for file content extraction...");
        const base64Content = fileBuffer.toString('base64');
        
        const response = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
            {
              role: "system",
              content: "You are a CV/Resume text extraction expert. Extract all text content from the provided document accurately."
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Please extract all text content from this CV/Resume document. Return only the raw text content without any formatting or analysis."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:application/octet-stream;base64,${base64Content}`
                  }
                }
              ]
            }
          ],
          max_tokens: 2000
        });

        return response.choices[0].message.content || "";
      }
    } catch (error) {
      console.error("Error extracting CV content:", error);
      throw error;
    }
  }

  async analyzeCVContent(cvText: string): Promise<CVAnalysisResult> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system", 
            content: `You are an expert HR CV analyzer. Analyze the CV text and extract structured information. 
            Return a JSON object with the following structure:
            {
              "personalInfo": {
                "name": "string",
                "email": "string", 
                "phone": "string",
                "location": "string"
              },
              "education": [
                {
                  "degree": "string",
                  "institution": "string", 
                  "year": "string",
                  "gpa": "string"
                }
              ],
              "workExperience": [
                {
                  "position": "string",
                  "company": "string",
                  "duration": "string",
                  "responsibilities": ["string"],
                  "yearsTotal": number
                }
              ],
              "skills": {
                "technical": ["string"],
                "soft": ["string"], 
                "languages": ["string"],
                "certifications": ["string"]
              },
              "summary": "string"
            }`
          },
          {
            role: "user",
            content: `Analyze this CV and extract structured information:\n\n${cvText}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return result as CVAnalysisResult;
    } catch (error) {
      console.error("Error analyzing CV content:", error);
      throw error;
    }
  }

  async calculateJobMatch(cvAnalysis: CVAnalysisResult, jobDescription: string, jobTitle: string): Promise<JobMatchScore> {
    try {
      const prompt = `
You are an expert recruiter analyzing job-candidate compatibility. 

CANDIDATE PROFILE:
- Education: ${JSON.stringify(cvAnalysis.education)}
- Work Experience: ${JSON.stringify(cvAnalysis.workExperience)}
- Technical Skills: ${cvAnalysis.skills.technical.join(', ')}
- Soft Skills: ${cvAnalysis.skills.soft.join(', ')}
- Languages: ${cvAnalysis.skills.languages.join(', ')}
- Certifications: ${cvAnalysis.skills.certifications.join(', ')}

JOB REQUIREMENTS:
- Position: ${jobTitle}
- Description: ${jobDescription}

Calculate compatibility scores (0-100) and provide detailed analysis. Return JSON:
{
  "overallScore": number,
  "skillsMatch": number,
  "experienceMatch": number, 
  "educationMatch": number,
  "recommendations": ["string"],
  "strengths": ["string"],
  "concerns": ["string"],
  "breakdown": {
    "education": {"score": number, "reason": "string"},
    "experience": {"score": number, "reason": "string"}, 
    "skills": {"score": number, "reason": "string"},
    "overall": {"score": number, "reason": "string"}
  }
}
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content: "You are an expert HR recruiter specializing in candidate-job matching analysis."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return result as JobMatchScore;
    } catch (error) {
      console.error("Error calculating job match:", error);
      throw error;
    }
  }
}

export const cvAnalyzer = new CVAnalyzer();
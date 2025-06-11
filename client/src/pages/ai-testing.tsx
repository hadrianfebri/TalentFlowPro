import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Brain, Users, Target, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Application {
  id: number;
  applicantName: string;
  applicantEmail: string;
  status: string;
  jobId: number;
}

interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
}

interface AIMatchingResult {
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

export default function AITestingPage() {
  const [selectedApplication, setSelectedApplication] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [matchingResult, setMatchingResult] = useState<AIMatchingResult | null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch applications
  const { data: applications = [], isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: ['/api/job-applications']
  });

  // Fetch jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ['/api/jobs']
  });

  // AI Matching mutation
  const aiMatchingMutation = useMutation({
    mutationFn: async ({ applicationId, jobId }: { applicationId: number; jobId: number }) => {
      return apiRequest(`/api/test-ai-matching`, {
        method: 'POST',
        body: JSON.stringify({ applicationId, jobId })
      });
    },
    onSuccess: (data) => {
      setMatchingResult(data.analysis);
      toast({
        title: "Analisis AI Berhasil",
        description: "Hasil matching pelamar dan lowongan telah tersedia"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Analisis AI",
        description: error.message || "Gagal melakukan analisis AI matching",
        variant: "destructive"
      });
    }
  });

  // Interview questions mutation
  const questionsMutation = useMutation({
    mutationFn: async ({ applicationId, jobId }: { applicationId: number; jobId: number }) => {
      return apiRequest(`/api/generate-interview-questions`, {
        method: 'POST',
        body: JSON.stringify({ applicationId, jobId })
      });
    },
    onSuccess: (data) => {
      setInterviewQuestions(data.questions);
      toast({
        title: "Pertanyaan Interview Dibuat",
        description: `${data.questions.length} pertanyaan interview telah dihasilkan`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Generate Questions",
        description: error.message || "Gagal membuat pertanyaan interview",
        variant: "destructive"
      });
    }
  });

  const runAIMatching = () => {
    if (!selectedApplication || !selectedJob) {
      toast({
        title: "Pilih Data",
        description: "Silakan pilih pelamar dan lowongan kerja terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    aiMatchingMutation.mutate({
      applicationId: selectedApplication,
      jobId: selectedJob
    });
  };

  const generateQuestions = () => {
    if (!selectedApplication || !selectedJob) {
      toast({
        title: "Pilih Data",
        description: "Silakan pilih pelamar dan lowongan kerja terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    questionsMutation.mutate({
      applicationId: selectedApplication,
      jobId: selectedJob
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">AI Testing Center</h1>
          <p className="text-gray-600">Test DeepSeek AI untuk analisis kesesuaian pelamar dan lowongan kerja</p>
        </div>
      </div>

      {/* Selection Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Pilih Data untuk Testing
          </CardTitle>
          <CardDescription>
            Pilih pelamar dan lowongan kerja untuk menguji sistem AI matching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pilih Pelamar</Label>
              <Select
                value={selectedApplication?.toString() || ""}
                onValueChange={(value) => setSelectedApplication(parseInt(value))}
                disabled={applicationsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={applicationsLoading ? "Loading..." : "Pilih pelamar"} />
                </SelectTrigger>
                <SelectContent>
                  {applications.map((app) => (
                    <SelectItem key={app.id} value={app.id.toString()}>
                      {app.applicantName} - {app.applicantEmail}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pilih Lowongan Kerja</Label>
              <Select
                value={selectedJob?.toString() || ""}
                onValueChange={(value) => setSelectedJob(parseInt(value))}
                disabled={jobsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={jobsLoading ? "Loading..." : "Pilih lowongan"} />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.title} - {job.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={runAIMatching}
              disabled={!selectedApplication || !selectedJob || aiMatchingMutation.isPending}
              className="flex items-center gap-2"
            >
              {aiMatchingMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              Run AI Matching
            </Button>

            <Button
              onClick={generateQuestions}
              disabled={!selectedApplication || !selectedJob || questionsMutation.isPending}
              variant="outline"
              className="flex items-center gap-2"
            >
              {questionsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Generate Interview Questions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Matching Results */}
      {matchingResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Hasil Analisis AI Matching
            </CardTitle>
            <CardDescription>
              Analisis kesesuaian antara pelamar dan lowongan kerja menggunakan DeepSeek AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Score */}
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className={`text-4xl font-bold ${getScoreColor(matchingResult.overallScore)}`}>
                {matchingResult.overallScore}%
              </div>
              <p className="text-gray-600 mt-2">Overall Compatibility Score</p>
            </div>

            {/* Detailed Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Skills Match</span>
                  <Badge className={getScoreBadge(matchingResult.skillsMatch)}>
                    {matchingResult.skillsMatch}%
                  </Badge>
                </div>
                <Progress value={matchingResult.skillsMatch} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Experience</span>
                  <Badge className={getScoreBadge(matchingResult.experienceMatch)}>
                    {matchingResult.experienceMatch}%
                  </Badge>
                </div>
                <Progress value={matchingResult.experienceMatch} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Education</span>
                  <Badge className={getScoreBadge(matchingResult.educationMatch)}>
                    {matchingResult.educationMatch}%
                  </Badge>
                </div>
                <Progress value={matchingResult.educationMatch} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Cultural Fit</span>
                  <Badge className={getScoreBadge(matchingResult.culturalFit)}>
                    {matchingResult.culturalFit}%
                  </Badge>
                </div>
                <Progress value={matchingResult.culturalFit} className="h-2" />
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Ringkasan Analisis</h4>
                <p className="text-gray-700 bg-blue-50 p-3 rounded">{matchingResult.summary}</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Strengths */}
                <div>
                  <h4 className="font-semibold mb-2 text-green-700">Kekuatan</h4>
                  <ul className="space-y-1">
                    {matchingResult.strengths.map((strength, index) => (
                      <li key={index} className="text-sm text-green-600 flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Concerns */}
                <div>
                  <h4 className="font-semibold mb-2 text-red-700">Kekhawatiran</h4>
                  <ul className="space-y-1">
                    {matchingResult.concerns.map((concern, index) => (
                      <li key={index} className="text-sm text-red-600 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="font-semibold mb-2 text-blue-700">Rekomendasi</h4>
                  <ul className="space-y-1">
                    {matchingResult.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-blue-600 flex items-start gap-2">
                        <Target className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interview Questions */}
      {interviewQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Pertanyaan Interview AI-Generated
            </CardTitle>
            <CardDescription>
              Pertanyaan interview yang dibuat khusus berdasarkan profil pelamar dan requirements pekerjaan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {interviewQuestions.map((question, index) => (
                <div key={index} className="border-l-4 border-purple-200 pl-4 py-2">
                  <span className="font-medium text-purple-700">Q{index + 1}:</span>
                  <p className="mt-1 text-gray-700">{question}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Panel */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Tentang DeepSeek AI Testing</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <p className="mb-3">
            Sistem AI testing ini menggunakan DeepSeek AI untuk menganalisis kesesuaian antara pelamar dan lowongan kerja berdasarkan:
          </p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Kesesuaian keahlian teknis dengan requirements</li>
            <li>Relevansi dan level pengalaman kerja</li>
            <li>Kesesuaian latar belakang pendidikan</li>
            <li>Potensi adaptasi dengan budaya perusahaan</li>
          </ul>
          <p className="mt-3 text-sm">
            Hasil analisis dapat membantu tim HR dalam proses seleksi dan pembuatan keputusan yang lebih objektif.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
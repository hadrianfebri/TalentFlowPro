import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface AIInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
}

interface RewardWallet {
  totalPoints: number;
  monthlyPoints: number;
  activeEmployees: number;
  totalEmployees: number;
}

export default function AIInsights() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { data: insights, isLoading: insightsLoading } = useQuery<AIInsight[]>({
    queryKey: ["/api/dashboard/ai-insights"],
  });

  const { data: rewardWallet } = useQuery<RewardWallet>({
    queryKey: ["/api/dashboard/reward-wallet"],
  });

  // For employees, only show reward wallet, not AI insights which are for management
  if (user?.role === 'employee') {
    return (
      <div className="space-y-6">
        {/* Personal Reward Wallet for Employee */}
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground">Reward Saya</CardTitle>
              <Badge variant="outline" className="text-xs bg-secondary/10 text-secondary border-secondary/20">
                BETA
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {!rewardWallet ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">Memuat data reward...</p>
              </div>
            ) : (
              <>
                <div className="text-center py-4">
                  <div className="w-16 h-16 reward-badge rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white text-xl font-bold">
                      {Math.floor((rewardWallet.monthlyPoints || 0) / 10)}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {(rewardWallet.monthlyPoints || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Poin Saya Bulan Ini</p>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium text-secondary">
                      Aktif
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Ranking</span>
                    <span className="font-medium">
                      Top Performer
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const generateInsightsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/generate-insights"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/ai-insights"] });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-destructive text-destructive-foreground';
      case 'medium':
        return 'bg-yellow-500 text-yellow-50';
      case 'low':
        return 'bg-green-500 text-green-50';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return AlertTriangle;
      case 'medium':
        return TrendingUp;
      case 'low':
        return Users;
      default:
        return Brain;
    }
  };

  if (insightsLoading) {
    return (
      <div className="space-y-6">
        <Card className="ai-insight-card">
          <CardHeader>
            <div className="flex items-center">
              <Skeleton className="w-8 h-8 rounded-lg mr-3" />
              <Skeleton className="h-6 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Insights Card */}
      <Card className="ai-insight-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                <Brain className="w-4 h-4 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg font-semibold text-foreground">AI Insights</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              DeepSeek AI
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!insights || insights.length === 0 ? (
            <div className="text-center py-6">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-sm mb-4">
                Belum ada insights AI tersedia
              </p>
              <Button 
                size="sm" 
                onClick={() => generateInsightsMutation.mutate()}
                disabled={generateInsightsMutation.isPending}
              >
                {generateInsightsMutation.isPending ? "Menganalisis..." : "Generate Insights"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.slice(0, 2).map((insight) => {
                const SeverityIcon = getSeverityIcon(insight.severity);
                return (
                  <div key={insight.id} className="bg-card p-4 rounded-lg border border-border/50">
                    <div className="flex items-start">
                      <div className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${
                        insight.severity === 'high' ? 'bg-destructive' :
                        insight.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-foreground">
                            {insight.title}
                          </p>
                          <Badge className={getSeverityColor(insight.severity)} variant="secondary">
                            <SeverityIcon className="w-3 h-3 mr-1" />
                            {insight.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <Button 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                size="sm"
              >
                Lihat Analisis Lengkap
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Momentum Loop Rewards */}
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">Reward Wallet</CardTitle>
            <Badge variant="outline" className="text-xs bg-secondary/10 text-secondary border-secondary/20">
              BETA
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!rewardWallet ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm">Memuat data reward...</p>
            </div>
          ) : (
            <>
              <div className="text-center py-4">
                <div className="w-16 h-16 reward-badge rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white text-xl font-bold">
                    {Math.floor(rewardWallet.totalPoints / 100)}K
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {rewardWallet.totalPoints.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Poin Perusahaan</p>
              </div>
              
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Poin bulan ini</span>
                  <span className="font-medium text-secondary">
                    +{rewardWallet.monthlyPoints}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Karyawan aktif</span>
                  <span className="font-medium">
                    {rewardWallet.activeEmployees}/{rewardWallet.totalEmployees}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { hrLoginSchema, type HRLoginInput } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import talentWhizLogo from "@assets/TALENTWHIZ_COLOR_1749955055542.png";

export default function HRLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<HRLoginInput>({
    resolver: zodResolver(hrLoginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "hr",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: HRLoginInput) => {
      const response = await fetch("/api/auth/login-hr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t("login.success.title"),
        description: t("login.success.description"),
      });
      
      // Redirect to HR dashboard
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: t("login.error.title"),
        description: error.message || t("login.error.description"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: HRLoginInput) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg p-2">
            <img 
              src={talentWhizLogo} 
              alt="TalentWhiz.ai Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#2f4f2f] dark:text-white">
              TalentWhiz.ai
            </h1>
            <p className="text-xs text-[#519e51] dark:text-gray-400 font-medium">
              UMKM Essentials
            </p>
            <p className="text-[#519e51] dark:text-gray-400 mt-2">
              {t("login.hr.subtitle")}
            </p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">
              {t("login.hr.title")}
            </CardTitle>
            <CardDescription className="text-center">
              {t("login.hr.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("login.email.label")}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t("login.email.placeholder")}
                          {...field}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("login.password.label")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder={t("login.password.placeholder")}
                            {...field}
                            className="h-11 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 bg-[#2f4f2f] hover:bg-[#519e51]"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t("login.signing_in")}</span>
                    </div>
                  ) : (
                    t("login.submit")
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 pt-6 border-t">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("login.switch.employee_question")}
                </p>
                <Link
                  href="/employee-login"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center space-x-1"
                >
                  <Users className="h-4 w-4" />
                  <span>{t("login.switch.employee_login")}</span>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; 2024 TalentFlow. {t("common.all_rights_reserved")}</p>
        </div>
      </div>
    </div>
  );
}
import { Switch, Route } from "wouter";
import { Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";

// Keep essential pages loaded immediately
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";

// Load all pages immediately to prevent suspension issues
import NotFound from "@/pages/not-found";
import Employees from "@/pages/employees";
import Attendance from "@/pages/attendance";
import Payroll from "@/pages/payroll";
import Leaves from "@/pages/leaves";
import Documents from "@/pages/documents";
import Reimbursements from "@/pages/reimbursements";
import Performance from "@/pages/performance";
import Recruitment from "@/pages/recruitment";
import SalaryComponents from "@/pages/salary-components";
import Settings from "@/pages/settings";
import ApplicantUpload from "@/pages/applicant-upload";
import AITesting from "@/pages/ai-testing";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/employees" component={Employees} />
          <Route path="/attendance" component={Attendance} />
          <Route path="/payroll" component={Payroll} />
          <Route path="/leaves" component={Leaves} />
          <Route path="/documents" component={Documents} />
          <Route path="/reimbursement" component={Reimbursements} />
          <Route path="/performance" component={Performance} />
          <Route path="/recruitment" component={Recruitment} />
          <Route path="/applicant-upload" component={ApplicantUpload} />
          <Route path="/ai-testing" component={AITesting} />
          <Route path="/salary-components" component={SalaryComponents} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

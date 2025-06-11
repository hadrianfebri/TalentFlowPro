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

// Lazy load other pages for better performance
const NotFound = lazy(() => import("@/pages/not-found"));
const Employees = lazy(() => import("@/pages/employees"));
const Attendance = lazy(() => import("@/pages/attendance"));
const Payroll = lazy(() => import("@/pages/payroll"));
const Leaves = lazy(() => import("@/pages/leaves"));
const Documents = lazy(() => import("@/pages/documents"));
const Reimbursement = lazy(() => import("@/pages/reimbursement"));
const Performance = lazy(() => import("@/pages/performance"));
const Recruitment = lazy(() => import("@/pages/recruitment"));
const SalaryComponents = lazy(() => import("@/pages/salary-components"));

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
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }>
          <Route path="/" component={Dashboard} />
          <Route path="/employees" component={Employees} />
          <Route path="/attendance" component={Attendance} />
          <Route path="/payroll" component={Payroll} />
          <Route path="/leaves" component={Leaves} />
          <Route path="/documents" component={Documents} />
          <Route path="/reimbursement" component={Reimbursement} />
          <Route path="/performance" component={Performance} />
          <Route path="/recruitment" component={Recruitment} />
          <Route path="/salary-components" component={SalaryComponents} />
        </Suspense>
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

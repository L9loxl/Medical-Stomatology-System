import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/components/auth-provider";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import PatientsPage from "@/pages/patients";
import PatientDetailPage from "@/pages/patient-detail";
import AppointmentsPage from "@/pages/appointments";
import FinancialPage from "@/pages/financial";
import ImagingPage from "@/pages/imaging";
import DentalChartPage from "@/pages/dental-chart-page";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading AMS...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route>{() => <Redirect to="/login" />}</Route>
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/">{() => <Redirect to="/dashboard" />}</Route>
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/patients" component={PatientsPage} />
        <Route path="/patients/:id" component={PatientDetailPage} />
        <Route path="/appointments" component={AppointmentsPage} />
        <Route path="/financial" component={FinancialPage} />
        <Route path="/imaging" component={ImagingPage} />
        <Route path="/dental-chart" component={DentalChartPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="ams-theme">
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRoutes />
          </WouterRouter>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

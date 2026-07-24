import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { DashboardPage } from "@/pages/Dashboard";
import { AnalyticsPage } from "@/pages/Analytics";
import { CalendarPage } from "@/pages/Calendar";
import { ProfilePage } from "@/pages/Profile";
import { OnboardingPage } from "@/pages/Onboarding";
import { AuthPage } from "@/pages/Auth";
import { AddEntryModalLauncher } from "@/components/modals/AddEntryModalLauncher";
import { MilestoneModalLauncher } from "@/components/modals/MilestoneModalLauncher";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0D0D12] text-[#eadfed]">
          <Navigation />
          <main className="lg:pl-64 min-h-screen pb-24 lg:pb-8">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <AddEntryModalLauncher />
          <MilestoneModalLauncher />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import Dashboard from "./pages/Dashboard";
import IncidentList from "./pages/IncidentList";
import IncidentDetail from "./pages/IncidentDetail";
import AlertList from "./pages/AlertList";
import Metrics from "./pages/Metrics";
import EmailLogs from "./pages/EmailLogs";
import TelemetrySimulator from "./pages/TelemetrySimulator";

// Initialize TanStack React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Layout() {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/incidents" element={<IncidentList />} />
            <Route path="/incidents/:id" element={<IncidentDetail />} />
            <Route path="/alerts" element={<AlertList />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/emails" element={<EmailLogs />} />
            <Route path="/simulate" element={<TelemetrySimulator />} />

            {/* Catch-all redirection */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

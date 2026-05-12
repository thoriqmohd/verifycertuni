import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PublicVerify from "./pages/PublicVerify";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUniversities from "./pages/admin/AdminUniversities";
import AdminPaymentSettings from "./pages/admin/AdminPaymentSettings";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminTransactions from "./pages/admin/AdminTransactions";

import UniDashboard from "./pages/university/UniDashboard";
import UniCertificates from "./pages/university/UniCertificates";
import UniApi from "./pages/university/UniApi";
import UniRevenue from "./pages/university/UniRevenue";

import EmployerDashboard from "./pages/employer/EmployerDashboard";
import EmployerSearch from "./pages/employer/EmployerSearch";
import EmployerPayment from "./pages/employer/EmployerPayment";
import EmployerPaymentReturn from "./pages/employer/EmployerPaymentReturn";
import EmployerReport from "./pages/employer/EmployerReport";
import EmployerHistory from "./pages/employer/EmployerHistory";

import FinanceDashboard from "./pages/finance/FinanceDashboard";
import FinanceTransactions from "./pages/finance/FinanceTransactions";
import FinanceSettlements from "./pages/finance/FinanceSettlements";

const qc = new QueryClient();

const App = () => (
  <QueryClientProvider client={qc}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify/:certificateNumber" element={<PublicVerify />} />

            <Route path="/admin/dashboard" element={<ProtectedRoute allow={["super_admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/universities" element={<ProtectedRoute allow={["super_admin"]}><AdminUniversities /></ProtectedRoute>} />
            <Route path="/admin/transactions" element={<ProtectedRoute allow={["super_admin"]}><AdminTransactions /></ProtectedRoute>} />
            <Route path="/admin/payment-settings" element={<ProtectedRoute allow={["super_admin"]}><AdminPaymentSettings /></ProtectedRoute>} />
            <Route path="/admin/audit-logs" element={<ProtectedRoute allow={["super_admin"]}><AdminAuditLogs /></ProtectedRoute>} />

            <Route path="/university/dashboard" element={<ProtectedRoute allow={["university_admin"]}><UniDashboard /></ProtectedRoute>} />
            <Route path="/university/certificates" element={<ProtectedRoute allow={["university_admin"]}><UniCertificates /></ProtectedRoute>} />
            <Route path="/university/api-integration" element={<ProtectedRoute allow={["university_admin"]}><UniApi /></ProtectedRoute>} />
            <Route path="/university/revenue" element={<ProtectedRoute allow={["university_admin"]}><UniRevenue /></ProtectedRoute>} />

            <Route path="/employer/dashboard" element={<ProtectedRoute allow={["employer"]}><EmployerDashboard /></ProtectedRoute>} />
            <Route path="/employer/search" element={<ProtectedRoute allow={["employer"]}><EmployerSearch /></ProtectedRoute>} />
            <Route path="/employer/payment/:id" element={<ProtectedRoute allow={["employer"]}><EmployerPayment /></ProtectedRoute>} />
            <Route path="/employer/report/:id" element={<ProtectedRoute allow={["employer"]}><EmployerReport /></ProtectedRoute>} />
            <Route path="/employer/history" element={<ProtectedRoute allow={["employer"]}><EmployerHistory /></ProtectedRoute>} />

            <Route path="/finance/dashboard" element={<ProtectedRoute allow={["finance_admin"]}><FinanceDashboard /></ProtectedRoute>} />
            <Route path="/finance/transactions" element={<ProtectedRoute allow={["finance_admin"]}><FinanceTransactions /></ProtectedRoute>} />
            <Route path="/finance/settlements" element={<ProtectedRoute allow={["finance_admin"]}><FinanceSettlements /></ProtectedRoute>} />

            <Route path="/settings" element={<ProtectedRoute allow={["super_admin","university_admin","employer","finance_admin"]}><Settings /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

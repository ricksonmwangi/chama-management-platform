import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Contributions from "./pages/Contributions";
import Loans from "./pages/Loans";
import Repayments from "./pages/Repayments";
import Meetings from "./pages/Meetings";
import AuditLogs from "./pages/AuditLogs";
import Mpesa from "./pages/Mpesa";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/members" element={<Members />} />
              <Route path="/contributions" element={<Contributions />} />
              <Route path="/loans" element={<Loans />} />
              <Route path="/repayments" element={<Repayments />} />
              <Route path="/meetings" element={<Meetings />} />
              <Route path="/audit" element={<AuditLogs />} />
              <Route path="/mpesa" element={<Mpesa />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

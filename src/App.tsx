import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { Consulta } from "@/routes/Consulta";
import { Login } from "@/routes/Login";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/consulta" element={<Consulta />} />
          </Route>
          <Route path="/" element={<Navigate to="/consulta" replace />} />
          <Route path="*" element={<Navigate to="/consulta" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

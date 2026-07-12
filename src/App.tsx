import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { SWRConfig } from "swr";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { Consulta } from "@/routes/Consulta";
import { Login } from "@/routes/Login";

export function App() {
  return (
    <AuthProvider>
      <SWRConfig value={{ revalidateOnFocus: false, shouldRetryOnError: false, dedupingInterval: 5000 }}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
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
      </SWRConfig>
    </AuthProvider>
  );
}

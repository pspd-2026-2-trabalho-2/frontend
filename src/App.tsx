import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { SWRConfig } from "swr";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { Consulta } from "@/routes/Consulta";
import { Login } from "@/routes/Login";

// BASE_URL do Vite sempre termina em "/" ("/grupo3/"), mas o basename do Router
// não pode ter barra final: senão a URL sem barra ("/grupo3") não casa e nada renderiza.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

export function App() {
  return (
    <AuthProvider>
      <SWRConfig value={{ revalidateOnFocus: false, shouldRetryOnError: false, dedupingInterval: 5000 }}>
        <BrowserRouter basename={basename}>
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

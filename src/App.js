import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import AppLayout from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ToastProvider } from "./components/ToastProvider";
import { AuthProvider } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import EvaluateProjectPage from "./pages/EvaluateProjectPage";
import PortfolioPage from "./pages/PortfolioPage";
import ProjectsPage from "./pages/ProjectsPage";
import UsersPage from "./pages/UsersPage";
import WelcomePage from "./pages/WelcomePage";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProjectsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId/evaluate"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <EvaluateProjectPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/portfolio"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PortfolioPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <UsersPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

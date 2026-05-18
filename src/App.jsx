import { ConfigProvider, theme as antdTheme, App as AntdApp } from "antd";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./store/authContext";
import { useAuth } from "./store/useAuth";
import { darkTheme, lightTheme } from "./theme";
import ResetPassword from "./pages/ResetPassword";

import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Import from "./pages/Import";

// =============================================================================
// ProtectedRoute — redirects to login if not authenticated
// =============================================================================
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Still checking localStorage — don't redirect yet
  if (isLoading) return null;

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// =============================================================================
// ThemedApp — applies correct theme based on system preference
// =============================================================================
const ThemedApp = () => {
  // Detect system color scheme preference
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const selectedTheme = prefersDark ? darkTheme : lightTheme;

  return (
    <ConfigProvider
      theme={{
        algorithm: prefersDark
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
        ...selectedTheme,
      }}
    >
      <AntdApp>
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected routes — wrapped in AppLayout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="accounts" element={<Accounts />} />
              <Route path="import" element={<Import />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
};

// =============================================================================
// App — root component, wraps everything in AuthProvider
// =============================================================================
const App = () => (
  <AuthProvider>
    <ThemedApp />
  </AuthProvider>
);

export default App;

import { ConfigProvider, theme as antdTheme, App as AntdApp } from "antd";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./store/AuthContext";
import { useAuth } from "./store/useAuth";
import { darkTheme } from "./theme";
import ResetPassword from "./pages/ResetPassword";
import Watchlist from "./pages/Watchlist";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import SetPassword from "./pages/SetPassword";

import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Import from "./pages/Import";

// Detect invite token in URL hash BEFORE routing
// Must happen here so we can redirect before ProtectedRoute fires
const hash = window.location.hash;
if (hash) {
  const params = new URLSearchParams(hash.substring(1));
  const accessToken  = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const type         = params.get('type');

  if (accessToken && type === 'invite') {
    localStorage.setItem('ptraker_token', accessToken);
    if (refreshToken) localStorage.setItem('ptraker_refresh_token', refreshToken);
    window.history.replaceState(null, '', '/set-password');
  }
}

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
  return (
    <ConfigProvider
      theme={{
        algorithm: antdTheme.darkAlgorithm,
        ...darkTheme,
      }}
    >
      <AntdApp>
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/set-password" element={<SetPassword />} />

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
              <Route path="watchlist" element={<Watchlist />} />
              <Route path="admin" element={<Admin />} />
              <Route path="profile" element={<Profile />} />
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

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SetupWizard from "./pages/SetupWizard";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import DebtDashboard from "./pages/DebtDashboard";
import RetirementPage from "./pages/Retirement";
import MemoryExplorer from "./pages/MemoryExplorer";
import MultiAgent from "./pages/MultiAgent";
import "./styles/ocean.css";
import "./styles/retirement.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/setup"
            element={
              <ProtectedRoute>
                <SetupWizard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/portfolio"
            element={
              <ProtectedRoute>
                <Portfolio />
              </ProtectedRoute>
            }
          />
          <Route
            path="/debt"
            element={
              <ProtectedRoute>
                <DebtDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/retirement"
            element={
              <ProtectedRoute>
                <RetirementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/memory"
            element={
              <ProtectedRoute>
                <MemoryExplorer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orchestrate"
            element={
              <ProtectedRoute>
                <MultiAgent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
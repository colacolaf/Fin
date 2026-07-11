import { BrowserRouter, Routes, Route } from "react-router-dom";
import SetupWizard from "./pages/SetupWizard";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import DebtDashboard from "./pages/DebtDashboard";
import RetirementPage from "./pages/Retirement";
import MemoryExplorer from "./pages/MemoryExplorer";
import MultiAgent from "./pages/MultiAgent";
import ExecutionDashboard from "./pages/ExecutionDashboard";
import CommunityDashboard from "./pages/CommunityDashboard";
import BacktestDashboard from "./pages/BacktestDashboard";
import OfflinePage from "./pages/OfflinePage";
import NetworkTransition from "./components/NetworkTransition";
import OfflineBanner from "./components/OfflineBanner";
import SyncIndicator from "./components/SyncIndicator";
import "./styles/ocean.css";
import "./styles/retirement.css";

function App() {
  return (
    <BrowserRouter>
      <NetworkTransition>
        <OfflineBanner />
        <SyncIndicator />
        <Routes>
          <Route path="/offline" element={<OfflinePage />} />
          <Route path="/setup" element={<SetupWizard />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/debt" element={<DebtDashboard />} />
          <Route path="/retirement" element={<RetirementPage />} />
          <Route path="/memory" element={<MemoryExplorer />} />
          <Route path="/orchestrate" element={<MultiAgent />} />
          <Route path="/execution" element={<ExecutionDashboard />} />
          <Route path="/community" element={<CommunityDashboard />} />
          <Route path="/backtest" element={<BacktestDashboard />} />
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </NetworkTransition>
    </BrowserRouter>
  );
}

export default App;
import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import SetupWizard from "./pages/SetupWizard";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import DebtDashboard from "./pages/DebtDashboard";
import RetirementPage from "./pages/Retirement";
import MemoryExplorer from "./pages/MemoryExplorer";
import MultiAgent from "./pages/MultiAgent";
import ExecutionDashboard from "./pages/ExecutionDashboard";
import CommunityDashboard from "./pages/CommunityDashboard";
import RecommendationsDashboard from "./pages/RecommendationsDashboard";
import BacktestDashboard from "./pages/BacktestDashboard";
import Settings from "./pages/Settings";
import OfflinePage from "./pages/OfflinePage";
import NetworkTransition from "./components/NetworkTransition";
import OfflineBanner from "./components/OfflineBanner";
import SyncIndicator from "./components/SyncIndicator";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import Breadcrumbs from "./components/layout/Breadcrumbs";
import ToastViewport from "./components/ui/Toast";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import CommandPalette, { type PaletteItem } from "./components/ui/CommandPalette";
import { toast } from "./hooks/useToast";
import { useGlobalHotkeys } from "./hooks/useGlobalHotkeys";
import { applySWUpdate } from "./registerSW";
import "./styles/ocean.css";
import "./styles/retirement.css";

const SIDEBAR_BREAKPOINT = 1024;

/**
 * Inner body that lives INSIDE the router so useNavigate() / useLocation() work.
 */
function AppBody() {
  const navigate = useNavigate();
  const location = useLocation();
  // /memory owns its own local palette — suppress the global one to avoid
  // both palettes opening on the same ⌘K press.
  const isMemoryRoute = location.pathname.startsWith("/memory");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Phase 31: SW lifecycle into the toast surface.
  useEffect(() => {
    const onRegFailed = () =>
      toast.warn("Offline cache could not register \u2014 refresh manually", { duration: 12000 });
    const onUpdate = () =>
      toast.info("New version available", {
        action: { label: "Refresh", onClick: applySWUpdate },
        duration: 12000,
      });
    window.addEventListener("sw:registration-failed", onRegFailed);
    window.addEventListener("sw:update-available", onUpdate);
    return () => {
      window.removeEventListener("sw:registration-failed", onRegFailed);
      window.removeEventListener("sw:update-available", onUpdate);
    };
  }, []);

  // Auto-collapse sidebar when viewport crosses below desktop breakpoint.
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < SIDEBAR_BREAKPOINT) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Index of palette entries \u2014 the navigator is the only dependency here.
  const paletteItems = useMemo<PaletteItem[]>(() => {
    const goto = (to: string) => () => navigate(to);
    const navs: PaletteItem[] = [
      { id: "nav-dashboard", group: "Navigate", label: "Dashboard", hint: "/", keywords: ["home", "overview"], run: goto("/") },
      { id: "nav-portfolio", group: "Navigate", label: "Portfolio", hint: "/portfolio", keywords: ["holdings"], run: goto("/portfolio") },
      { id: "nav-debt", group: "Navigate", label: "Debt", hint: "/debt", keywords: ["payoff"], run: goto("/debt") },
      { id: "nav-retirement", group: "Navigate", label: "Retirement", hint: "/retirement", keywords: ["401k", "ira"], run: goto("/retirement") },
      { id: "nav-memory", group: "Navigate", label: "Memory", hint: "/memory", keywords: ["notes"], run: goto("/memory") },
      { id: "nav-multi-agent", group: "Navigate", label: "Multi-Agent", hint: "/orchestrate", keywords: ["orchestrate"], run: goto("/orchestrate") },
      { id: "nav-recommendations", group: "Navigate", label: "Recommendations", hint: "/recommendations", keywords: ["recs"], run: goto("/recommendations") },
      { id: "nav-execution", group: "Navigate", label: "Execution", hint: "/execution", keywords: ["mark executed"], run: goto("/execution") },
      { id: "nav-community", group: "Navigate", label: "Community", hint: "/community", run: goto("/community") },
      { id: "nav-analytics", group: "Navigate", label: "Analytics", hint: "/analytics", run: goto("/analytics") },
      { id: "nav-backtest", group: "Navigate", label: "Backtest", hint: "/backtest", keywords: ["strategy"], run: goto("/backtest") },
      { id: "nav-questions", group: "Navigate", label: "Questions", hint: "/questions", run: goto("/questions") },
      { id: "nav-research", group: "Navigate", label: "Research", hint: "/research", run: goto("/research") },
      { id: "nav-settings", group: "Navigate", label: "Settings", hint: "/settings", keywords: ["account"], run: goto("/settings") },
    ];
    const actions: PaletteItem[] = [
      { id: "act-sync", group: "Actions", label: "Sync now", keywords: ["refresh"], run: () => toast.info("Sync started", { duration: 2000 }) },
      { id: "act-daily", group: "Actions", label: "Open today's note (memory)", keywords: ["today", "note"], run: goto("/memory") },
    ];
    const settings: PaletteItem[] = [
      { id: "set-conn", group: "Settings", label: "Go to Connections", hint: "/settings", keywords: ["alpaca", "broker"], run: goto("/settings") },
      { id: "set-prompts", group: "Settings", label: "Open System Prompts", hint: "/settings", keywords: ["prompts"], run: goto("/settings") },
      { id: "set-refresh", group: "Settings", label: "Force refresh app", keywords: ["cache"], run: applySWUpdate },
    ];
    return [...navs, ...actions, ...settings];
  }, [navigate]);

  // Phase 34: app-wide hotkey layer.
  // ⌘K / Ctrl+K MUST fire even when focus is in an input.
  useGlobalHotkeys([
    {
      combo: "cmd+k",
      allowInInputs: true,
      handler: () => {
        if (isMemoryRoute) return;
        setPaletteOpen((o) => !o);
      },
    },
    {
      combo: "ctrl+k",
      allowInInputs: true,
      handler: () => {
        if (isMemoryRoute) return;
        setPaletteOpen((o) => !o);
      },
    },
    { combo: "g d", handler: () => navigate("/") },
    { combo: "g i", handler: () => navigate("/portfolio") },
    { combo: "g o", handler: () => navigate("/debt") },
    { combo: "g r", handler: () => navigate("/retirement") },
    { combo: "g m", handler: () => navigate("/memory") },
    { combo: "g u", handler: () => navigate("/orchestrate") },
    { combo: "g a", handler: () => navigate("/recommendations") },
    { combo: "g e", handler: () => navigate("/execution") },
    { combo: "g c", handler: () => navigate("/community") },
    { combo: "g b", handler: () => navigate("/backtest") },
    { combo: "g n", handler: () => navigate("/questions") },
    { combo: "g x", handler: () => navigate("/research") },
    { combo: "g s", handler: () => navigate("/settings") },
    { combo: "esc", allowInInputs: true, handler: () => setPaletteOpen(false) },
  ]);

  return (
    <>
      <Sidebar collapsed={!sidebarOpen} />
      <TopBar
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        sidebarOpen={sidebarOpen}
      />
      <OfflineBanner />
      <SyncIndicator />
      <ToastViewport />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={paletteItems}
      />
      <main
        className={`dashboard-main ${sidebarOpen ? 'sidebar-open' : ''}`}
        data-testid="dashboard-main"
      >
        <Breadcrumbs />
        <ErrorBoundary>
          <Routes>
            <Route path="/offline" element={<OfflinePage />} />
            <Route path="/setup" element={<SetupWizard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/debt" element={<DebtDashboard />} />
            <Route path="/retirement" element={<RetirementPage />} />
            <Route path="/memory" element={<MemoryExplorer />} />
            <Route path="/orchestrate" element={<MultiAgent />} />
            <Route path="/recommendations" element={<RecommendationsDashboard />} />
            <Route path="/execution" element={<ExecutionDashboard />} />
            <Route path="/community" element={<CommunityDashboard />} />
            <Route path="/backtest" element={<BacktestDashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <NetworkTransition>
        <AppBody />
      </NetworkTransition>
    </BrowserRouter>
  );
}

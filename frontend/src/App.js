import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import AgentBuilder from "./pages/AgentBuilder";
import AgentSettings from "./pages/AgentSettings";
import AgentTest from "./pages/AgentTest";
import Flows from "./pages/Flows";
import FlowBuilder from "./pages/FlowBuilder";
import Tools from "./pages/Tools";
import Knowledge from "./pages/Knowledge";
import Integrations from "./pages/Integrations";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import "./App.css";

function App() {
  return (
    <div className="App min-h-screen bg-slate-50">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="agents" element={<Agents />} />
            <Route path="agents/:agentId/builder" element={<AgentBuilder />} />
            <Route path="agents/:agentId/settings" element={<AgentSettings />} />
            <Route path="agents/:agentId/test" element={<AgentTest />} />
            <Route path="flows" element={<Flows />} />
            <Route path="tools" element={<Tools />} />
            <Route path="knowledge" element={<Knowledge />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          {/* Flow Builder - Full screen without sidebar */}
          <Route path="flows/:flowId/builder" element={<FlowBuilder />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;

import { Route, Routes, Navigate, useNavigate } from "react-router-dom";

import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import CareerPilotLanding from "./pages/CareerPilotLanding";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ConnectGithub from "./pages/ConnectGithub";

import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Repositories from "./pages/Repositories";
import SkillAnalysis from "./pages/SkillAnalysis";
import SkillGaps from "./pages/SkillGaps";
import CareerCoach from "./pages/CareerCoach";
import Timeline from "./pages/Timeline";
import Demo from "./pages/Demo";
import Settings from "./pages/Settings";

// Connect landing-page buttons to authentication pages.
function LandingRoute() {
  const navigate = useNavigate();

  return (
    <CareerPilotLanding
      onSignIn={() => navigate("/login")}
      onGetStarted={() => navigate("/signup")}
      onRoadmap={() => navigate("/login")}
    />
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public landing and authentication pages */}
      <Route path="/" element={<LandingRoute />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/connect-github" element={<ProtectedRoute><ConnectGithub /></ProtectedRoute>} />

      {/* Existing application pages and dashboard layout */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/repositories" element={<Repositories />} />
        <Route path="/skills" element={<SkillAnalysis />} />
        <Route path="/gaps" element={<SkillGaps />} />
        <Route path="/coach" element={<CareerCoach />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Unknown paths return to the landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
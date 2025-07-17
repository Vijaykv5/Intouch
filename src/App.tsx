import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { CivicAuthProvider, useUser } from "@civic/auth-web3/react";
import LandingPage from "./components/Landing";
// import FindCreator from "./components/dashboard/creator/creator-page/FindCreator";
// import CreatorProfile from "./components/customprofile/creator/CreatorProfile";
// import PreviewPage from "./components/customprofile/PreviewPage";
// import NotFound from "./components/NotFound";
import { Toaster } from "react-hot-toast";
import FindCreator from "./components/creator/FindCreator"
import { useCivicUser } from "./hooks/useCivicUser";
import DashBoardUser from "./components/user/DashBoard";
import CreatorDashboard from "./components/creator/CreatorDashboard";
import CreatorSignup from "./components/creator/CreatorSignup";

// import CreatorDashboard from "./components/dashboard/creator/CreatorDashboard";

function App() {
  useUser(); // Ensures user context fetch starts immediately
  // Remove useCurrentUser, all auth is now via Civic
  // const creatorProfile = localStorage.getItem("creator_profile");
  const { isAuthenticated } = useCivicUser();

  return (
    <div className="App">
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/creators"
          element={
            isAuthenticated ? <FindCreator /> : <Navigate to="/" replace />
          }
        />
        <Route path="/dashboard" element={<DashBoardUser />} />
        <Route path="/creator-dashboard" element={<CreatorDashboard />} />
        <Route path="/creator/signup" element={<CreatorSignup />} />
      </Routes>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <CivicAuthProvider clientId="8f0cd45d-3ee2-4b74-bd7d-cd5d564d787e">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </CivicAuthProvider>
  );
}

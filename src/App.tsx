import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { CivicAuthProvider } from "@civic/auth/react";
// import DashBoardUser from "./components/dashboard/user/DashBoard";
import LandingPage from "./components/Landing";
// import FindCreator from "./components/dashboard/creator/creator-page/FindCreator";
// import CreatorProfile from "./components/customprofile/creator/CreatorProfile";
// import PreviewPage from "./components/customprofile/PreviewPage";
// import NotFound from "./components/NotFound";
import { Toaster } from "react-hot-toast";
import FindCreator from "./components/creator/FindCreator"
import { useCivicUser } from "./hooks/useCivicUser";
// import CreatorDashboard from "./components/dashboard/creator/CreatorDashboard";

function App() {
  // Remove useCurrentUser, all auth is now via Civic
  const creatorProfile = localStorage.getItem("creator_profile");
  const hasCreatorProfile = !!creatorProfile;
  const { isAuthenticated } = useCivicUser();

  return (
    <div className="App">
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/creators" element={isAuthenticated ? <FindCreator /> : <Navigate to="/" replace />} />
        {/* <Route path="/form" element={<DashBoardUser />} />
        <Route path="/dashboard" element={<DashBoardUser />} />
        <Route
          path="/creator-dashboard"
          element={
            hasCreatorProfile ? (
              <CreatorDashboard />
            ) : (
              <Navigate to="/creator/signup" replace />
            )
          }
        />
        <Route path="/creator/signup" element={<CreatorProfile />} />
        <Route path="/creator/:username" element={<PreviewPage />} />
        <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <CivicAuthProvider clientId="31686871-8773-496f-b065-22a6885df4b1">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </CivicAuthProvider>
  );
}

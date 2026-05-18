import { Navigate, Route, Routes } from "react-router-dom";
import RequireSignIn from "./components/RequireSignIn";
import Dashboard from "./pages/Dashboard";
import KanbanTracker from "./pages/KanbanTracker";
import Profile from "./pages/Profile";
import SignIn from "./pages/SignIn";

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route element={<RequireSignIn />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tracker" element={<KanbanTracker />} />
      </Route>
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
}

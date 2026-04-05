import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import KanbanTracker from "./pages/KanbanTracker";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/tracker" element={<KanbanTracker />} />
    </Routes>
  );
}

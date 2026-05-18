import { Navigate, Outlet } from "react-router-dom";
import { isSignedIn } from "../lib/authGate";

export default function RequireSignIn() {
  if (!isSignedIn()) {
    return <Navigate to="/signin" replace />;
  }
  return <Outlet />;
}

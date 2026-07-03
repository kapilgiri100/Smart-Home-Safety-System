import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Activity from "../pages/Activity.jsx";
import About from "../pages/About.jsx";
import NotFound from "../pages/NotFound.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";

function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/about" element={<About />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

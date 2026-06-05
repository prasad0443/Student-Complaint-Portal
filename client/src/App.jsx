import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Spinner from './components/Spinner.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import NewComplaint from './pages/NewComplaint.jsx';
import ComplaintDetail from './pages/ComplaintDetail.jsx';
import AdminComplaints from './pages/AdminComplaints.jsx';
import Analytics from './pages/Analytics.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminRegister from './pages/admin/AdminRegister.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

function PrivateRoute({ children }) {
  const { token, loading } = useAuth();
  const location = useLocation();
  const loginPath = location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner />
      </div>
    );
  }
  if (!token) return <Navigate to={loginPath} replace />;
  return children;
}

function HomeGate() {
  const { isAdmin } = useAuth();
  if (isAdmin) return <Navigate to="/admin" replace />;
  return <StudentDashboard />;
}

function StudentOnly({ children }) {
  const { isStudent } = useAuth();
  if (!isStudent) return <Navigate to="/admin" replace />;
  return children;
}

function AdminOnly({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function SuperAdminOnly({ children }) {
  const { isSuperAdmin } = useAuth();
  if (!isSuperAdmin) return <Navigate to="/admin" replace />;
  return children;
}

function AdminLoginGate() {
  const { token, user, loading, isAdmin, isStudent } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Spinner />
      </div>
    );
  }
  if (token && isAdmin) return <Navigate to="/admin" replace />;
  if (token && isStudent) return <Navigate to="/" replace />;
  return <AdminLogin />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin/login" element={<AdminLoginGate />} />
      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<HomeGate />} />
        <Route
          path="/complaints/new"
          element={
            <StudentOnly>
              <NewComplaint />
            </StudentOnly>
          }
        />
        <Route path="/complaints/:id" element={<ComplaintDetail />} />
        <Route
          path="/admin"
          element={
            <AdminOnly>
              <AdminComplaints />
            </AdminOnly>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminOnly>
              <Analytics />
            </AdminOnly>
          }
        />
        <Route
          path="/admin/register"
          element={
            <AdminOnly>
              <SuperAdminOnly>
                <AdminRegister />
              </SuperAdminOnly>
            </AdminOnly>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

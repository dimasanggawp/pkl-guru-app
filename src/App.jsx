import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import Login from './pages/Login';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationCenter from './components/NotificationCenter';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Monitoring = lazy(() => import('./pages/Monitoring'));
const StudentList = lazy(() => import('./pages/StudentList'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Alerts = lazy(() => import('./pages/Alerts'));
const MonitoringVisits = lazy(() => import('./pages/MonitoringVisits'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center p-12 text-muted text-sm">
      Memuat halaman...
    </div>
  );
}

function LoginRoute() {
  const token = localStorage.getItem('guru_token');

  if (token) {
    return <Navigate to="/" replace />;
  }

  return <Login />;
}

function Layout({ children }) {
  const token = localStorage.getItem('guru_token');

  return (
    <NotificationProvider token={token}>
      <div className="min-h-screen flex flex-col bg-bg text-ink">
        <NotificationCenter />
        <Header />
        <div className="flex flex-1 flex-col sm:flex-row">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6">
            <Suspense fallback={<PageLoader />}>{children}</Suspense>
          </main>
        </div>
        <Footer />
      </div>
    </NotificationProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Toast />
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route
            path="/unauthorized"
            element={
              <Suspense fallback={<PageLoader />}>
                <Unauthorized />
              </Suspense>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute role="guru">
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/monitoring"
            element={
              <ProtectedRoute role="guru">
                <Layout>
                  <Monitoring />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute role="guru">
                <Layout>
                  <StudentList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews"
            element={
              <ProtectedRoute role="guru">
                <Layout>
                  <Reviews />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute role="guru">
                <Layout>
                  <Alerts />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/visits"
            element={
              <ProtectedRoute role="guru">
                <Layout>
                  <MonitoringVisits />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

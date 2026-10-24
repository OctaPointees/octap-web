import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import TransitionProvider from './components/TransitionProvider';
import { getSession } from './auth';
import Login from './pages/login/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Admin from './pages/Admin';
import DevLayout from './pages/developers/DevLayout';
import Overview from './pages/developers/Overview';
import ApiKeys from './pages/developers/ApiKeys';
import Sandbox from './pages/developers/Sandbox';
import MockPage from './pages/developers/MockPage';
import Logs from './pages/developers/Logs';
import Webhooks from './pages/developers/Webhooks';
import Mcp from './pages/developers/Mcp';

function RequireAuth() {
  return getSession() ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <TransitionProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/developers" element={<DevLayout />}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<Overview />} />
              <Route path="keys" element={<ApiKeys />} />
              <Route path="sandbox" element={<Sandbox />} />
              <Route path="mock" element={<MockPage />} />
              <Route path="logs" element={<Logs />} />
              <Route path="webhooks" element={<Webhooks />} />
              <Route path="mcp" element={<Mcp />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </TransitionProvider>
    </BrowserRouter>
  );
}

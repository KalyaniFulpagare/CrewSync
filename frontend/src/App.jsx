import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EventDetail from './pages/EventDetail';
import MyTasks from './pages/MyTasks';
import ClubList from './pages/ClubList';
import ClubHub from './pages/ClubHub';
import MyLoad from './pages/MyLoad';
import Invites from './pages/Invites';
import Recruitment from './pages/Recruitment';
import DriveDetail from './pages/DriveDetail';
import DriveApplications from './pages/DriveApplications';

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-text-muted text-sm">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/events/:id" element={<ProtectedLayout><EventDetail /></ProtectedLayout>} />
      <Route path="/my-tasks" element={<ProtectedLayout><MyTasks /></ProtectedLayout>} />
      <Route path="/clubs" element={<ProtectedLayout><ClubList /></ProtectedLayout>} />
      <Route path="/clubs/:clubId" element={<ProtectedLayout><ClubHub /></ProtectedLayout>} />
      <Route path="/my-load" element={<ProtectedLayout><MyLoad /></ProtectedLayout>} />
      <Route path="/invites" element={<ProtectedLayout><Invites /></ProtectedLayout>} />
      <Route path="/recruitment" element={<ProtectedLayout><Recruitment /></ProtectedLayout>} />
      <Route path="/recruitment/:driveId" element={<ProtectedLayout><DriveDetail /></ProtectedLayout>} />
      <Route path="/clubs/:clubId/drives/:driveId" element={<ProtectedLayout><DriveApplications /></ProtectedLayout>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </AuthProvider>
  );
}

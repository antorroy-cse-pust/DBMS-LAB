import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import FloatingBanner from './components/FloatingBanner';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import DoctorPanel from './pages/DoctorPanel';
import Appointments from './pages/Appointments';
import BookAppointment from './pages/BookAppointment';
import Pharmacy from './pages/Pharmacy';
import Emergency from './pages/Emergency';
import Doctors from './pages/Doctors';
import Profile from './pages/Profile';
import Campaigns from './pages/Campaigns';
import Complaints from './pages/Complaints';
import './App.css';

// Wrapper that renders Layout + FloatingBanner for all protected routes
const AppLayout = () => (
  <PrivateRoute>
    <>
      <Layout />
      <FloatingBanner />
    </>
  </PrivateRoute>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '13.5px' },
          }}
        />
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<Landing />} />

          {/* Auth Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected App — all under /app/* */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="doctor" element={<DoctorPanel />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="book-appointment" element={<BookAppointment />} />
            <Route path="pharmacy" element={<Pharmacy />} />
            <Route path="emergency" element={<Emergency />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="profile" element={<Profile />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="complaints" element={<Complaints />} />
          </Route>

          {/* Catch all — go to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
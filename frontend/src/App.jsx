import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import AuthPage from './pages/AuthPage';
import Profile from './pages/Profile';
import AdminLayout from './components/Admin/AdminLayout';
import AdminDashboard from './components/Admin/Dashboard';
import AdminBillboards from './components/Admin/Billboards';
import AdminUsers from './components/Admin/Users';
import AdminBookings from './components/Admin/Bookings';
import ProtectedRoute from './components/ProtectedRoute';
import BillboardDetails from './pages/BillboardDetails';
import BillboardManage from './pages/BillboardManage';
import DashboardWrapper from './pages/DashboardWrapper';
import BillboardPlayer from './pages/BillboardPlayer';
import BillboardBooking from './pages/BillboardBooking';
import LandingPage from './pages/LandingPage';
import Billing from './pages/Billing';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:id/:token" element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/profile" element={<Profile />} />

        {/* Owner Portal */}
        <Route path="/owner" element={<DashboardWrapper />} />
        <Route path="/owner/analytics" element={<DashboardWrapper />} />
        <Route path="/owner/requests" element={<DashboardWrapper />} />
        <Route path="/owner/billboards" element={<DashboardWrapper />} />
        <Route path="/owner/billing" element={<DashboardWrapper />} />
        <Route path="/owner/profile" element={<DashboardWrapper />} />

        {/* Advertiser Portal */}
        <Route path="/advertiser" element={<DashboardWrapper />} />
        <Route path="/advertiser/explore" element={<DashboardWrapper />} />
        <Route path="/advertiser/my-bookings" element={<DashboardWrapper />} />
        <Route path="/advertiser/billing" element={<DashboardWrapper />} />
        <Route path="/advertiser/profile" element={<DashboardWrapper />} />

        {/* Legacy redirect */}
        <Route path="/dashboard" element={<DashboardWrapper />} />

        <Route path="/billboard/:id" element={<BillboardDetails />} />
        <Route path="/billboard-manage/:id" element={<BillboardManage />} />
        <Route path="/billboard/:id/player" element={<BillboardPlayer />} />
        <Route path="/billboard/:id/book" element={<BillboardBooking />} />

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="billboards" element={<AdminBillboards />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="billing" element={<Billing />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

import { Routes, Route } from "react-router-dom";

import { PublicLayout } from "@/components/layout/PublicLayout";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AdminRoute } from "@/routes/AdminRoute";

import Home from "@/pages/Home";
import About from "@/pages/About";
import Rooms from "@/pages/Rooms";
import RoomDetails from "@/pages/RoomDetails";
import Gallery from "@/pages/Gallery";
import Reviews from "@/pages/Reviews";
import NearbyAttractions from "@/pages/NearbyAttractions";
import FAQ from "@/pages/FAQ";
import Contact from "@/pages/Contact";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsConditions from "@/pages/TermsConditions";
import CancellationPolicy from "@/pages/CancellationPolicy";
import Booking from "@/pages/Booking";
import Payment from "@/pages/Payment";
import BookingConfirmation from "@/pages/BookingConfirmation";
import NotFound from "@/pages/NotFound";

import PhoneVerify from "@/pages/auth/PhoneVerify";

import DashboardLayout from "@/pages/dashboard/DashboardLayout";
import DashboardOverview from "@/pages/dashboard/DashboardOverview";
import MyBookings from "@/pages/dashboard/MyBookings";
import Profile from "@/pages/dashboard/Profile";

import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminOverview from "@/pages/admin/AdminOverview";
import AdminHomestay from "@/pages/admin/AdminHomestay";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import AdminBookings from "@/pages/admin/AdminBookings";
import AdminPayments from "@/pages/admin/AdminPayments";
import AdminAvailability from "@/pages/admin/AdminAvailability";
import AdminAttractions from "@/pages/admin/AdminAttractions";
import AdminGallery from "@/pages/admin/AdminGallery";
import AdminReviews from "@/pages/admin/AdminReviews";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminBookingsAnalytics from "@/pages/admin/AdminBookingsAnalytics";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminLogs from "@/pages/admin/AdminLogs";

export default function App() {
  return (
    <Routes>
      {/* Public marketing + booking-adjacent pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/homestay" element={<RoomDetails />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/rooms/:slug" element={<Rooms />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/attractions" element={<NearbyAttractions />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        <Route path="/cancellation-policy" element={<CancellationPolicy />} />

        {/* Booking flow requires a signed-in guest */}
        <Route element={<ProtectedRoute />}>
          <Route path="/booking" element={<Booking />} />
          <Route path="/payment/:bookingId" element={<Payment />} />
          <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmation />} />
        </Route>
      </Route>

      {/* Phone OTP verification — no email/password login for guests */}
      <Route path="/verify-phone" element={<PhoneVerify />} />

      {/* Customer dashboard */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="rooms" element={<AdminHomestay />} />
          <Route path="homestay" element={<AdminHomestay />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="availability" element={<AdminAvailability />} />
          <Route path="attractions" element={<AdminAttractions />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="bookings-analytics" element={<AdminBookingsAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="logs" element={<AdminLogs />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

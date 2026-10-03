import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { ToastProvider } from "./components/Toast.jsx";
import HomePage from "./pages/HomePage.jsx";
import PublicLayout from "./components/PublicLayout.jsx";

const EventPage = lazy(() => import("./pages/EventPage.jsx"));
const PaymentPage = lazy(() => import("./pages/PaymentPage.jsx"));
const UnsubscribePage = lazy(() => import("./pages/UnsubscribePage.jsx"));
const CancelConfirmPage = lazy(() => import("./pages/CancelConfirmPage.jsx"));
const ImpressumPage = lazy(() => import("./pages/ImpressumPage.jsx"));
const DatenschutzPage = lazy(() => import("./pages/DatenschutzPage.jsx"));
const AdminLayout = lazy(() => import("./components/AdminLayout.jsx"));
const LoginPage = lazy(() => import("./pages/admin/LoginPage.jsx"));
const DashboardPage = lazy(() => import("./pages/admin/DashboardPage.jsx"));
const StatsPage = lazy(() => import("./pages/admin/StatsPage.jsx"));
const EventFormPage = lazy(() => import("./pages/admin/EventFormPage.jsx"));
const RegistrationsPage = lazy(() => import("./pages/admin/RegistrationsPage.jsx"));
const NewsletterPage = lazy(() => import("./pages/admin/NewsletterPage.jsx"));

export default function App() {
  return (
    <ToastProvider>
      <Suspense fallback={<div className="min-h-screen" />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/veranstaltung/:slug" element={<EventPage />} />
            <Route path="/anmeldung/:id/zahlung" element={<PaymentPage />} />
            <Route path="/newsletter/abmelden" element={<UnsubscribePage />} />
            <Route path="/anmeldung/stornieren" element={<CancelConfirmPage />} />
            <Route path="/impressum" element={<ImpressumPage />} />
            <Route path="/datenschutz" element={<DatenschutzPage />} />
          </Route>

          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="statistik" element={<StatsPage />} />
            <Route path="veranstaltungen/neu" element={<EventFormPage />} />
            <Route path="veranstaltungen/:id" element={<EventFormPage />} />
            <Route path="veranstaltungen/:id/anmeldungen" element={<RegistrationsPage />} />
            <Route path="newsletter" element={<NewsletterPage />} />
          </Route>
        </Routes>
      </Suspense>
      <Analytics />
    </ToastProvider>
  );
}

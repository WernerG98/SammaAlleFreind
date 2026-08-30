import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import EventPage from "./pages/EventPage.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import UnsubscribePage from "./pages/UnsubscribePage.jsx";
import CancelConfirmPage from "./pages/CancelConfirmPage.jsx";
import ImpressumPage from "./pages/ImpressumPage.jsx";
import DatenschutzPage from "./pages/DatenschutzPage.jsx";
import PublicLayout from "./components/PublicLayout.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import LoginPage from "./pages/admin/LoginPage.jsx";
import DashboardPage from "./pages/admin/DashboardPage.jsx";
import EventFormPage from "./pages/admin/EventFormPage.jsx";
import RegistrationsPage from "./pages/admin/RegistrationsPage.jsx";
import NewsletterPage from "./pages/admin/NewsletterPage.jsx";
import NewsletterSubscribersPage from "./pages/admin/NewsletterSubscribersPage.jsx";
import BannerPage from "./pages/admin/BannerPage.jsx";

export default function App() {
  return (
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
        <Route path="veranstaltungen/neu" element={<EventFormPage />} />
        <Route path="veranstaltungen/:id" element={<EventFormPage />} />
        <Route path="veranstaltungen/:id/anmeldungen" element={<RegistrationsPage />} />
        <Route path="newsletter" element={<NewsletterPage />} />
        <Route path="newsletter/abonnenten" element={<NewsletterSubscribersPage />} />
        <Route path="banner" element={<BannerPage />} />
      </Route>
    </Routes>
  );
}

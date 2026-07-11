import React, { Suspense, lazy, useEffect } from "react";
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Layout from "./components/Layout";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import HomePage from "./pages/HomePage";
import Analytics from "./components/Analytics";
import ErrorBoundary from "./components/ErrorBoundary";
import {
  NotFoundPage,
  ForbiddenPage,
  ServerErrorPage,
  MaintenancePage,
} from "./pages/ErrorPages";

const FeaturesPage = lazy(() => import("./pages/FeaturesPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const TemplatesPage = lazy(() => import("./pages/TemplatesPage"));
const FaqPage = lazy(() => import("./pages/FaqPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const BuilderPage = lazy(() => import("./pages/BuilderPage"));
const LoginPage = lazy(() => import("./pages/AuthPages").then((m) => ({ default: m.LoginPage })));
const GetStartedPage = lazy(() => import("./pages/AuthPages").then((m) => ({ default: m.GetStartedPage })));
const ForgotPasswordPage = lazy(() => import("./pages/AuthPages").then((m) => ({ default: m.ForgotPasswordPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPages").then((m) => ({ default: m.DashboardPage })));
const AdminPage = lazy(() => import("./pages/AdminDashboard"));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentPages").then((m) => ({ default: m.PaymentSuccessPage })));
const PaymentCancelPage = lazy(() => import("./pages/PaymentPages").then((m) => ({ default: m.PaymentCancelPage })));

function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

function Lazy({ render }) {
  return <Suspense fallback={<Loader />}>{render()}</Suspense>;
}

function ReferralCapture() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      try { localStorage.setItem("cvpilot-ref", ref); } catch { /* noop */ }
    }
  }, []);
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <Analytics />
            <ReferralCapture />
            <ScrollToTop />
            <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route element={<Layout />}>
                <Route path="/features" element={<Lazy render={() => <FeaturesPage />} />} />
                <Route path="/pricing" element={<Lazy render={() => <PricingPage />} />} />
                <Route path="/templates" element={<Lazy render={() => <TemplatesPage />} />} />
                <Route path="/faq" element={<Lazy render={() => <FaqPage />} />} />
                <Route path="/about" element={<Lazy render={() => <AboutPage />} />} />
                <Route path="/contact" element={<Lazy render={() => <ContactPage />} />} />
                <Route path="/blog" element={<Lazy render={() => <BlogPage />} />} />
                <Route path="/privacy" element={<Lazy render={() => <LegalPage type="privacy" />} />} />
                <Route path="/terms" element={<Lazy render={() => <LegalPage type="terms" />} />} />
                <Route path="/refund" element={<Lazy render={() => <LegalPage type="refund" />} />} />
              </Route>
              <Route path="/login" element={<Lazy render={() => <LoginPage />} />} />
              <Route path="/chat" element={<Lazy render={() => <ChatPage />} />} />
              <Route path="/get-started" element={<Lazy render={() => <ChatPage />} />} />
              <Route path="/builder" element={<Lazy render={() => <BuilderPage />} />} />
              <Route path="/signup" element={<Lazy render={() => <GetStartedPage />} />} />
              <Route path="/forgot-password" element={<Lazy render={() => <ForgotPasswordPage />} />} />
              <Route path="/dashboard" element={<Lazy render={() => <DashboardPage />} />} />
              <Route path="/admin" element={<Lazy render={() => <AdminPage />} />} />
              <Route path="/payment-success" element={<Lazy render={() => <PaymentSuccessPage />} />} />
              <Route path="/payment-cancel" element={<Lazy render={() => <PaymentCancelPage />} />} />
              <Route path="/403" element={<ForbiddenPage />} />
              <Route path="/500" element={<ServerErrorPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            </ErrorBoundary>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;

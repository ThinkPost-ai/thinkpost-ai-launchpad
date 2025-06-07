import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import UserDashboard from "./pages/UserDashboard";
import RestaurantSetup from "./pages/RestaurantSetup";
import ProfileSettings from "./pages/ProfileSettings";
import AccountSettings from "./pages/AccountSettings";
import ImageUpload from "./pages/ImageUpload";
import ProductCreation from "./pages/ProductCreation";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import TikTokCallback from "./pages/TikTokCallback";
import TikTokLoginCallback from "./pages/TikTokLoginCallback";
import EmailConfirmation from "./pages/EmailConfirmation";

const queryClient = new QueryClient();

const App = () => {
  console.log('App component rendering - preview should be working');
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="thinkpost-theme">
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Navigate to="/home" replace />} />
                  <Route path="/home" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/user-dashboard" element={<UserDashboard />} />
                  <Route path="/restaurant-setup" element={<RestaurantSetup />} />
                  <Route path="/profile-settings" element={<ProfileSettings />} />
                  <Route path="/account-settings" element={<AccountSettings />} />
                  <Route path="/upload" element={<ProductCreation />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/tiktok-callback" element={<TikTokCallback />} />
                  <Route path="/tiktok-login-callback" element={<TikTokLoginCallback />} />
                  <Route path="/email-confirmation" element={<EmailConfirmation />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

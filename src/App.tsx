import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import LoadingScreen from "./components/LoadingScreen";
import Navigation from "./components/Navigation";
import Index from "./pages/Index";
import JoinNow from "./pages/JoinNow";
import HowTo from "./pages/HowTo";
import SignIn from "./pages/SignIn";
import ApprovedVenues from "./pages/ApprovedVenues";
import AddVenueForm from "./pages/AddVenueForm";
import EnhancedVenueForm from "./components/EnhancedVenueForm";
import EventCreationForm from "./components/EventCreationForm";
import EditVenue from "./pages/EditVenue";
import SimpleMemberSignIn from "./pages/SimpleMemberSignIn";
import CoffeeShops from "./pages/CoffeeShops";
import RestaurantCuisine from "./pages/RestaurantCuisine";

import ScheduleEvent from "./pages/ScheduleEvent";
import MessageBoard from "./pages/MessageBoard";
import EventRSVP from "./pages/EventRSVP";
import Admin from "./pages/Admin";
import AdminSignIn from "./pages/AdminSignIn";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import TipsAndTricks from "./pages/TipsAndTricks";
import DynamicPage from "./pages/DynamicPage";

const queryClient = new QueryClient();

const App = () => {
  const [showLoading, setShowLoading] = useState(true);

  const handleLoadingComplete = () => {
    setShowLoading(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-blue-500/20">
          <Toaster />
          <Sonner />
          <HashRouter>
            {showLoading && <LoadingScreen onLoadingComplete={handleLoadingComplete} />}
            <Navigation />
          <Routes>
            <Route path="/" element={<DynamicPage />} />
            <Route path="/join-now" element={<JoinNow />} />
            <Route path="/how-to" element={<DynamicPage />} />
            <Route path="/tips-and-tricks" element={<DynamicPage />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/member-sign-in" element={<SimpleMemberSignIn />} />
            <Route path="/approved-venues" element={<ApprovedVenues />} />
            <Route path="/venues" element={<ApprovedVenues />} />
            <Route path="/add-venue" element={<EnhancedVenueForm />} />
            <Route path="/add-event" element={<EventCreationForm />} />
            <Route path="/schedule-event" element={<ScheduleEvent />} />
            <Route path="/message-board" element={<MessageBoard />} />
            
            {/* Venue Directory Routes */}
            <Route path="/venues/coffee-shops" element={<CoffeeShops />} />
            <Route path="/venues/restaurants/:cuisineType" element={<RestaurantCuisine />} />
            
            <Route path="/event-rsvp" element={<EventRSVP />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin-sign-in" element={<AdminSignIn />} />
            <Route path="/edit-venue/:id" element={<EditVenue />} />
            <Route path="/auth-callback" element={<AuthCallback />} />
            <Route path="/join" element={<Navigate to="/join-now" replace />} />
            <Route path="/page/:slug" element={<DynamicPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
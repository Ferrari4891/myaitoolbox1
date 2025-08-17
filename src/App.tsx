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
import AddVenue from "./pages/AddVenue";
import EditVenue from "./pages/EditVenue";

import ScheduleEvent from "./pages/ScheduleEvent";
import EventRSVP from "./pages/EventRSVP";
import Admin from "./pages/Admin";
import AdminSignIn from "./pages/AdminSignIn";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showLoading, setShowLoading] = useState(true);

  const handleLoadingComplete = () => {
    setShowLoading(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          {showLoading && <LoadingScreen onLoadingComplete={handleLoadingComplete} />}
          <Navigation />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/join-now" element={<JoinNow />} />
            <Route path="/how-to" element={<HowTo />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/approved-venues" element={<ApprovedVenues />} />
            <Route path="/add-venue" element={<AddVenue />} />
            <Route path="/schedule-event" element={<ScheduleEvent />} />
            
            <Route path="/event-rsvp" element={<EventRSVP />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin-sign-in" element={<AdminSignIn />} />
            <Route path="/edit-venue/:id" element={<EditVenue />} />
            <Route path="/join" element={<Navigate to="/join-now" replace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoadingScreen from "@/components/LoadingScreen";
import Index from "./pages/Index";
import JoinNow from "./pages/JoinNow";
import SignIn from "./pages/SignIn";
import HowTo from "./pages/HowTo";
import ApprovedVenues from "./pages/ApprovedVenues";
import AddVenue from "./pages/AddVenue";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showLoading, setShowLoading] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showLoading && <LoadingScreen onLoadingComplete={() => setShowLoading(false)} />}
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/join" element={<JoinNow />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/how-to" element={<HowTo />} />
            <Route path="/approved-venues" element={<ApprovedVenues />} />
            <Route path="/add-venue" element={<AddVenue />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const GRAB_GREEN = "#00B14F";

function isMobile(): boolean {
  return typeof window !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function isIOS(): boolean {
  return typeof window !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isAndroid(): boolean {
  return typeof window !== "undefined" && /Android/i.test(navigator.userAgent);
}

export function GrabLink() {
  const [showOnMobile, setShowOnMobile] = useState(false);

  useEffect(() => {
    setShowOnMobile(isMobile());
  }, []);

  // Don't show on desktop
  if (!showOnMobile) return null;

  function openGrabApp(e: React.MouseEvent) {
    e.preventDefault();

    if (isAndroid()) {
      // Use Android intent URL for better compatibility
      const intentUrl = "intent://open#Intent;scheme=grab;package=com.grabtaxi.passenger;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.grabtaxi.passenger;end";
      window.location.href = intentUrl;
      return;
    }

    if (isIOS()) {
      // Use a more reliable method for iOS
      const grabUrl = "grab://";
      const appStoreUrl = "https://apps.apple.com/app/id647268330";
      
      // Try to open the app
      window.location.href = grabUrl;
      
      // If the app doesn't open, the user will see a "Cannot Open Page" error
      // They can then manually go to the App Store
      // This is actually the most reliable approach on modern iOS
      return;
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 flex-shrink-0" style={{ backgroundColor: GRAB_GREEN }}>
        <svg viewBox="0 0 24 24" fill="white" className="w-full h-full p-0.5">
          <path d="M12 2L2 7v10c0 5.55 3.84 7.74 9 9 5.16-1.26 9-3.45 9-9V7l-10-5z"/>
        </svg>
      </div>
      <Button
        variant="link"
        size="sm"
        className="h-auto p-0"
        style={{ color: GRAB_GREEN }}
        onClick={openGrabApp}
      >
        <ExternalLink className="h-3 w-3 mr-1" />
        Grab a Grab
      </Button>
    </div>
  );
}
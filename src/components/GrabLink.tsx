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
      // Try to open Grab app, fallback to Play Store
      window.location.href = "grab://open";
      setTimeout(() => {
        window.location.href = "https://play.google.com/store/apps/details?id=com.grabtaxi.passenger";
      }, 1000);
      return;
    }

    if (isIOS()) {
      // Try to open Grab app, fallback to App Store
      window.location.href = "grab://open";
      setTimeout(() => {
        window.location.href = "https://apps.apple.com/app/id647268330";
      }, 1000);
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
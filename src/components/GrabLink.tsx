import { useState, useEffect } from "react";

interface Venue {
  id: string;
  business_name: string;
  address: string;
  google_maps_link?: string;
  latitude?: number;
  longitude?: number;
}

const GRAB_GREEN = "#00B14F";
const GRAB_SVG_SRC = "https://upload.wikimedia.org/wikipedia/commons/4/45/Grab_Logo.svg";

function extractLatLngFromGoogleMapsUrl(url?: string): { lat?: number; lng?: number } {
  if (!url) return {};
  try {
    // Try to match @lat,lng pattern
    const atMatch = url.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }
    
    // Try to parse from query parameter
    const urlObj = new URL(url);
    const query = urlObj.searchParams.get("query");
    if (query) {
      const decodedQuery = decodeURIComponent(query);
      const parts = decodedQuery.split(",");
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          return { lat, lng };
        }
      }
    }
  } catch (error) {
    console.warn("Failed to parse Google Maps URL:", error);
  }
  return {};
}

function isMobile(): boolean {
  return typeof window !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function isIOS(): boolean {
  return typeof window !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isAndroid(): boolean {
  return typeof window !== "undefined" && /Android/i.test(navigator.userAgent);
}

interface GrabLinkProps {
  venue: Venue;
}

export function GrabLink({ venue }: GrabLinkProps) {
  const [showOnMobile, setShowOnMobile] = useState(false);

  useEffect(() => {
    setShowOnMobile(isMobile());
  }, []);

  // Don't show on desktop
  if (!showOnMobile) return null;

  // Get coordinates from venue or try to extract from Google Maps URL
  const coords = (venue.latitude && venue.longitude)
    ? { lat: venue.latitude, lng: venue.longitude }
    : extractLatLngFromGoogleMapsUrl(venue.google_maps_link);

  const address = venue.address?.trim();
  const hasDestination = (coords.lat && coords.lng) || !!address;

  // Don't show if no destination data
  if (!hasDestination) return null;

  const destination = coords.lat && coords.lng
    ? `${coords.lat},${coords.lng}`
    : encodeURIComponent(address!);

  function openInGrab(e: React.MouseEvent) {
    e.preventDefault();

    if (isAndroid()) {
      const intent = `intent://open#Intent;scheme=grab;package=com.grabtaxi.passenger;S.destination=${destination};end`;
      const playStore = "https://play.google.com/store/apps/details?id=com.grabtaxi.passenger";
      
      window.location.href = intent;
      
      // Fallback to Play Store if app not installed
      setTimeout(() => {
        if (document.visibilityState === "visible") {
          window.location.href = playStore;
        }
      }, 1200);
      return;
    }

    if (isIOS()) {
      const scheme = `grab://open?destination=${destination}`;
      const appStore = "https://apps.apple.com/app/id647268330";
      const startTime = Date.now();
      
      window.location.href = scheme;
      
      // Fallback to App Store if app not installed
      setTimeout(() => {
        if (Date.now() - startTime < 2000 && document.visibilityState === "visible") {
          window.location.href = appStore;
        }
      }, 1200);
      return;
    }

    // Desktop fallback (shouldn't reach here due to mobile check above)
    if (venue.google_maps_link) {
      window.open(venue.google_maps_link, "_blank");
    }
  }

  return (
    <a
      href="#grab"
      onClick={openInGrab}
      aria-label="Open destination in Grab app"
      title="Open destination in Grab"
      className="inline-flex items-center gap-2 min-h-[44px] min-w-[44px] justify-center sm:justify-start text-sm font-medium hover:opacity-80 transition-opacity"
      style={{ color: GRAB_GREEN }}
    >
      <img
        src={GRAB_SVG_SRC}
        alt="Grab"
        width={18}
        height={18}
        className="flex-shrink-0"
        loading="lazy"
      />
      <span className="hidden sm:inline">Grab</span>
    </a>
  );
}
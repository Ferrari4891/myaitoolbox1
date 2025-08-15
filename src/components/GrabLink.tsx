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
// Using a data URI for the Grab logo as fallback for better mobile compatibility
const GRAB_LOGO_SVG = `data:image/svg+xml;base64,${btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" fill="${GRAB_GREEN}">
  <path d="M20 15h10v5H20zm0 10h15v5H20zm0 10h12v5H20z"/>
  <text x="50" y="35" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${GRAB_GREEN}">Grab</text>
</svg>
`)}`;

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

  // Show on all devices for testing, but the functionality will only work on mobile

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
      const grabScheme = coords.lat && coords.lng
        ? `grab://book?destination=${coords.lat},${coords.lng}`
        : `grab://book?destination=${encodeURIComponent(address!)}`;
      const playStore = "https://play.google.com/store/apps/details?id=com.grabtaxi.passenger";
      
      window.location.href = grabScheme;
      
      // Fallback to Play Store if app not installed
      setTimeout(() => {
        if (document.hasFocus() && document.visibilityState === "visible") {
          window.location.href = playStore;
        }
      }, 1500);
      return;
    }

    if (isIOS()) {
      const scheme = coords.lat && coords.lng
        ? `grab://book?destination=${coords.lat},${coords.lng}`
        : `grab://book?destination=${encodeURIComponent(address!)}`;
      const appStore = "https://apps.apple.com/app/id647268330";
      
      window.location.href = scheme;
      
      // Fallback to App Store if app not installed
      setTimeout(() => {
        if (document.visibilityState === "visible") {
          window.location.href = appStore;
        }
      }, 1200);
      return;
    }

    // Desktop fallback - open Google Maps
    if (venue.google_maps_link) {
      window.open(venue.google_maps_link, "_blank");
    } else {
      const encodedAddress = encodeURIComponent(address!);
      window.open(`https://maps.google.com?q=${encodedAddress}`, "_blank");
    }
  }

  return (
    <a
      href="#grab"
      onClick={openInGrab}
      aria-label="Open destination in Grab app"
      title="Open destination in Grab"
      className="inline-flex items-center gap-1 min-h-[44px] px-2 text-sm font-medium hover:opacity-80 transition-opacity whitespace-nowrap"
      style={{ color: GRAB_GREEN }}
    >
      <img
        src={GRAB_LOGO_SVG}
        alt="Grab"
        width={20}
        height={20}
        className="flex-shrink-0"
        loading="lazy"
        onError={(e) => {
          // Fallback to text-only if image fails
          e.currentTarget.style.display = 'none';
        }}
      />
      <span className="text-sm font-medium">Grab a Grab</span>
    </a>
  );
}
import { useState, useEffect } from "react";

interface Venue {
  id: string;
  business_name: string;
  address: string;
  google_maps_link?: string;
  latitude?: number;
  longitude?: number;
}

const GRAB_BLUE = "#1e40af";
// Using a data URI for the Grab logo as fallback for better mobile compatibility
const GRAB_LOGO_SVG = `data:image/svg+xml;base64,${btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60" fill="${GRAB_BLUE}">
  <path d="M20 15h10v5H20zm0 10h15v5H20zm0 10h12v5H20z"/>
  <text x="50" y="35" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${GRAB_BLUE}">Grab</text>
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

    // Construct the proper Grab deep link
    let grabUrl = "";
    
    if (coords.lat && coords.lng) {
      // Use coordinates if available
      grabUrl = `https://grab.onelink.me/2695613898?pid=inappBrowser&c=MGP&is_retargeting=true&af_dp=grab%3A%2F%2Fopen%3FscreenType%3DBOOKING%26bookingType%3DJUSTGRAB%26dropOffLatitude%3D${coords.lat}%26dropOffLongitude%3D${coords.lng}`;
    } else if (address) {
      // Use address if coordinates not available
      grabUrl = `https://grab.onelink.me/2695613898?pid=inappBrowser&c=MGP&is_retargeting=true&af_dp=grab%3A%2F%2Fopen%3FscreenType%3DBOOKING%26bookingType%3DJUSTGRAB%26dropOffAddress%3D${encodeURIComponent(address)}`;
    }

    if (isAndroid() || isIOS()) {
      if (grabUrl) {
        window.location.href = grabUrl;
      } else {
        // Fallback to app stores
        const storeUrl = isAndroid() 
          ? "https://play.google.com/store/apps/details?id=com.grabtaxi.passenger"
          : "https://apps.apple.com/app/id647268330";
        window.location.href = storeUrl;
      }
      return;
    }

    // Desktop fallback
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
      className="inline-flex items-center gap-1 min-h-[44px] px-2 text-sm font-medium hover:opacity-80 transition-opacity whitespace-nowrap"
      style={{ color: GRAB_BLUE }}
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
      <span className="text-sm font-medium">GRAB A GRAB!</span>
    </a>
  );
}
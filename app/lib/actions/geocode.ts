import "server-only";

export interface GeocodeResult {
  country: string;
  formattedAddress: string;
}

export async function getCountryFromCoordinates(
  lat: number,
  lng: number
): Promise<GeocodeResult> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", lat.toString());
  url.searchParams.set("lon", lng.toString());
  url.searchParams.set("zoom", "10"); // higher = more detail, lower = broader
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: {
      // Nominatim requires a User-Agent or email for identification
      "User-Agent": "nextjs-geocode-demo/1.0 (your-email@example.com)",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Nominatim request failed: HTTP ${res.status}`);
  }

  const data = await res.json();

  return {
    country: data.address?.country ?? "Unknown",
    formattedAddress: data.display_name ?? "Unknown",
  };
}

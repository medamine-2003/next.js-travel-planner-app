"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getCountryFromCoordinates } from "./geocode";

async function geocodeAddress(address: string) {
  // Nominatim forward geocoding
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", address);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "nextjs-geocode-demo/1.0 (your-email@example.com)",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Nominatim request failed: HTTP ${res.status}`);
  }

  const data = await res.json();

  if (!data || data.length === 0) {
    throw new Error("Unable to geocode address");
  }

  const lat = parseFloat(data[0].lat);
  const lng = parseFloat(data[0].lon);

  // Use your reusable function to get country & formatted address
  const { country, formattedAddress } = await getCountryFromCoordinates(
    lat,
    lng
  );

  return { lat, lng, country, name: formattedAddress };
}

export async function addLocation(formData: FormData, tripId: string) {
  const session = await auth();
  if (!session) {
    throw new Error("Not authenticated");
  }

  const address = formData.get("address")?.toString();
  if (!address) {
    throw new Error("Missing address");
  }

  const { lat, lng, country, name } = await geocodeAddress(address);

  const count = await prisma.location.count({
    where: { tripId },
  });

  await prisma.location.create({
    data: {
      locationTitle: address,   
      lat,
      lng,
      tripId,
      order: count,
    },
  });

  redirect(`/trips/${tripId}`);
}

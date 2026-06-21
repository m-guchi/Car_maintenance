import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { getVehicleForUser } from "@/lib/vehicles";

export async function getVehicleForSession(vehicleId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    notFound();
  }

  const vehicle = await getVehicleForUser(userId, vehicleId);

  if (!vehicle) {
    notFound();
  }

  return { vehicle, session };
}

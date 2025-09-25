import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface LocationUpdate {
  rideId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
}

export interface BatchLocationUpdate {
  updates: LocationUpdate[];
}

// Updates location data for multiple rides in batch.
export const updateLocation = api<BatchLocationUpdate, void>(
  { method: "POST", path: "/location/update", expose: true, auth: true },
  async (req) => {
    const auth = getAuthData()!;
    
    if (auth.role !== "driver") {
      throw APIError.permissionDenied("only drivers can update location");
    }

    if (req.updates.length === 0) {
      return;
    }

    // Verify all rides belong to the driver and are active
    const rideIds = req.updates.map(u => u.rideId);
    const validRides = await db.queryAll<{ id: string }>`
      SELECT id FROM rides 
      WHERE id = ANY(${rideIds}) AND driver_id = ${auth.userID} AND status = 'in_progress'
    `;

    const validRideIds = new Set(validRides.map(r => r.id));
    const validUpdates = req.updates.filter(u => validRideIds.has(u.rideId));

    if (validUpdates.length === 0) {
      throw APIError.invalidArgument("no valid rides found for location updates");
    }

    // Insert location updates
    for (const update of validUpdates) {
      await db.exec`
        INSERT INTO location_updates (ride_id, latitude, longitude, speed, heading)
        VALUES (${update.rideId}, ${update.latitude}, ${update.longitude}, ${update.speed}, ${update.heading})
      `;
    }
  }
);

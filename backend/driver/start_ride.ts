import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface StartRideRequest {
  routeId: string;
}

export interface Ride {
  id: string;
  routeId: string;
  status: string;
  startedAt: Date;
}

// Starts a new ride for the specified route.
export const startRide = api<StartRideRequest, Ride>(
  { method: "POST", path: "/driver/rides/start", expose: true, auth: true },
  async (req) => {
    const auth = getAuthData()!;
    
    if (auth.role !== "driver") {
      throw APIError.permissionDenied("only drivers can start rides");
    }

    // Verify route belongs to driver
    const route = await db.queryRow`
      SELECT id FROM routes WHERE id = ${req.routeId} AND driver_id = ${auth.userID}
    `;
    
    if (!route) {
      throw APIError.notFound("route not found or not owned by driver");
    }

    // Check if driver already has an active ride
    const activeRide = await db.queryRow`
      SELECT id FROM rides 
      WHERE driver_id = ${auth.userID} AND status = 'in_progress'
    `;
    
    if (activeRide) {
      throw APIError.alreadyExists("driver already has an active ride");
    }

    const ride = await db.queryRow<{
      id: string;
      route_id: string;
      status: string;
      started_at: Date;
    }>`
      INSERT INTO rides (route_id, driver_id, status, started_at)
      VALUES (${req.routeId}, ${auth.userID}, 'in_progress', NOW())
      RETURNING id, route_id, status, started_at
    `;

    if (!ride) {
      throw APIError.internal("failed to start ride");
    }

    return {
      id: ride.id,
      routeId: ride.route_id,
      status: ride.status,
      startedAt: ride.started_at,
    };
  }
);

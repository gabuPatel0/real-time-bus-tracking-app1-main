import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface EndRideRequest {
  rideId: string;
}

export interface Ride {
  id: string;
  routeId: string;
  status: string;
  startedAt: Date;
  endedAt: Date;
}

// Ends an active ride.
export const endRide = api<EndRideRequest, Ride>(
  { method: "POST", path: "/driver/rides/end", expose: true, auth: true },
  async (req) => {
    const auth = getAuthData()!;
    
    if (auth.role !== "driver") {
      throw APIError.permissionDenied("only drivers can end rides");
    }

    const ride = await db.queryRow<{
      id: string;
      route_id: string;
      status: string;
      started_at: Date;
      ended_at: Date;
    }>`
      UPDATE rides 
      SET status = 'ended', ended_at = NOW(), updated_at = NOW()
      WHERE id = ${req.rideId} AND driver_id = ${auth.userID} AND status = 'in_progress'
      RETURNING id, route_id, status, started_at, ended_at
    `;

    if (!ride) {
      throw APIError.notFound("active ride not found");
    }

    return {
      id: ride.id,
      routeId: ride.route_id,
      status: ride.status,
      startedAt: ride.started_at,
      endedAt: ride.ended_at,
    };
  }
);

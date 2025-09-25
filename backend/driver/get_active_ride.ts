import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface ActiveRide {
  id: string;
  routeId: string;
  routeName: string;
  status: string;
  startedAt: Date;
}

export interface GetActiveRideResponse {
  ride?: ActiveRide;
}

// Gets the driver's currently active ride.
export const getActiveRide = api<void, GetActiveRideResponse>(
  { method: "GET", path: "/driver/rides/active", expose: true, auth: true },
  async () => {
    const auth = getAuthData()!;

    const ride = await db.queryRow<{
      id: string;
      route_id: string;
      route_name: string;
      status: string;
      started_at: Date;
    }>`
      SELECT r.id, r.route_id, rt.name as route_name, r.status, r.started_at
      FROM rides r
      JOIN routes rt ON r.route_id = rt.id
      WHERE r.driver_id = ${auth.userID} AND r.status = 'in_progress'
    `;

    if (!ride) {
      return {};
    }

    return {
      ride: {
        id: ride.id,
        routeId: ride.route_id,
        routeName: ride.route_name,
        status: ride.status,
        startedAt: ride.started_at,
      },
    };
  }
);

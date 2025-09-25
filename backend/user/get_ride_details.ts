import { api, APIError } from "encore.dev/api";
import db from "../db";

export interface RideDetails {
  id: string;
  routeName: string;
  driverName: string;
  startLocation: string;
  endLocation: string;
  startedAt: Date;
  estimatedDurationMinutes?: number;
  lastLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
}

export interface GetRideDetailsParams {
  rideId: string;
}

// Gets detailed information about a specific ride.
export const getRideDetails = api<GetRideDetailsParams, RideDetails>(
  { method: "GET", path: "/user/rides/:rideId", expose: true, auth: true },
  async (params) => {
    const ride = await db.queryRow<{
      id: string;
      route_name: string;
      driver_name: string;
      start_location: string;
      end_location: string;
      started_at: Date;
      estimated_duration_minutes: number | null;
    }>`
      SELECT 
        rides.id,
        routes.name as route_name,
        users.name as driver_name,
        routes.start_location,
        routes.end_location,
        rides.started_at,
        routes.estimated_duration_minutes
      FROM rides
      JOIN routes ON rides.route_id = routes.id
      JOIN users ON rides.driver_id = users.id
      WHERE rides.id = ${params.rideId} AND rides.status = 'in_progress'
    `;

    if (!ride) {
      throw APIError.notFound("ride not found or not active");
    }

    // Get latest location
    const lastLocation = await db.queryRow<{
      latitude: number;
      longitude: number;
      timestamp: Date;
    }>`
      SELECT latitude, longitude, timestamp
      FROM location_updates
      WHERE ride_id = ${params.rideId}
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    return {
      id: ride.id,
      routeName: ride.route_name,
      driverName: ride.driver_name,
      startLocation: ride.start_location,
      endLocation: ride.end_location,
      startedAt: ride.started_at,
      estimatedDurationMinutes: ride.estimated_duration_minutes || undefined,
      lastLocation: lastLocation || undefined,
    };
  }
);

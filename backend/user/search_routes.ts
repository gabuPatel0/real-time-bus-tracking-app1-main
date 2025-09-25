import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import db from "../db";

export interface RouteWithActiveRides {
  id: string;
  name: string;
  description?: string;
  startLocation: string;
  endLocation: string;
  estimatedDurationMinutes?: number;
  driverName: string;
  activeRides: {
    id: string;
    startedAt: Date;
  }[];
}

export interface SearchRoutesParams {
  query?: Query<string>;
  startLocation?: Query<string>;
  endLocation?: Query<string>;
}

export interface SearchRoutesResponse {
  routes: RouteWithActiveRides[];
}

// Searches for routes with active rides based on criteria.
export const searchRoutes = api<SearchRoutesParams, SearchRoutesResponse>(
  { method: "GET", path: "/user/routes/search", expose: true, auth: true },
  async (params) => {
    let whereConditions = ["rides.status = 'in_progress'"];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (params.query) {
      whereConditions.push(`(routes.name ILIKE $${paramIndex} OR routes.description ILIKE $${paramIndex})`);
      queryParams.push(`%${params.query}%`);
      paramIndex++;
    }

    if (params.startLocation) {
      whereConditions.push(`routes.start_location ILIKE $${paramIndex}`);
      queryParams.push(`%${params.startLocation}%`);
      paramIndex++;
    }

    if (params.endLocation) {
      whereConditions.push(`routes.end_location ILIKE $${paramIndex}`);
      queryParams.push(`%${params.endLocation}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const query = `
      SELECT 
        routes.id as route_id,
        routes.name as route_name,
        routes.description as route_description,
        routes.start_location,
        routes.end_location,
        routes.estimated_duration_minutes,
        users.name as driver_name,
        rides.id as ride_id,
        rides.started_at
      FROM routes
      JOIN users ON routes.driver_id = users.id
      JOIN rides ON routes.id = rides.route_id
      WHERE ${whereClause}
      ORDER BY routes.name, rides.started_at DESC
    `;

    const rows = await db.rawQueryAll<{
      route_id: string;
      route_name: string;
      route_description: string | null;
      start_location: string;
      end_location: string;
      estimated_duration_minutes: number | null;
      driver_name: string;
      ride_id: string;
      started_at: Date;
    }>(query, ...queryParams);

    // Group rides by route
    const routeMap = new Map<string, RouteWithActiveRides>();

    for (const row of rows) {
      if (!routeMap.has(row.route_id)) {
        routeMap.set(row.route_id, {
          id: row.route_id,
          name: row.route_name,
          description: row.route_description || undefined,
          startLocation: row.start_location,
          endLocation: row.end_location,
          estimatedDurationMinutes: row.estimated_duration_minutes || undefined,
          driverName: row.driver_name,
          activeRides: [],
        });
      }

      const route = routeMap.get(row.route_id)!;
      route.activeRides.push({
        id: row.ride_id,
        startedAt: row.started_at,
      });
    }

    return {
      routes: Array.from(routeMap.values()),
    };
  }
);

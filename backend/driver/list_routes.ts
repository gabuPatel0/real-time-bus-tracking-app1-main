import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface Route {
  id: string;
  name: string;
  description?: string;
  startLocation: string;
  endLocation: string;
  estimatedDurationMinutes?: number;
  createdAt: Date;
}

export interface ListRoutesResponse {
  routes: Route[];
}

// Retrieves all routes created by the authenticated driver.
export const listRoutes = api<void, ListRoutesResponse>(
  { method: "GET", path: "/driver/routes", expose: true, auth: true },
  async () => {
    const auth = getAuthData()!;

    const rows = await db.queryAll<{
      id: string;
      name: string;
      description: string | null;
      start_location: string;
      end_location: string;
      estimated_duration_minutes: number | null;
      created_at: Date;
    }>`
      SELECT id, name, description, start_location, end_location, estimated_duration_minutes, created_at
      FROM routes
      WHERE driver_id = ${auth.userID}
      ORDER BY created_at DESC
    `;

    const routes = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      startLocation: row.start_location,
      endLocation: row.end_location,
      estimatedDurationMinutes: row.estimated_duration_minutes || undefined,
      createdAt: row.created_at,
    }));

    return { routes };
  }
);

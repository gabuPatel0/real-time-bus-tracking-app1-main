import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface CreateRouteRequest {
  name: string;
  description?: string;
  startLocation: string;
  endLocation: string;
  estimatedDurationMinutes?: number;
}

export interface Route {
  id: string;
  name: string;
  description?: string;
  startLocation: string;
  endLocation: string;
  estimatedDurationMinutes?: number;
  createdAt: Date;
}

// Creates a new bus route.
export const createRoute = api<CreateRouteRequest, Route>(
  { method: "POST", path: "/driver/routes", expose: true, auth: true },
  async (req) => {
    const auth = getAuthData()!;
    
    if (auth.role !== "driver") {
      throw APIError.permissionDenied("only drivers can create routes");
    }

    const result = await db.mongo.insertOne('routes', {
      driverId: new db.ObjectId(auth.userID),
      name: req.name,
      description: req.description,
      startLocation: req.startLocation,
      endLocation: req.endLocation,
      estimatedDurationMinutes: req.estimatedDurationMinutes
    });

    const route = await db.mongo.findOne('routes', { _id: result.insertedId }) as {
      _id: string;
      name: string;
      description: string | null;
      startLocation: string;
      endLocation: string;
      estimatedDurationMinutes: number | null;
      createdAt: Date;
    } | null;

    if (!route) {
      throw APIError.internal("failed to create route");
    }

    return {
      id: route._id.toString(),
      name: route.name,
      description: route.description || undefined,
      startLocation: route.startLocation,
      endLocation: route.endLocation,
      estimatedDurationMinutes: route.estimatedDurationMinutes || undefined,
      createdAt: route.createdAt,
    };
  }
);

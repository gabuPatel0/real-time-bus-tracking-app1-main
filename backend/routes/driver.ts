import { Router, Request, Response } from "express";
import db from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

// POST /driver/routes - create route (driver only)
router.post("/routes", requireAuth, async (req: Request, res: Response) => {
  const auth = req.auth!;
  if (auth.role !== "driver") return res.status(403).json({ error: "only drivers can create routes" });

  const { name, description, startLocation, endLocation, estimatedDurationMinutes } = req.body || {};
  if (!name || !startLocation || !endLocation) return res.status(400).json({ error: "missing fields" });

  const result = await db.mongo.insertOne('routes', {
    driverId: new db.ObjectId(auth.userID),
    name,
    description,
    startLocation,
    endLocation,
    estimatedDurationMinutes
  });

  const route = await db.mongo.findOne('routes', { _id: result.insertedId }) as {
    _id: string; name: string; description: string | null; startLocation: string; 
    endLocation: string; estimatedDurationMinutes: number | null; createdAt: Date
  } | null;

  if (!route) return res.status(500).json({ error: "failed to create route" });

  return res.json({
    id: route._id.toString(),
    name: route.name,
    description: route.description || undefined,
    startLocation: route.startLocation,
    endLocation: route.endLocation,
    estimatedDurationMinutes: route.estimatedDurationMinutes || undefined,
    createdAt: route.createdAt,
  });
});

// GET /driver/routes - list routes
router.get("/routes", requireAuth, async (req: Request, res: Response) => {
  const auth = req.auth!;
  const rows = await db.mongo.findMany('routes', 
    { driverId: new db.ObjectId(auth.userID) }, 
    { sort: { createdAt: -1 } }
  ) as Array<{ _id: string; name: string; description: string | null; startLocation: string; endLocation: string; estimatedDurationMinutes: number | null; createdAt: Date }>;

  const routes = rows.map(row => ({
    id: row._id.toString(),
    name: row.name,
    description: row.description || undefined,
    startLocation: row.startLocation,
    endLocation: row.endLocation,
    estimatedDurationMinutes: row.estimatedDurationMinutes || undefined,
    createdAt: row.createdAt,
  }));

  return res.json({ routes });
});

// POST /driver/rides/start - start ride
router.post("/rides/start", requireAuth, async (req: Request, res: Response) => {
  const auth = req.auth!;
  if (auth.role !== "driver") return res.status(403).json({ error: "only drivers can start rides" });
  const { routeId } = req.body || {};
  if (!routeId) return res.status(400).json({ error: "missing routeId" });

  const route = await db.mongo.findOne('routes', { 
    _id: new db.ObjectId(routeId), 
    driverId: new db.ObjectId(auth.userID) 
  });
  if (!route) return res.status(404).json({ error: "route not found or not owned by driver" });

  const activeRide = await db.mongo.findOne('rides', { 
    driverId: new db.ObjectId(auth.userID), 
    status: 'in_progress' 
  });
  if (activeRide) return res.status(409).json({ error: "driver already has an active ride" });

  const result = await db.mongo.insertOne('rides', {
    routeId: new db.ObjectId(routeId),
    driverId: new db.ObjectId(auth.userID),
    status: 'in_progress',
    startedAt: new Date()
  });

  const ride = await db.mongo.findOne('rides', { _id: result.insertedId }) as {
    _id: string; routeId: string; status: string; startedAt: Date
  } | null;

  if (!ride) return res.status(500).json({ error: "failed to start ride" });

  return res.json({ 
    id: ride._id.toString(), 
    routeId: ride.routeId.toString(), 
    status: ride.status, 
    startedAt: ride.startedAt 
  });
});

// POST /driver/rides/end - end ride
router.post("/rides/end", requireAuth, async (req: Request, res: Response) => {
  const auth = req.auth!;
  if (auth.role !== "driver") return res.status(403).json({ error: "only drivers can end rides" });
  const { rideId } = req.body || {};
  if (!rideId) return res.status(400).json({ error: "missing rideId" });

  const updateResult = await db.mongo.updateOne('rides', 
    { 
      _id: new db.ObjectId(rideId), 
      driverId: new db.ObjectId(auth.userID), 
      status: 'in_progress' 
    },
    { 
      $set: { 
        status: 'ended', 
        endedAt: new Date() 
      } 
    }
  );

  if (updateResult.matchedCount === 0) return res.status(404).json({ error: "active ride not found" });

  const ride = await db.mongo.findOne('rides', { _id: new db.ObjectId(rideId) }) as {
    _id: string; routeId: string; status: string; startedAt: Date; endedAt: Date
  } | null;

  if (!ride) return res.status(404).json({ error: "ride not found" });
  
  return res.json({ 
    id: ride._id.toString(), 
    routeId: ride.routeId.toString(), 
    status: ride.status, 
    startedAt: ride.startedAt, 
    endedAt: ride.endedAt 
  });
});

// GET /driver/rides/active - get active ride
router.get("/rides/active", requireAuth, async (req: Request, res: Response) => {
  const auth = req.auth!;
  const rides = await db.mongo.aggregate('rides', [
    {
      $match: {
        driverId: new db.ObjectId(auth.userID),
        status: 'in_progress'
      }
    },
    {
      $lookup: {
        from: 'routes',
        localField: 'routeId',
        foreignField: '_id',
        as: 'route'
      }
    },
    {
      $unwind: '$route'
    },
    {
      $project: {
        _id: 1,
        routeId: 1,
        status: 1,
        startedAt: 1,
        routeName: '$route.name'
      }
    }
  ]) as Array<{ _id: string; routeId: string; routeName: string; status: string; startedAt: Date }>;

  if (rides.length === 0) return res.json({});
  
  const ride = rides[0];
  return res.json({ 
    ride: { 
      id: ride._id.toString(), 
      routeId: ride.routeId.toString(), 
      routeName: ride.routeName, 
      status: ride.status, 
      startedAt: ride.startedAt 
    } 
  });
});

export default router;

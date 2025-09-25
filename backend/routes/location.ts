import { Router, Request, Response } from "express";
import db from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

// POST /location/update - batch updates, driver only
router.post("/update", requireAuth, async (req: Request, res: Response) => {
  const auth = req.auth!;
  if (auth.role !== "driver") return res.status(403).json({ error: "only drivers can update location" });

  const updates: Array<{ rideId: string; latitude: number; longitude: number; speed?: number; heading?: number }>
    = (req.body?.updates as any[]) || [];
  if (!Array.isArray(updates) || updates.length === 0) return res.status(400).json({ error: "no updates provided" });

  const rideIds = updates.map(u => new db.ObjectId(u.rideId));
  const validRides = await db.mongo.findMany('rides', {
    _id: { $in: rideIds },
    driverId: new db.ObjectId(auth.userID),
    status: 'in_progress'
  }) as Array<{ _id: string }>;
  const validRideIds = new Set(validRides.map((r: { _id: string }) => r._id.toString()));
  const validUpdates = updates.filter(u => validRideIds.has(u.rideId));
  if (validUpdates.length === 0) return res.status(400).json({ error: "no valid rides found for location updates" });

  for (const u of validUpdates) {
    await db.mongo.insertOne('locationUpdates', {
      rideId: new db.ObjectId(u.rideId),
      latitude: u.latitude,
      longitude: u.longitude,
      speed: u.speed,
      heading: u.heading,
      timestamp: new Date()
    });
  }
  res.status(204).end();
});

// GET /location/stream - SSE stream of latest location for a ride
router.get("/stream", async (req: Request, res: Response) => {
  const rideId = (req.query.rideId as string) || "";
  if (!rideId) return res.status(400).json({ error: "rideId is required" });

  const ride = await db.mongo.findOne('rides', { 
    _id: new db.ObjectId(rideId), 
    status: 'in_progress' 
  });
  if (!ride) return res.status(404).end();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let lastTimestamp = new Date();
  const send = (event: any) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  const interval = setInterval(async () => {
    try {
      const locations = await db.mongo.findMany('locationUpdates', 
        {
          rideId: new db.ObjectId(rideId),
          timestamp: { $gt: lastTimestamp }
        },
        { sort: { timestamp: -1 }, limit: 1 }
      ) as Array<{ rideId: string; latitude: number; longitude: number; speed: number | null; heading: number | null; timestamp: Date }>;
      const loc = locations[0] || null;
      if (loc) {
        send({
          rideId: loc.rideId.toString(),
          latitude: loc.latitude,
          longitude: loc.longitude,
          speed: loc.speed || undefined,
          heading: loc.heading || undefined,
          timestamp: loc.timestamp,
        });
        lastTimestamp = loc.timestamp;
      }
      const activeRide = await db.mongo.findOne('rides', { 
        _id: new db.ObjectId(rideId), 
        status: 'in_progress' 
      });
      if (!activeRide) {
        clearInterval(interval);
        res.end();
      }
    } catch (e) {
      clearInterval(interval);
      res.end();
    }
  }, 15000);

  req.on("close", () => {
    clearInterval(interval);
  });
});

export default router;

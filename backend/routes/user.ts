import { Router, Request, Response } from "express";
import db from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /user/routes/search
router.get("/routes/search", requireAuth, async (req: Request, res: Response) => {
  const query = (req.query.query as string) || undefined;
  const startLocation = (req.query.startLocation as string) || undefined;
  const endLocation = (req.query.endLocation as string) || undefined;

  // Build MongoDB aggregation pipeline
  const matchConditions: any = {};
  
  if (query) {
    matchConditions.$or = [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ];
  }
  if (startLocation) {
    matchConditions.startLocation = { $regex: startLocation, $options: 'i' };
  }
  if (endLocation) {
    matchConditions.endLocation = { $regex: endLocation, $options: 'i' };
  }

  const pipeline = [
    // Match routes based on search criteria
    ...(Object.keys(matchConditions).length > 0 ? [{ $match: matchConditions }] : []),
    
    // Lookup active rides for each route
    {
      $lookup: {
        from: 'rides',
        localField: '_id',
        foreignField: 'routeId',
        as: 'rides',
        pipeline: [
          { $match: { status: 'in_progress' } },
          { $sort: { startedAt: -1 } }
        ]
      }
    },
    
    // Only include routes with active rides
    { $match: { 'rides.0': { $exists: true } } },
    
    // Lookup driver information
    {
      $lookup: {
        from: 'users',
        localField: 'driverId',
        foreignField: '_id',
        as: 'driver'
      }
    },
    
    // Unwind driver array
    { $unwind: '$driver' },
    
    // Project final structure
    {
      $project: {
        id: { $toString: '$_id' },
        name: 1,
        description: 1,
        startLocation: 1,
        endLocation: 1,
        estimatedDurationMinutes: 1,
        driverName: '$driver.name',
        activeRides: {
          $map: {
            input: '$rides',
            as: 'ride',
            in: {
              id: { $toString: '$$ride._id' },
              startedAt: '$$ride.startedAt'
            }
          }
        }
      }
    },
    
    // Sort by route name
    { $sort: { name: 1 } }
  ];

  const routes = await db.mongo.aggregate('routes', pipeline);
  res.json({ routes });
});

// GET /user/rides/:rideId - get ride details for tracking
router.get("/rides/:rideId", requireAuth, async (req: Request, res: Response) => {
  const { rideId } = req.params;
  
  try {
    // Validate ObjectId format
    if (!db.ObjectId.isValid(rideId)) {
      return res.status(400).json({ error: "Invalid ride ID format" });
    }

    const pipeline = [
      // Match the specific ride
      { $match: { _id: new db.ObjectId(rideId) } },
      
      // Lookup route information
      {
        $lookup: {
          from: 'routes',
          localField: 'routeId',
          foreignField: '_id',
          as: 'route'
        }
      },
      
      // Lookup driver information
      {
        $lookup: {
          from: 'users',
          localField: 'driverId',
          foreignField: '_id',
          as: 'driver'
        }
      },
      
      // Lookup latest location update
      {
        $lookup: {
          from: 'locationUpdates',
          localField: '_id',
          foreignField: 'rideId',
          as: 'locationUpdates',
          pipeline: [
            { $sort: { timestamp: -1 } },
            { $limit: 1 }
          ]
        }
      },
      
      // Unwind arrays
      { $unwind: '$route' },
      { $unwind: '$driver' },
      
      // Project final structure
      {
        $project: {
          id: { $toString: '$_id' },
          routeName: '$route.name',
          startLocation: '$route.startLocation',
          endLocation: '$route.endLocation',
          estimatedDurationMinutes: '$route.estimatedDurationMinutes',
          driverName: '$driver.name',
          status: 1,
          startedAt: 1,
          endedAt: 1,
          lastLocation: {
            $cond: {
              if: { $gt: [{ $size: '$locationUpdates' }, 0] },
              then: {
                latitude: { $arrayElemAt: ['$locationUpdates.latitude', 0] },
                longitude: { $arrayElemAt: ['$locationUpdates.longitude', 0] },
                timestamp: { $arrayElemAt: ['$locationUpdates.timestamp', 0] }
              },
              else: null
            }
          }
        }
      }
    ];

    const rides = await db.mongo.aggregate('rides', pipeline);
    
    if (rides.length === 0) {
      return res.status(404).json({ error: "Ride not found" });
    }

    const ride = rides[0];
    
    // Only allow tracking of in-progress rides
    if (ride.status !== 'in_progress') {
      return res.status(400).json({ 
        error: `Cannot track ride with status: ${ride.status}` 
      });
    }

    res.json(ride);
  } catch (error) {
    console.error("Error getting ride details:", error);
    res.status(500).json({ error: "Failed to get ride details" });
  }
});

export default router;

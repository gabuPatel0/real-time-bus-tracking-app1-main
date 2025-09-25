import { api, StreamOut } from "encore.dev/api";
import db from "../db";

export interface LocationStreamMessage {
  rideId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
}

export interface LocationStreamHandshake {
  rideId: string;
}

// Streams real-time location updates for a specific ride.
export const locationStream = api.streamOut<LocationStreamHandshake, LocationStreamMessage>(
  { path: "/location/stream", expose: true },
  async (handshake, stream) => {
    const { rideId } = handshake;
    
    // Verify ride exists and is active
    const ride = await db.queryRow`
      SELECT id FROM rides WHERE id = ${rideId} AND status = 'in_progress'
    `;
    
    if (!ride) {
      await stream.close();
      return;
    }

    let lastTimestamp = new Date();

    // Stream location updates every 15 seconds
    const interval = setInterval(async () => {
      try {
        const locationUpdate = await db.queryRow<{
          ride_id: string;
          latitude: number;
          longitude: number;
          speed: number | null;
          heading: number | null;
          timestamp: Date;
        }>`
          SELECT ride_id, latitude, longitude, speed, heading, timestamp
          FROM location_updates
          WHERE ride_id = ${rideId} AND timestamp > ${lastTimestamp}
          ORDER BY timestamp DESC
          LIMIT 1
        `;

        if (locationUpdate) {
          await stream.send({
            rideId: locationUpdate.ride_id,
            latitude: locationUpdate.latitude,
            longitude: locationUpdate.longitude,
            speed: locationUpdate.speed || undefined,
            heading: locationUpdate.heading || undefined,
            timestamp: locationUpdate.timestamp,
          });
          lastTimestamp = locationUpdate.timestamp;
        }

        // Check if ride is still active
        const activeRide = await db.queryRow`
          SELECT id FROM rides WHERE id = ${rideId} AND status = 'in_progress'
        `;
        
        if (!activeRide) {
          clearInterval(interval);
          await stream.close();
        }
      } catch (error) {
        clearInterval(interval);
        await stream.close();
      }
    }, 15000);

    // The stream will automatically clean up when client disconnects
  }
);

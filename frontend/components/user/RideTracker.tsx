import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../../contexts/AuthContext";
import { userAPI } from "../../lib/api";
import EmbeddedBusMap from "../maps/EmbeddedBusMap";
import { MapPin, Clock, User, Navigation, RefreshCw } from "lucide-react";

// Define the RideDetails type locally
interface RideDetails {
  id: string;
  routeName: string;
  startLocation: string;
  endLocation: string;
  estimatedDurationMinutes?: number;
  driverName: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  lastLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
}

export default function RideTracker() {
  const [rideId, setRideId] = useState("");
  const [rideDetails, setRideDetails] = useState<RideDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const streamRef = useRef<any>(null);
  const backend = useBackend();
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.close();
      }
    };
  }, []);

  const handleTrackRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rideId.trim()) return;

    setIsLoading(true);
    try {
      const details = await userAPI.getRideDetails(rideId.trim());
      setRideDetails(details);
      toast({ title: "Ride found! Starting location tracking..." });
      startLocationStream(rideId.trim());
    } catch (error: any) {
      console.error("Failed to get ride details:", error);
      toast({
        title: "Ride not found",
        description: error.message || "Please check the ride ID and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startLocationStream = async (trackingRideId: string) => {
    try {
      setIsTracking(true);
      const stream = await backend.location.locationStream({ rideId: trackingRideId });
      streamRef.current = stream;

      for await (const locationUpdate of stream) {
        if (rideDetails) {
          setRideDetails({
            ...rideDetails,
            lastLocation: {
              latitude: locationUpdate.latitude,
              longitude: locationUpdate.longitude,
              timestamp: locationUpdate.timestamp,
            },
          });
          setLastUpdate(new Date());
        }
      }
    } catch (error: any) {
      console.error("Location stream error:", error);
      toast({
        title: "Tracking stopped",
        description: "The ride may have ended or connection was lost",
      });
    } finally {
      setIsTracking(false);
      streamRef.current = null;
    }
  };

  const stopTracking = () => {
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
    setIsTracking(false);
    setRideDetails(null);
    setRideId("");
    setLastUpdate(null);
  };

  const refreshRideDetails = async () => {
    if (!rideDetails) return;
    
    try {
      const updated = await userAPI.getRideDetails(rideDetails.id);
      setRideDetails(updated);
    } catch (error: any) {
      console.error("Failed to refresh ride details:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Track Bus Location</h2>
        <p className="text-muted-foreground">Enter a ride ID to track a bus in real-time</p>
      </div>

      {!rideDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Enter Ride ID</CardTitle>
            <CardDescription>
              Get the ride ID from the bus search results or from the driver
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrackRide} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rideId">Ride ID</Label>
                <Input
                  id="rideId"
                  placeholder="e.g., 123456"
                  value={rideId}
                  onChange={(e) => setRideId(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                <Navigation className="h-4 w-4 mr-2" />
                {isLoading ? "Finding ride..." : "Start Tracking"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {rideDetails && (
        <div className="space-y-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {rideDetails.routeName}
                <Badge variant={isTracking ? "default" : "secondary"}>
                  {isTracking ? "Live Tracking" : "Tracking Stopped"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Real-time location tracking for this bus ride
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Driver:</span>
                    <span>{rideDetails.driverName}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="font-medium">From:</span>
                    <span>{rideDetails.startLocation}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-red-600" />
                    <span className="font-medium">To:</span>
                    <span>{rideDetails.endLocation}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Started:</span>
                    <span>{new Date(rideDetails.startedAt).toLocaleString()}</span>
                  </div>
                  {rideDetails.estimatedDurationMinutes && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Duration:</span>
                      <span>{rideDetails.estimatedDurationMinutes} min</span>
                    </div>
                  )}
                  {lastUpdate && (
                    <div className="flex items-center space-x-2 text-sm">
                      <RefreshCw className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Last update:</span>
                      <span>{lastUpdate.toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={refreshRideDetails} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={stopTracking} variant="destructive" size="sm">
                  Stop Tracking
                </Button>
              </div>
            </CardContent>
          </Card>

          <EmbeddedBusMap
            rideId={rideDetails.id}
            initialLocation={rideDetails.lastLocation ? {
              latitude: rideDetails.lastLocation.latitude,
              longitude: rideDetails.lastLocation.longitude,
              timestamp: rideDetails.lastLocation.timestamp
            } : undefined}
            routeInfo={{
              routeName: rideDetails.routeName,
              startLocation: rideDetails.startLocation,
              endLocation: rideDetails.endLocation,
              driverName: rideDetails.driverName
            }}
            onLocationUpdate={(location: any) => {
              if (rideDetails) {
                setRideDetails({
                  ...rideDetails,
                  lastLocation: location
                });
                setLastUpdate(new Date());
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

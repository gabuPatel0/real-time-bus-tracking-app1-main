import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../../contexts/AuthContext";
import { useLocation } from "../../contexts/LocationContext";
import { MapPin, Wifi, WifiOff, Clock } from "lucide-react";
import type { ActiveRide } from "~backend/driver/get_active_ride";

export default function LocationTransmitter() {
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [transmissionCount, setTransmissionCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const backend = useBackend();
  const { location, error, isTracking, startTracking, stopTracking } = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    loadActiveRide();
  }, []);

  useEffect(() => {
    if (isTransmitting && activeRide && location) {
      startLocationTransmission();
    } else {
      stopLocationTransmission();
    }

    return () => stopLocationTransmission();
  }, [isTransmitting, activeRide, location]);

  const loadActiveRide = async () => {
    try {
      const response = await backend.driver.getActiveRide();
      setActiveRide(response.ride || null);
    } catch (error: any) {
      console.error("Failed to load active ride:", error);
    }
  };

  const startLocationTransmission = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const transmitLocation = async () => {
      if (!activeRide || !location) return;

      try {
        await backend.location.updateLocation({
          updates: [{
            rideId: activeRide.id,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            speed: location.coords.speed || undefined,
            heading: location.coords.heading || undefined,
          }],
        });

        setLastUpdate(new Date());
        setTransmissionCount(prev => prev + 1);
      } catch (error: any) {
        console.error("Failed to update location:", error);
        toast({
          title: "Location update failed",
          description: error.message || "Failed to transmit location",
          variant: "destructive",
        });
      }
    };

    // Initial transmission
    transmitLocation();

    // Set up 15-second interval
    intervalRef.current = setInterval(transmitLocation, 15000);
  };

  const stopLocationTransmission = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleToggleTransmission = () => {
    if (!isTransmitting) {
      if (!activeRide) {
        toast({
          title: "No active ride",
          description: "Start a ride first before transmitting location",
          variant: "destructive",
        });
        return;
      }
      startTracking();
      setIsTransmitting(true);
      setTransmissionCount(0);
      toast({ title: "Location transmission started" });
    } else {
      stopTracking();
      setIsTransmitting(false);
      setLastUpdate(null);
      toast({ title: "Location transmission stopped" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Location Transmission</h2>
        <p className="text-muted-foreground">Monitor and control GPS location sharing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Transmission Status
              <Badge variant={isTransmitting ? "default" : "secondary"}>
                {isTransmitting ? "Active" : "Inactive"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Real-time location broadcasting every 15 seconds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              {isTransmitting ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="font-medium">
                {isTransmitting ? "Broadcasting location" : "Not broadcasting"}
              </span>
            </div>

            {lastUpdate && (
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
              </div>
            )}

            {transmissionCount > 0 && (
              <div className="text-sm text-muted-foreground">
                Updates sent: {transmissionCount}
              </div>
            )}

            <Button
              onClick={handleToggleTransmission}
              disabled={!activeRide}
              className="w-full"
              variant={isTransmitting ? "destructive" : "default"}
            >
              {isTransmitting ? "Stop Transmission" : "Start Transmission"}
            </Button>

            {!activeRide && (
              <p className="text-sm text-muted-foreground text-center">
                Start a ride to enable location transmission
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Location</CardTitle>
            <CardDescription>GPS coordinates and accuracy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {location ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Position</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Latitude:</span>
                    <div className="font-mono">{location.coords.latitude.toFixed(6)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Longitude:</span>
                    <div className="font-mono">{location.coords.longitude.toFixed(6)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Accuracy:</span>
                    <div>{Math.round(location.coords.accuracy)}m</div>
                  </div>
                  {location.coords.speed !== null && (
                    <div>
                      <span className="text-muted-foreground">Speed:</span>
                      <div>{Math.round((location.coords.speed || 0) * 3.6)} km/h</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {isTracking ? "Getting location..." : "Location not available"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {activeRide && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Active Ride Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Route:</span>
                <div className="font-medium">{activeRide.routeName}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Started:</span>
                <div className="font-medium">{new Date(activeRide.startedAt).toLocaleTimeString()}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <div className="font-medium capitalize">{activeRide.status.replace('_', ' ')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

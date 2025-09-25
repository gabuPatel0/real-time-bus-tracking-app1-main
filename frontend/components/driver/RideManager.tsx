import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../../contexts/AuthContext";
import { Play, Square, Clock, MapPin } from "lucide-react";
import type { Route } from "~backend/driver/create_route";
import type { ActiveRide } from "~backend/driver/get_active_ride";

export default function RideManager() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const backend = useBackend();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [routesResponse, activeRideResponse] = await Promise.all([
        backend.driver.listRoutes(),
        backend.driver.getActiveRide(),
      ]);
      
      setRoutes(routesResponse.routes);
      setActiveRide(activeRideResponse.ride || null);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load ride data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRide = async () => {
    if (!selectedRouteId) return;
    
    setIsStarting(true);
    try {
      const ride = await backend.driver.startRide({ routeId: selectedRouteId });
      const route = routes.find(r => r.id === selectedRouteId);
      
      setActiveRide({
        id: ride.id,
        routeId: ride.routeId,
        routeName: route?.name || "Unknown Route",
        status: ride.status,
        startedAt: ride.startedAt,
      });
      
      setSelectedRouteId("");
      toast({ title: "Ride started successfully!" });
    } catch (error: any) {
      console.error("Failed to start ride:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start ride",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndRide = async () => {
    if (!activeRide) return;
    
    setIsEnding(true);
    try {
      await backend.driver.endRide({ rideId: activeRide.id });
      setActiveRide(null);
      toast({ title: "Ride ended successfully!" });
    } catch (error: any) {
      console.error("Failed to end ride:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to end ride",
        variant: "destructive",
      });
    } finally {
      setIsEnding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg">Loading ride information...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Ride Management</h2>
        <p className="text-muted-foreground">Start and manage your active rides</p>
      </div>

      {activeRide ? (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Active Ride
              <Badge variant="default" className="bg-green-600">
                In Progress
              </Badge>
            </CardTitle>
            <CardDescription>You have an active ride in progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Route:</span>
                <span>{activeRide.routeName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Started:</span>
                <span>{new Date(activeRide.startedAt).toLocaleString()}</span>
              </div>
            </div>
            <Button 
              onClick={handleEndRide} 
              disabled={isEnding}
              variant="destructive"
              className="w-full"
            >
              <Square className="h-4 w-4 mr-2" />
              {isEnding ? "Ending Ride..." : "End Ride"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Start New Ride</CardTitle>
            <CardDescription>Select a route to begin a new ride</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {routes.length > 0 ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Route</label>
                  <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a route to start" />
                    </SelectTrigger>
                    <SelectContent>
                      {routes.map((route) => (
                        <SelectItem key={route.id} value={route.id}>
                          <div>
                            <div className="font-medium">{route.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {route.startLocation} → {route.endLocation}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleStartRide} 
                  disabled={!selectedRouteId || isStarting}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isStarting ? "Starting Ride..." : "Start Ride"}
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No routes available</h3>
                <p className="text-muted-foreground">
                  Create a route first before starting a ride
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

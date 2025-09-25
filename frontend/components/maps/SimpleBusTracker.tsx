import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, RefreshCw, Navigation, Zap, AlertCircle } from "lucide-react";

interface BusLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

interface SimpleBusTrackerProps {
  rideId: string;
  initialLocation?: BusLocation;
  routeInfo: {
    routeName: string;
    startLocation: string;
    endLocation: string;
    driverName: string;
  };
  onLocationUpdate?: (location: BusLocation) => void;
}

const SimpleBusTracker: React.FC<SimpleBusTrackerProps> = ({
  rideId,
  initialLocation,
  routeInfo,
  onLocationUpdate
}) => {
  const [currentLocation, setCurrentLocation] = useState<BusLocation | undefined>(initialLocation);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to fetch latest location
  const fetchLatestLocation = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:4000/user/rides/${rideId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const rideData = await response.json();
        if (rideData.lastLocation) {
          const newLocation: BusLocation = {
            latitude: rideData.lastLocation.latitude,
            longitude: rideData.lastLocation.longitude,
            timestamp: rideData.lastLocation.timestamp,
            speed: rideData.lastLocation.speed,
            heading: rideData.lastLocation.heading
          };
          
          // Only update if location actually changed
          if (!currentLocation || 
              currentLocation.latitude !== newLocation.latitude || 
              currentLocation.longitude !== newLocation.longitude ||
              currentLocation.timestamp !== newLocation.timestamp) {
            setCurrentLocation(newLocation);
            setLastUpdateTime(new Date());
            onLocationUpdate?.(newLocation);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch latest location:', error);
    }
  }, [rideId, currentLocation, onLocationUpdate]);

  // Start live tracking
  const startLiveTracking = useCallback(() => {
    setIsLiveTracking(true);
    fetchLatestLocation(); // Fetch immediately
    
    // Set up interval for every 15 seconds
    intervalRef.current = setInterval(fetchLatestLocation, 15000);
  }, [fetchLatestLocation]);

  // Stop live tracking
  const stopLiveTracking = useCallback(() => {
    setIsLiveTracking(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Auto-start tracking when component mounts
  useEffect(() => {
    startLiveTracking();
    return () => stopLiveTracking();
  }, [startLiveTracking, stopLiveTracking]);

  // Update current location when initialLocation changes
  useEffect(() => {
    if (initialLocation) {
      setCurrentLocation(initialLocation);
    }
  }, [initialLocation]);

  // Generate Google Maps link
  const getGoogleMapsLink = (location: BusLocation) => {
    return `https://www.google.com/maps?q=${location.latitude},${location.longitude}&z=15`;
  };

  // Generate OpenStreetMap link
  const getOpenStreetMapLink = (location: BusLocation) => {
    return `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}&zoom=15`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Navigation className="h-5 w-5 mr-2 text-blue-600" />
            Live Bus Location
          </span>
          <div className="flex items-center space-x-2">
            {isLiveTracking && (
              <Badge variant="default" className="animate-pulse">
                <Zap className="h-3 w-3 mr-1" />
                Live
              </Badge>
            )}
            <Button
              size="sm"
              variant={isLiveTracking ? "destructive" : "default"}
              onClick={isLiveTracking ? stopLiveTracking : startLiveTracking}
            >
              {isLiveTracking ? "Stop" : "Start"} Tracking
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Real-time GPS tracking updates every 15 seconds
          {lastUpdateTime && (
            <span className="block text-xs text-green-600 mt-1">
              Last updated: {lastUpdateTime.toLocaleTimeString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentLocation ? (
          <div className="space-y-4">
            {/* Route Information */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-bold text-blue-800 mb-2">{routeInfo.routeName}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
                <p><strong>Driver:</strong> {routeInfo.driverName}</p>
                <p><strong>From:</strong> {routeInfo.startLocation}</p>
                <p><strong>To:</strong> {routeInfo.endLocation}</p>
                <p><strong>Last Update:</strong> {new Date(currentLocation.timestamp).toLocaleString()}</p>
              </div>
            </div>

            {/* Location Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-muted rounded-md">
                <h4 className="font-medium mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-green-600" />
                  GPS Coordinates
                </h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Latitude:</span>
                    <div className="font-mono text-lg">{currentLocation.latitude.toFixed(6)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Longitude:</span>
                    <div className="font-mono text-lg">{currentLocation.longitude.toFixed(6)}</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-md">
                <h4 className="font-medium mb-2 flex items-center">
                  <Navigation className="h-4 w-4 mr-2 text-blue-600" />
                  Movement Data
                </h4>
                <div className="space-y-1 text-sm">
                  {currentLocation.speed && (
                    <div>
                      <span className="text-muted-foreground">Speed:</span>
                      <div className="font-medium">{currentLocation.speed.toFixed(1)} km/h</div>
                    </div>
                  )}
                  {currentLocation.heading && (
                    <div>
                      <span className="text-muted-foreground">Heading:</span>
                      <div className="font-medium">{currentLocation.heading.toFixed(0)}°</div>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Updated:</span>
                    <div className="font-medium">{new Date(currentLocation.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Links */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h4 className="font-medium mb-3 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-red-600" />
                View on Map
              </h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(getGoogleMapsLink(currentLocation), '_blank')}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Google Maps
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(getOpenStreetMapLink(currentLocation), '_blank')}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  OpenStreetMap
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click to open the bus location in your preferred map application
              </p>
            </div>

            {/* Visual Location Indicator */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
                    <Navigation className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                </div>
              </div>
              <p className="text-center text-sm text-blue-700 mt-2 font-medium">
                Bus is currently at {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="relative">
              <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              {isLiveTracking && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                  <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
                </div>
              )}
            </div>
            <h3 className="text-lg font-medium mb-2">
              {isLiveTracking ? "Searching for bus location..." : "No location data available"}
            </h3>
            <p className="text-muted-foreground">
              {isLiveTracking 
                ? "Waiting for GPS data from the bus driver" 
                : "Start tracking to see real-time location updates"
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleBusTracker;

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, RefreshCw, Navigation, Zap } from "lucide-react";

interface BusLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

interface BusTrackingMapProps {
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

// Google Maps component
const MapComponent: React.FC<{
  center: google.maps.LatLngLiteral;
  zoom: number;
  busLocation?: BusLocation;
  routeInfo: any;
}> = ({ center, zoom, busLocation, routeInfo }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const [busMarker, setBusMarker] = useState<google.maps.Marker>();
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow>();

  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        center,
        zoom,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'transit',
            elementType: 'labels.icon',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });
      setMap(newMap);

      // Create info window
      const newInfoWindow = new window.google.maps.InfoWindow();
      setInfoWindow(newInfoWindow);
    }
  }, [ref, map, center, zoom]);

  // Update bus marker when location changes
  useEffect(() => {
    if (map && busLocation) {
      const position = {
        lat: busLocation.latitude,
        lng: busLocation.longitude
      };

      if (busMarker) {
        // Update existing marker
        busMarker.setPosition(position);
        busMarker.setTitle(`Bus Location - Updated: ${new Date(busLocation.timestamp).toLocaleTimeString()}`);
      } else {
        // Create new marker
        const marker = new window.google.maps.Marker({
          position,
          map,
          title: `Bus Location - Updated: ${new Date(busLocation.timestamp).toLocaleTimeString()}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="#2563eb" stroke="#ffffff" stroke-width="3"/>
                <path d="M8 12h16v8H8z" fill="#ffffff"/>
                <circle cx="12" cy="18" r="2" fill="#2563eb"/>
                <circle cx="20" cy="18" r="2" fill="#2563eb"/>
                <rect x="10" y="10" width="12" height="2" fill="#2563eb"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 16)
          },
          animation: window.google.maps.Animation.DROP
        });

        setBusMarker(marker);

        // Add click listener for info window
        marker.addListener('click', () => {
          if (infoWindow) {
            const content = `
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: bold;">${routeInfo.routeName}</h3>
                <p style="margin: 4px 0; color: #6b7280;"><strong>Driver:</strong> ${routeInfo.driverName}</p>
                <p style="margin: 4px 0; color: #6b7280;"><strong>From:</strong> ${routeInfo.startLocation}</p>
                <p style="margin: 4px 0; color: #6b7280;"><strong>To:</strong> ${routeInfo.endLocation}</p>
                <p style="margin: 4px 0; color: #6b7280;"><strong>Last Update:</strong> ${new Date(busLocation.timestamp).toLocaleString()}</p>
                ${busLocation.speed ? `<p style="margin: 4px 0; color: #6b7280;"><strong>Speed:</strong> ${busLocation.speed.toFixed(1)} km/h</p>` : ''}
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">Lat: ${busLocation.latitude.toFixed(6)}, Lng: ${busLocation.longitude.toFixed(6)}</p>
              </div>
            `;
            infoWindow.setContent(content);
            infoWindow.open(map, marker);
          }
        });
      }

      // Center map on bus location
      map.panTo(position);
    }
  }, [map, busLocation, busMarker, infoWindow, routeInfo]);

  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
};

// Loading component
const MapLoadingComponent: React.FC = () => (
  <div className="w-full h-96 bg-muted rounded-md flex items-center justify-center">
    <div className="text-center">
      <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
      <p className="text-muted-foreground">Loading Google Maps...</p>
    </div>
  </div>
);

// Error component
const MapErrorComponent: React.FC<{ status: Status }> = ({ status }) => (
  <div className="w-full h-96 bg-red-50 border border-red-200 rounded-md flex items-center justify-center">
    <div className="text-center">
      <MapPin className="h-8 w-8 text-red-500 mx-auto mb-2" />
      <p className="text-red-700 font-medium">Failed to load Google Maps</p>
      <p className="text-red-600 text-sm">Status: {status}</p>
      <p className="text-red-600 text-sm mt-2">Please check your Google Maps API key</p>
    </div>
  </div>
);

const BusTrackingMap: React.FC<BusTrackingMapProps> = ({
  rideId,
  initialLocation,
  routeInfo,
  onLocationUpdate
}) => {
  const [currentLocation, setCurrentLocation] = useState<BusLocation | undefined>(initialLocation);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Default center (you can adjust this based on your city)
  const defaultCenter = { lat: 40.7128, lng: -74.0060 }; // New York City
  const mapCenter = currentLocation 
    ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
    : defaultCenter;

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
      intervalRef.current = undefined;
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

  const render = (status: Status) => {
    switch (status) {
      case Status.LOADING:
        return <MapLoadingComponent />;
      case Status.FAILURE:
        return <MapErrorComponent status={status} />;
      case Status.SUCCESS:
        return (
          <MapComponent
            center={mapCenter}
            zoom={15}
            busLocation={currentLocation}
            routeInfo={routeInfo}
          />
        );
    }
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
        <div className="w-full h-96 rounded-md overflow-hidden">
          <Wrapper
            apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}
            render={render}
            libraries={['geometry', 'places']}
          />
        </div>
        
        {currentLocation && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Coordinates:</span>
                <div className="font-mono">
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Last Update:</span>
                <div>{new Date(currentLocation.timestamp).toLocaleString()}</div>
              </div>
              {currentLocation.speed && (
                <div>
                  <span className="text-muted-foreground">Speed:</span>
                  <div>{currentLocation.speed.toFixed(1)} km/h</div>
                </div>
              )}
              {currentLocation.heading && (
                <div>
                  <span className="text-muted-foreground">Heading:</span>
                  <div>{currentLocation.heading.toFixed(0)}°</div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BusTrackingMap;

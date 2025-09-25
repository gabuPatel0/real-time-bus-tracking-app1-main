import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, RefreshCw, Navigation, Zap, AlertCircle } from "lucide-react";
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface BusLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

interface LeafletBusMapProps {
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

// Custom bus icon
const createBusIcon = () => {
  const busIconSvg = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" fill="#2563eb" stroke="#ffffff" stroke-width="3"/>
      <path d="M8 12h16v8H8z" fill="#ffffff"/>
      <circle cx="12" cy="18" r="2" fill="#2563eb"/>
      <circle cx="20" cy="18" r="2" fill="#2563eb"/>
      <rect x="10" y="10" width="12" height="2" fill="#2563eb"/>
    </svg>
  `;

  return L.divIcon({
    html: busIconSvg,
    className: 'custom-bus-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

// Component to handle map updates
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
};

const LeafletBusMap: React.FC<LeafletBusMapProps> = ({
  rideId,
  initialLocation,
  routeInfo,
  onLocationUpdate
}) => {
  const [currentLocation, setCurrentLocation] = useState<BusLocation | undefined>(initialLocation);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Default center (you can adjust this based on your city)
  const defaultCenter: [number, number] = [40.7128, -74.0060]; // New York City
  const mapCenter: [number, number] = currentLocation 
    ? [currentLocation.latitude, currentLocation.longitude]
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
        <div className="w-full h-96 rounded-md overflow-hidden border">
          <MapContainer
            center={mapCenter}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            className="leaflet-container"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapUpdater center={mapCenter} zoom={15} />
            
            {currentLocation && (
              <Marker
                position={[currentLocation.latitude, currentLocation.longitude]}
                icon={createBusIcon()}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-bold text-gray-800 mb-2">{routeInfo.routeName}</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Driver:</strong> {routeInfo.driverName}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>From:</strong> {routeInfo.startLocation}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>To:</strong> {routeInfo.endLocation}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Last Update:</strong> {new Date(currentLocation.timestamp).toLocaleString()}
                    </p>
                    {currentLocation.speed && (
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Speed:</strong> {currentLocation.speed.toFixed(1)} km/h
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Lat: {currentLocation.latitude.toFixed(6)}, Lng: {currentLocation.longitude.toFixed(6)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
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

export default LeafletBusMap;

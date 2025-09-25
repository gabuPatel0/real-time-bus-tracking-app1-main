import React, { useEffect, useRef, useState, useCallback } from 'react';
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

interface EmbeddedBusMapProps {
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

// Declare Leaflet types
declare global {
  interface Window {
    L: any;
  }
}

const EmbeddedBusMap: React.FC<EmbeddedBusMapProps> = ({
  rideId,
  initialLocation,
  routeInfo,
  onLocationUpdate
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<BusLocation | undefined>(initialLocation);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Default center (you can adjust this based on your city)
  const defaultCenter = [40.7128, -74.0060]; // New York City

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      if (window.L) {
        setIsMapLoaded(true);
        return;
      }

      // Load Leaflet CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      cssLink.crossOrigin = '';
      document.head.appendChild(cssLink);

      // Load Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      
      script.onload = () => {
        setIsMapLoaded(true);
      };
      
      document.head.appendChild(script);
    };

    loadLeaflet();
  }, []);

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (isMapLoaded && mapRef.current && !map) {
      const mapCenter = currentLocation 
        ? [currentLocation.latitude, currentLocation.longitude]
        : defaultCenter;

      const newMap = window.L.map(mapRef.current).setView(mapCenter, 15);

      // Add OpenStreetMap tiles
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(newMap);

      setMap(newMap);
    }
  }, [isMapLoaded, map, currentLocation]);

  // Create custom bus icon
  const createBusIcon = useCallback(() => {
    if (!window.L) return null;

    const busIconHtml = `
      <div style="
        width: 32px; 
        height: 32px; 
        background: #2563eb; 
        border: 3px solid white; 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M4 6h16v10H4z"/>
          <circle cx="8" cy="18" r="2"/>
          <circle cx="16" cy="18" r="2"/>
          <path d="M6 4h12v2H6z"/>
        </svg>
      </div>
    `;

    return window.L.divIcon({
      html: busIconHtml,
      className: 'custom-bus-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  }, []);

  // Update marker when location changes
  useEffect(() => {
    if (map && currentLocation && window.L) {
      const position = [currentLocation.latitude, currentLocation.longitude];

      if (marker) {
        // Update existing marker
        marker.setLatLng(position);
      } else {
        // Create new marker
        const busIcon = createBusIcon();
        const newMarker = window.L.marker(position, { icon: busIcon }).addTo(map);

        // Create popup content
        const popupContent = `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: bold;">${routeInfo.routeName}</h3>
            <p style="margin: 4px 0; color: #6b7280;"><strong>Driver:</strong> ${routeInfo.driverName}</p>
            <p style="margin: 4px 0; color: #6b7280;"><strong>From:</strong> ${routeInfo.startLocation}</p>
            <p style="margin: 4px 0; color: #6b7280;"><strong>To:</strong> ${routeInfo.endLocation}</p>
            <p style="margin: 4px 0; color: #6b7280;"><strong>Last Update:</strong> ${new Date(currentLocation.timestamp).toLocaleString()}</p>
            ${currentLocation.speed ? `<p style="margin: 4px 0; color: #6b7280;"><strong>Speed:</strong> ${currentLocation.speed.toFixed(1)} km/h</p>` : ''}
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;">Lat: ${currentLocation.latitude.toFixed(6)}, Lng: ${currentLocation.longitude.toFixed(6)}</p>
          </div>
        `;

        newMarker.bindPopup(popupContent);
        setMarker(newMarker);
      }

      // Center map on bus location
      map.setView(position, 15);
    }
  }, [map, currentLocation, marker, routeInfo, createBusIcon]);

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
    if (isMapLoaded) {
      startLiveTracking();
    }
    return () => stopLiveTracking();
  }, [isMapLoaded, startLiveTracking, stopLiveTracking]);

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
              disabled={!isMapLoaded}
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
          {!isMapLoaded ? (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
                <p className="text-muted-foreground">Loading map...</p>
              </div>
            </div>
          ) : (
            <div ref={mapRef} className="w-full h-full" />
          )}
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

export default EmbeddedBusMap;

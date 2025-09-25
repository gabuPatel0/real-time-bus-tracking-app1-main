import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../../contexts/AuthContext";
import { Search, MapPin, Clock, User, Bus, Filter, RefreshCw } from "lucide-react";

// Define types for our route data
interface ActiveRide {
  id: string;
  startedAt: string | Date;
}

interface RouteWithActiveRides {
  id: string;
  name: string;
  description?: string;
  startLocation: string;
  endLocation: string;
  estimatedDurationMinutes?: number;
  driverName: string;
  activeRides: ActiveRide[];
}

export default function RouteSearch() {
  const [routes, setRoutes] = useState<RouteWithActiveRides[]>([]);
  const [allRoutes, setAllRoutes] = useState<RouteWithActiveRides[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [filterBy, setFilterBy] = useState<string>("all");
  const [searchData, setSearchData] = useState({
    query: "",
    startLocation: "",
    endLocation: "",
  });
  const backend = useBackend();
  const { toast } = useToast();

  // Load all routes on component mount
  useEffect(() => {
    loadAllRoutes();
  }, []);

  const loadAllRoutes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/routes/search', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      setAllRoutes(data.routes || []);
      setRoutes(data.routes || []);
    } catch (error) {
      console.error("Failed to load routes:", error);
      toast({
        title: "Error",
        description: "Failed to load routes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const params: any = {};
      if (searchData.query.trim()) params.query = searchData.query.trim();
      if (searchData.startLocation.trim()) params.startLocation = searchData.startLocation.trim();
      if (searchData.endLocation.trim()) params.endLocation = searchData.endLocation.trim();

      const response = await backend.user.searchRoutes(params);
      setRoutes(response.routes);

      if (response.routes.length === 0) {
        toast({
          title: "No routes found",
          description: "Try adjusting your search criteria",
        });
      }
    } catch (error: any) {
      console.error("Search failed:", error);
      toast({
        title: "Search failed",
        description: error.message || "Failed to search routes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackRide = (rideId: string) => {
    // This would typically navigate to the tracking view or open a modal
    toast({
      title: "Tracking feature",
      description: `Would track ride ${rideId}. Switch to the Track Ride tab to implement full tracking.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Find Bus Routes</h2>
        <p className="text-muted-foreground">Search for active bus routes in your area</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Routes</CardTitle>
          <CardDescription>Find buses by route name, start location, or destination</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="query">Route Name</Label>
                <Input
                  id="query"
                  placeholder="e.g., Downtown Express"
                  value={searchData.query}
                  onChange={(e) => setSearchData({ ...searchData, query: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start">From</Label>
                <Input
                  id="start"
                  placeholder="e.g., Central Station"
                  value={searchData.startLocation}
                  onChange={(e) => setSearchData({ ...searchData, startLocation: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">To</Label>
                <Input
                  id="end"
                  placeholder="e.g., Airport Terminal"
                  value={searchData.endLocation}
                  onChange={(e) => setSearchData({ ...searchData, endLocation: e.target.value })}
                />
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? "Searching..." : "Search Routes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {routes.map((route) => (
          <Card key={route.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {route.name}
                <Badge variant="secondary">
                  {route.activeRides.length} Active
                </Badge>
              </CardTitle>
              {route.description && (
                <CardDescription>{route.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="font-medium">From:</span>
                  <span>{route.startLocation}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <span className="font-medium">To:</span>
                  <span>{route.endLocation}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Driver:</span>
                  <span>{route.driverName}</span>
                </div>
                {route.estimatedDurationMinutes && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Duration:</span>
                    <span>{route.estimatedDurationMinutes} min</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Active Rides</h4>
                {route.activeRides.map((ride) => (
                  <div key={ride.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div className="flex items-center space-x-2 text-sm">
                      <Bus className="h-4 w-4" />
                      <span>Started: {new Date(ride.startedAt).toLocaleTimeString()}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTrackRide(ride.id)}
                    >
                      Track
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {routes.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No results yet</h3>
            <p className="text-muted-foreground">
              Use the search form above to find active bus routes
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../../contexts/AuthContext";
import { userAPI } from "../../lib/api";
import { Search, MapPin, Clock, User, Bus, Filter, RefreshCw, Navigation, Copy } from "lucide-react";

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

export default function EnhancedRouteSearch() {
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

  // Filter routes when selectedRoute or filterBy changes
  useEffect(() => {
    filterRoutes();
  }, [selectedRoute, filterBy, allRoutes]);

  const loadAllRoutes = async () => {
    setIsLoading(true);
    try {
      const data = await userAPI.searchRoutes();
      setAllRoutes(data.routes || []);
    } catch (error) {
      console.error("Failed to load routes:", error);
      toast({
        title: "Error",
        description: "Failed to load routes. Make sure the backend server is running on port 4000.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterRoutes = () => {
    let filtered = [...allRoutes];

    // Filter by selected route
    if (selectedRoute && selectedRoute !== "all") {
      filtered = filtered.filter(route => route.id === selectedRoute);
    }

    // Filter by criteria
    if (filterBy === "most-active") {
      filtered = filtered.sort((a, b) => b.activeRides.length - a.activeRides.length);
    } else if (filterBy === "shortest") {
      filtered = filtered.sort((a, b) => 
        (a.estimatedDurationMinutes || 999) - (b.estimatedDurationMinutes || 999)
      );
    } else if (filterBy === "recent") {
      filtered = filtered.sort((a, b) => {
        const aLatest = Math.max(...a.activeRides.map(r => new Date(r.startedAt).getTime()));
        const bLatest = Math.max(...b.activeRides.map(r => new Date(r.startedAt).getTime()));
        return bLatest - aLatest;
      });
    }

    setRoutes(filtered);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const params: any = {};
      if (searchData.query.trim()) params.query = searchData.query.trim();
      if (searchData.startLocation.trim()) params.startLocation = searchData.startLocation.trim();
      if (searchData.endLocation.trim()) params.endLocation = searchData.endLocation.trim();

      const data = await userAPI.searchRoutes(params);
      setAllRoutes(data.routes || []);

      if (data.routes.length === 0) {
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

  const handleTrackRide = async (rideId: string) => {
    try {
      // Copy ride ID to clipboard
      await navigator.clipboard.writeText(rideId);
      
      toast({
        title: "Ride ID Copied!",
        description: `Ride ID ${rideId} has been copied to clipboard. Switch to the Track Ride tab to track this bus.`,
      });
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = rideId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Ride ID Copied!",
        description: `Ride ID ${rideId} has been copied to clipboard. Switch to the Track Ride tab to track this bus.`,
      });
    }
  };

  const clearSearch = () => {
    setSearchData({ query: "", startLocation: "", endLocation: "" });
    setSelectedRoute("");
    setFilterBy("all");
    loadAllRoutes();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Find Active Bus Routes</h2>
        <p className="text-muted-foreground">Search and filter active bus routes in your area</p>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Search & Filter Routes</span>
            <Button variant="outline" size="sm" onClick={loadAllRoutes} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>Find buses by route name, location, or use filters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Form */}
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
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isLoading}>
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? "Searching..." : "Search Routes"}
              </Button>
              <Button type="button" variant="outline" onClick={clearSearch}>
                Clear
              </Button>
            </div>
          </form>

          {/* Filter Controls */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select Specific Route</Label>
                <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                  <SelectTrigger>
                    <SelectValue placeholder="All routes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All routes</SelectItem>
                    {allRoutes.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.name} ({route.activeRides.length} active)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Default order</SelectItem>
                    <SelectItem value="most-active">Most active rides</SelectItem>
                    <SelectItem value="shortest">Shortest duration</SelectItem>
                    <SelectItem value="recent">Most recent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {routes.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {routes.length} route{routes.length !== 1 ? 's' : ''} with{' '}
            {routes.reduce((sum, route) => sum + route.activeRides.length, 0)} active ride{routes.reduce((sum, route) => sum + route.activeRides.length, 0) !== 1 ? 's' : ''}
          </p>
          <Badge variant="secondary">
            <Filter className="h-3 w-3 mr-1" />
            {filterBy === "all" ? "No filter" : filterBy.replace("-", " ")}
          </Badge>
        </div>
      )}

      {/* Route Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {routes.map((route) => (
          <Card key={route.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Navigation className="h-5 w-5 mr-2 text-blue-600" />
                  {route.name}
                </span>
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
                      <Copy className="h-3 w-3 mr-1" />
                      Copy ID
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {routes.length === 0 && !isLoading && (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No active routes found</h3>
            <p className="text-muted-foreground mb-4">
              {allRoutes.length === 0 
                ? "No routes are currently active. Try refreshing or check back later."
                : "Try adjusting your search criteria or filters to find routes."
              }
            </p>
            <Button variant="outline" onClick={loadAllRoutes}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Routes
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

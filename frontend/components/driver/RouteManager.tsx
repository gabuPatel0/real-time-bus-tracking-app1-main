import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useBackend } from "../../contexts/AuthContext";
import { Plus, MapPin, Clock } from "lucide-react";
import type { Route } from "~backend/driver/create_route";

export default function RouteManager() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startLocation: "",
    endLocation: "",
    estimatedDurationMinutes: "",
  });
  const backend = useBackend();
  const { toast } = useToast();

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      const response = await backend.driver.listRoutes();
      setRoutes(response.routes);
    } catch (error: any) {
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

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const route = await backend.driver.createRoute({
        name: formData.name,
        description: formData.description || undefined,
        startLocation: formData.startLocation,
        endLocation: formData.endLocation,
        estimatedDurationMinutes: formData.estimatedDurationMinutes 
          ? parseInt(formData.estimatedDurationMinutes) 
          : undefined,
      });

      setRoutes([route, ...routes]);
      setFormData({
        name: "",
        description: "",
        startLocation: "",
        endLocation: "",
        estimatedDurationMinutes: "",
      });
      setShowCreateForm(false);
      toast({ title: "Route created successfully!" });
    } catch (error: any) {
      console.error("Failed to create route:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create route",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg">Loading routes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Routes</h2>
          <p className="text-muted-foreground">Manage your bus routes</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Route
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Route</CardTitle>
            <CardDescription>Add a new bus route to your collection</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRoute} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Route Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Downtown Express"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Estimated Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="e.g., 45"
                    value={formData.estimatedDurationMinutes}
                    onChange={(e) => setFormData({ ...formData, estimatedDurationMinutes: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Start Location</Label>
                  <Input
                    id="start"
                    placeholder="e.g., Central Station"
                    value={formData.startLocation}
                    onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">End Location</Label>
                  <Input
                    id="end"
                    placeholder="e.g., Airport Terminal"
                    value={formData.endLocation}
                    onChange={(e) => setFormData({ ...formData, endLocation: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Additional details about the route..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Route"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.map((route) => (
          <Card key={route.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {route.name}
                <Badge variant="secondary">Route</Badge>
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
                {route.estimatedDurationMinutes && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Duration:</span>
                    <span>{route.estimatedDurationMinutes} min</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {routes.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No routes yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first route to get started with bus tracking
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Route
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

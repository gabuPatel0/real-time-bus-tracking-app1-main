import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../../contexts/AuthContext";
import { Bus, LogOut, Route, Play } from "lucide-react";
import RouteManager from "./RouteManager";
import RideManager from "./RideManager";
import LocationTransmitter from "./LocationTransmitter";

export default function DriverDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bus className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">Driver Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, {user?.name}</p>
              </div>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="routes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="routes" className="flex items-center space-x-2">
              <Route className="h-4 w-4" />
              <span>Routes</span>
            </TabsTrigger>
            <TabsTrigger value="rides" className="flex items-center space-x-2">
              <Play className="h-4 w-4" />
              <span>Active Ride</span>
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center space-x-2">
              <Bus className="h-4 w-4" />
              <span>Location</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="routes" className="space-y-6">
            <RouteManager />
          </TabsContent>

          <TabsContent value="rides" className="space-y-6">
            <RideManager />
          </TabsContent>

          <TabsContent value="location" className="space-y-6">
            <LocationTransmitter />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

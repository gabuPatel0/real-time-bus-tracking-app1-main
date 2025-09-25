import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../../contexts/AuthContext";
import { Bus, LogOut, Search, MapPin } from "lucide-react";
import EnhancedRouteSearch from "./EnhancedRouteSearch";
import RideTracker from "./RideTracker";

export default function UserDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bus className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">BusTrack</h1>
                <p className="text-muted-foreground">Welcome, {user?.name}</p>
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
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Find Buses</span>
            </TabsTrigger>
            <TabsTrigger value="track" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Track Ride</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <EnhancedRouteSearch />
          </TabsContent>

          <TabsContent value="track" className="space-y-6">
            <RideTracker />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

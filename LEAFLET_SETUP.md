# Leaflet Maps Integration Setup Guide

## 🗺️ **Real-Time Bus Tracking with Leaflet Maps**

This guide covers the Leaflet Maps integration for real-time bus location tracking in your bus tracking application.

## 📋 **Why Leaflet Instead of Google Maps?**

- ✅ **Free and Open Source** - No API keys or usage limits
- ✅ **Lightweight** - Smaller bundle size
- ✅ **OpenStreetMap** - Community-driven map data
- ✅ **No Billing** - Completely free to use
- ✅ **Privacy-Friendly** - No tracking by Google

## 🚀 **Features Implemented**

### **Real-Time Tracking**
- ✅ **Auto-refresh every 15 seconds**
- ✅ **Immediate location updates**
- ✅ **Live tracking toggle**
- ✅ **Custom bus marker icon**
- ✅ **Interactive popups with ride details**

### **Copy Ride ID Feature**
- ✅ **Click "Copy ID" button** to copy ride ID to clipboard
- ✅ **Toast notification** confirms successful copy
- ✅ **Fallback support** for older browsers
- ✅ **Easy tracking workflow** - copy ID, switch to Track tab, paste ID

### **Map Features**
- ✅ **Interactive Leaflet Maps**
- ✅ **OpenStreetMap tiles**
- ✅ **Auto-centering on bus location**
- ✅ **Custom bus icon with SVG**
- ✅ **Click-to-view ride information**
- ✅ **Coordinate display**
- ✅ **Speed and heading data (if available)**

## 📦 **Dependencies Added**

```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8"
  }
}
```

## 🔧 **Installation**

```bash
cd frontend
npm install leaflet react-leaflet
npm install -D @types/leaflet

# or with bun
bun add leaflet react-leaflet
bun add -D @types/leaflet
```

## 🎯 **How It Works**

### **1. Leaflet Map Component**
```typescript
// LeafletBusMap.tsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const createBusIcon = () => {
  return L.divIcon({
    html: busIconSvg,
    className: 'custom-bus-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};
```

### **2. Real-Time Location Updates**
```typescript
// Fetches latest location every 15 seconds
const fetchLatestLocation = useCallback(async () => {
  const response = await fetch(`/user/rides/${rideId}`);
  const rideData = await response.json();
  
  if (rideData.lastLocation) {
    updateMapMarker(rideData.lastLocation);
  }
}, [rideId]);

// Auto-start tracking with 15-second intervals
useEffect(() => {
  const interval = setInterval(fetchLatestLocation, 15000);
  return () => clearInterval(interval);
}, [fetchLatestLocation]);
```

### **3. Copy Ride ID Functionality**
```typescript
const handleTrackRide = async (rideId: string) => {
  try {
    // Copy to clipboard using modern API
    await navigator.clipboard.writeText(rideId);
    
    toast({
      title: "Ride ID Copied!",
      description: `Ride ID ${rideId} has been copied to clipboard.`
    });
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = rideId;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
};
```

## 📱 **User Workflow**

### **For Users - Finding and Tracking Buses:**

1. **Search for Routes**
   - Go to "Find Buses" tab
   - Search by route name, start/end location
   - Use dropdown filters to find specific routes

2. **Copy Ride ID**
   - Click "Copy ID" button next to any active ride
   - Toast notification confirms the ID is copied

3. **Track the Bus**
   - Switch to "Track Ride" tab
   - Paste the copied ride ID
   - Click "Start Tracking"
   - Map loads with real-time bus location

4. **Real-Time Tracking**
   - Bus location updates every 15 seconds
   - Click bus marker for detailed information
   - Live badge shows tracking status

## 🎨 **Custom Bus Icon**

The custom bus icon is created using SVG:

```typescript
const busIconSvg = `
  <svg width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="12" fill="#2563eb" stroke="#ffffff" stroke-width="3"/>
    <path d="M8 12h16v8H8z" fill="#ffffff"/>
    <circle cx="12" cy="18" r="2" fill="#2563eb"/>
    <circle cx="20" cy="18" r="2" fill="#2563eb"/>
    <rect x="10" y="10" width="12" height="2" fill="#2563eb"/>
  </svg>
`;
```

## 🔧 **Testing the Integration**

### **1. Start the Backend**
```bash
cd backend
bun run dev
```

### **2. Start the Frontend**
```bash
cd frontend
npm run dev
```

### **3. Test the Features**

**Route Search & Copy:**
1. Login as a user
2. Go to "Find Buses" tab
3. Search for routes
4. Click "Copy ID" on any active ride
5. Verify toast notification appears

**Real-Time Tracking:**
1. Switch to "Track Ride" tab
2. Paste the copied ride ID
3. Click "Start Tracking"
4. Verify map loads with bus location
5. Check that location updates every 15 seconds

## 🎯 **Key Improvements Over Google Maps**

### **Cost & Licensing**
- ✅ **No API keys required**
- ✅ **No usage limits or billing**
- ✅ **Open source and free**

### **Performance**
- ✅ **Smaller bundle size**
- ✅ **Faster loading**
- ✅ **No external API dependencies**

### **Privacy**
- ✅ **No tracking by third parties**
- ✅ **GDPR compliant**
- ✅ **User data stays private**

### **Customization**
- ✅ **Full control over styling**
- ✅ **Custom markers and popups**
- ✅ **Flexible tile providers**

## 🛠️ **Customization Options**

### **Different Map Styles**
```typescript
// Satellite view
<TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />

// Dark theme
<TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

// Terrain
<TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" />
```

### **Custom Markers**
```typescript
const customIcon = L.icon({
  iconUrl: '/path/to/custom-icon.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});
```

## 🚨 **Troubleshooting**

### **Map Not Loading**
1. Check that Leaflet CSS is imported
2. Verify container has proper height/width
3. Check browser console for errors

### **Markers Not Appearing**
1. Ensure coordinates are valid
2. Check that marker icons are properly configured
3. Verify data is being fetched correctly

### **Copy Function Not Working**
1. Check if browser supports clipboard API
2. Verify HTTPS connection (required for clipboard API)
3. Fallback method should work in all browsers

## 📊 **Performance Monitoring**

### **Update Frequency**
- 15-second intervals for location updates
- Only updates when location actually changes
- Automatic cleanup when component unmounts

### **Memory Management**
- Proper cleanup of intervals
- Map instance disposal
- Event listener removal

## 🎉 **Summary**

Your bus tracking app now features:

1. **Leaflet Maps Integration** - Free, open-source mapping
2. **Real-Time Tracking** - 15-second location updates
3. **Copy Ride ID Feature** - Easy workflow for users
4. **Custom Bus Icons** - Professional appearance
5. **Interactive Popups** - Detailed ride information
6. **No API Keys Required** - Completely free to use

The integration provides a professional, cost-effective alternative to Google Maps while maintaining all the functionality users expect from a modern tracking application!

---

## 🔗 **Useful Links**

- [Leaflet Documentation](https://leafletjs.com/)
- [React Leaflet Documentation](https://react-leaflet.js.org/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Alternative Tile Providers](https://leaflet-extras.github.io/leaflet-providers/preview/)

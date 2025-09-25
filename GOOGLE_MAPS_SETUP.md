# Google Maps Integration Setup Guide

## 🗺️ **Real-Time Bus Tracking with Google Maps**

This guide will help you set up Google Maps integration for real-time bus location tracking in your bus tracking application.

## 📋 **Prerequisites**

1. **Google Cloud Platform Account**
2. **Google Maps API Key**
3. **Enabled APIs**

## 🚀 **Step-by-Step Setup**

### **1. Create Google Cloud Project**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### **2. Enable Required APIs**

Enable the following APIs in your Google Cloud Console:

```
- Maps JavaScript API
- Places API (optional, for enhanced features)
- Geocoding API (optional, for address lookup)
```

**How to enable:**
1. Go to "APIs & Services" > "Library"
2. Search for each API
3. Click "Enable" for each one

### **3. Create API Key**

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. **Important:** Restrict the API key for security:
   - Click on the API key to edit
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domain (e.g., `localhost:5173/*` for development)
   - Under "API restrictions", select "Restrict key"
   - Choose the APIs you enabled above

### **4. Configure Environment Variables**

Update your `frontend/.env` file:

```env
# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here

# Backend API URL
VITE_API_URL=http://localhost:4000
```

### **5. Install Dependencies**

```bash
cd frontend
npm install
# or
bun install
```

## 🎯 **Features Implemented**

### **Real-Time Tracking**
- ✅ **Auto-refresh every 15 seconds**
- ✅ **Immediate location updates**
- ✅ **Live tracking toggle**
- ✅ **Custom bus marker icon**
- ✅ **Info window with ride details**

### **Map Features**
- ✅ **Interactive Google Maps**
- ✅ **Auto-centering on bus location**
- ✅ **Custom bus icon with animation**
- ✅ **Click-to-view ride information**
- ✅ **Coordinate display**
- ✅ **Speed and heading data (if available)**

### **Error Handling**
- ✅ **API key validation**
- ✅ **Map loading states**
- ✅ **Connection error handling**
- ✅ **Graceful fallbacks**

## 🔧 **How It Works**

### **1. Location Updates**
```typescript
// Fetches latest location every 15 seconds
const fetchLatestLocation = async () => {
  const response = await fetch(`/user/rides/${rideId}`);
  const rideData = await response.json();
  
  if (rideData.lastLocation) {
    updateMapMarker(rideData.lastLocation);
  }
};
```

### **2. Map Integration**
```typescript
// Creates map with custom bus marker
const busIcon = {
  url: 'data:image/svg+xml;charset=UTF-8,' + busIconSVG,
  scaledSize: new google.maps.Size(32, 32),
  anchor: new google.maps.Point(16, 16)
};

const marker = new google.maps.Marker({
  position: { lat, lng },
  map,
  icon: busIcon,
  animation: google.maps.Animation.DROP
});
```

### **3. Real-Time Updates**
```typescript
// Auto-start tracking with 15-second intervals
useEffect(() => {
  const interval = setInterval(fetchLatestLocation, 15000);
  return () => clearInterval(interval);
}, []);
```

## 📱 **Usage**

### **For Users:**
1. Go to "Track Ride" tab
2. Enter a valid ride ID
3. Map automatically loads and starts tracking
4. Bus location updates every 15 seconds
5. Click on bus marker for detailed information

### **For Drivers:**
- Location updates are automatically sent to the database
- Users can track the bus in real-time
- No additional action required from drivers

## 🛠️ **Testing**

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

### **3. Test the Map**
1. Login as a user
2. Go to "Track Ride" tab
3. Enter a ride ID from an active ride
4. Verify map loads and shows bus location
5. Check that location updates every 15 seconds

## 🔒 **Security Best Practices**

### **API Key Security**
- ✅ **Restrict API key to specific domains**
- ✅ **Limit API access to required services only**
- ✅ **Use environment variables (never commit keys)**
- ✅ **Monitor API usage in Google Cloud Console**

### **Rate Limiting**
- ✅ **15-second update intervals (not too frequent)**
- ✅ **Only fetch when tracking is active**
- ✅ **Stop tracking when component unmounts**

## 🚨 **Troubleshooting**

### **Map Not Loading**
1. Check API key in `.env` file
2. Verify APIs are enabled in Google Cloud Console
3. Check browser console for errors
4. Ensure domain is whitelisted for API key

### **Location Not Updating**
1. Verify backend is running on port 4000
2. Check that ride ID is valid and active
3. Ensure location data exists in database
4. Check network connectivity

### **Performance Issues**
1. Reduce update frequency if needed
2. Check API quota limits in Google Cloud Console
3. Optimize marker updates (only when location changes)

## 💰 **Cost Considerations**

### **Google Maps Pricing**
- Maps JavaScript API: $7 per 1,000 requests
- First 28,000 requests per month are free
- Monitor usage in Google Cloud Console

### **Optimization Tips**
- ✅ **Only update when location actually changes**
- ✅ **Stop tracking when not needed**
- ✅ **Use reasonable update intervals (15 seconds)**
- ✅ **Implement proper cleanup on component unmount**

## 📊 **Monitoring**

### **Google Cloud Console**
- Monitor API usage and costs
- Set up billing alerts
- Check for API errors

### **Application Monitoring**
- Track update frequency
- Monitor failed requests
- Log location update success/failure

---

## 🎉 **You're All Set!**

Your real-time bus tracking with Google Maps is now ready! Users can track buses in real-time with automatic location updates every 15 seconds.

For support or questions, check the troubleshooting section above or refer to the [Google Maps JavaScript API documentation](https://developers.google.com/maps/documentation/javascript).

// API configuration and utilities
// Use environment variable for tunneled backend URL, fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 
                     import.meta.env.VITE_BACKEND_URL || 
                     'http://localhost:4000';

// Helper function to make authenticated API calls
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken');
  
  const config: RequestInit = {
    ...options,
    mode: 'cors',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  console.log(`Making API call to: ${API_BASE_URL}${endpoint}`);
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error: ${response.status} - ${errorText}`);
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  
  return response.json();
};

// Specific API functions
export const userAPI = {
  searchRoutes: async (params?: { query?: string; startLocation?: string; endLocation?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.append('query', params.query);
    if (params?.startLocation) searchParams.append('startLocation', params.startLocation);
    if (params?.endLocation) searchParams.append('endLocation', params.endLocation);
    
    const endpoint = `/user/routes/search${searchParams.toString() ? `?${searchParams}` : ''}`;
    return apiCall(endpoint);
  },
  
  getRideDetails: async (rideId: string) => {
    return apiCall(`/user/rides/${rideId}`);
  }
};

export const driverAPI = {
  createRoute: async (routeData: any) => {
    return apiCall('/driver/routes', {
      method: 'POST',
      body: JSON.stringify(routeData),
    });
  },
  
  getRoutes: async () => {
    return apiCall('/driver/routes');
  },
  
  startRide: async (routeId: string) => {
    return apiCall('/driver/rides/start', {
      method: 'POST',
      body: JSON.stringify({ routeId }),
    });
  },
  
  endRide: async (rideId: string) => {
    return apiCall('/driver/rides/end', {
      method: 'POST',
      body: JSON.stringify({ rideId }),
    });
  },
  
  getActiveRide: async () => {
    return apiCall('/driver/rides/active');
  }
};

export const authAPI = {
  login: async (email: string, password: string) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  
  signup: async (userData: any) => {
    return apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  me: async () => {
    return apiCall('/auth/me');
  }
};

export const locationAPI = {
  updateLocation: async (updates: any[]) => {
    return apiCall('/location/update', {
      method: 'POST',
      body: JSON.stringify({ updates }),
    });
  }
};

-- Users table with role-based access
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role ENUM('driver', 'user') NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Routes table for bus routes
CREATE TABLE routes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  driver_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_location TEXT NOT NULL,
  end_location TEXT NOT NULL,
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- Rides table for individual ride instances
CREATE TABLE rides (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  route_id BIGINT NOT NULL,
  driver_id BIGINT NOT NULL,
  status ENUM('pending', 'in_progress', 'ended') NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP NULL,
  ended_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id),
  FOREIGN KEY (driver_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- Location updates table
CREATE TABLE location_updates (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ride_id BIGINT NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  speed DOUBLE,
  heading DOUBLE,
  FOREIGN KEY (ride_id) REFERENCES rides(id)
) ENGINE=InnoDB;

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_routes_driver_id ON routes(driver_id);
CREATE INDEX idx_rides_route_id ON rides(route_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_location_updates_ride_id ON location_updates(ride_id);
CREATE INDEX idx_location_updates_timestamp ON location_updates(timestamp);

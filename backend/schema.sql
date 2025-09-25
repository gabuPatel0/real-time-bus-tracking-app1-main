-- Real-time Bus Tracking App - MySQL Schema
-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS location_updates;
DROP TABLE IF EXISTS rides;
DROP TABLE IF EXISTS routes;
DROP TABLE IF EXISTS users;

-- Users table with role-based access
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role ENUM('driver', 'user') NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Routes table for bus routes
CREATE TABLE routes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  driver_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_location VARCHAR(500) NOT NULL,
  end_location VARCHAR(500) NOT NULL,
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
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
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Location updates table for real-time tracking
CREATE TABLE location_updates (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ride_id BIGINT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  speed DECIMAL(5, 2),
  heading DECIMAL(5, 2),
  accuracy DECIMAL(8, 2),
  altitude DECIMAL(8, 2),
  FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_routes_driver_id ON routes(driver_id);
CREATE INDEX idx_routes_created_at ON routes(created_at);
CREATE INDEX idx_rides_route_id ON rides(route_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_started_at ON rides(started_at);
CREATE INDEX idx_location_updates_ride_id ON location_updates(ride_id);
CREATE INDEX idx_location_updates_timestamp ON location_updates(timestamp);
CREATE INDEX idx_location_updates_coords ON location_updates(latitude, longitude);

-- Insert sample data for testing
INSERT INTO users (email, password_hash, role, name, phone) VALUES
('driver1@example.com', '$2a$10$example.hash.for.password123', 'driver', 'John Driver', '+1234567890'),
('user1@example.com', '$2a$10$example.hash.for.password123', 'user', 'Jane User', '+0987654321');

INSERT INTO routes (driver_id, name, description, start_location, end_location, estimated_duration_minutes) VALUES
(1, 'Downtown Express', 'Fast route through downtown area', 'Central Station', 'Business District', 25),
(1, 'University Loop', 'Route serving university campus', 'Main Campus', 'Student Housing', 15);

CREATE TABLE Users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone_number VARCHAR(12) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Addresses (
  address_id INT PRIMARY KEY AUTO_INCREMENT,
  street VARCHAR(255) NOT NULL,
  street_number VARCHAR(10) NOT NULL,
  city VARCHAR(50) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(50) NOT NULL,
  details VARCHAR(100)
);

CREATE TABLE DeliveryAddresses (
  delivery_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  address_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (address_id) REFERENCES Addresses(address_id) ON DELETE CASCADE
);

CREATE TABLE Events (
  event_id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  organizer VARCHAR(50),
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  CHECK (end_date >= start_date)
);

CREATE TABLE Sessions (
  session_id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT NOT NULL,
  address_id INT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  total_seats INT NOT NULL CHECK (total_seats > 0),
  registration_deadline DATETIME NOT NULL,
  FOREIGN KEY (event_id) REFERENCES Events(event_id) ON DELETE CASCADE,
  FOREIGN KEY (address_id) REFERENCES Addresses(address_id) ON DELETE SET NULL,
  CHECK (end_time > start_time),
  CHECK (registration_deadline < start_time)
);

CREATE TABLE SessionRegistrations (
  registration_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  session_id INT NOT NULL,
  session_registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('confirmed', 'cancelled') NOT NULL,
  attended BOOLEAN DEFAULT FALSE,
  UNIQUE (user_id, session_id),
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES Sessions(session_id) ON DELETE CASCADE
);

CREATE TABLE Feedback (
  feedback_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  session_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  feedback_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, session_id),
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES Sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id, session_id) REFERENCES SessionRegistrations(user_id, session_id) ON DELETE CASCADE
);

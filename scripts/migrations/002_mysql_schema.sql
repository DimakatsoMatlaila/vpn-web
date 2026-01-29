-- Wits Cyber Authentication System
-- MySQL Migration Script v1.0
-- Run this script to set up the database schema

-- =====================================================
-- USERS TABLE
-- Core user authentication data from Google OAuth
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  google_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_google_id (google_id),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- USER PROFILES TABLE
-- Extended user information for CTFd and system use
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  google_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  username VARCHAR(20) NOT NULL,
  sex ENUM('male', 'female', 'other', 'prefer_not_to_say') DEFAULT 'prefer_not_to_say',
  student_number VARCHAR(7) NOT NULL,
  faculty VARCHAR(255) NOT NULL,
  year_of_study VARCHAR(50) NOT NULL,
  phone_number VARCHAR(20),
  bio TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_profiles_google_id (google_id),
  UNIQUE KEY uk_profiles_username (username),
  UNIQUE KEY uk_profiles_student_number (student_number),
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- OAUTH CLIENTS TABLE
-- Registered OAuth clients (Moodle, CTFd, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS oauth_clients (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id VARCHAR(255) NOT NULL,
  client_secret VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  redirect_uris JSON NOT NULL,
  allowed_scopes JSON DEFAULT ('["openid", "profile", "email"]'),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_oauth_clients_client_id (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- OAUTH AUTHORIZATION CODES TABLE
-- Temporary authorization codes for OAuth flow
-- =====================================================
CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(255) NOT NULL,
  client_id VARCHAR(255) NOT NULL,
  user_id CHAR(36) NOT NULL,
  redirect_uri TEXT NOT NULL,
  scope TEXT,
  code_challenge VARCHAR(255),
  code_challenge_method VARCHAR(10),
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_oauth_codes_code (code),
  CONSTRAINT fk_oauth_codes_client FOREIGN KEY (client_id) REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  CONSTRAINT fk_oauth_codes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_oauth_codes_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- OAUTH ACCESS TOKENS TABLE
-- Active access tokens for API authentication
-- =====================================================
CREATE TABLE IF NOT EXISTS oauth_access_tokens (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  token VARCHAR(500) NOT NULL,
  client_id VARCHAR(255) NOT NULL,
  user_id CHAR(36) NOT NULL,
  scope TEXT,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_oauth_tokens_token (token),
  CONSTRAINT fk_oauth_tokens_client FOREIGN KEY (client_id) REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  CONSTRAINT fk_oauth_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_oauth_tokens_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- OAUTH REFRESH TOKENS TABLE
-- Refresh tokens for obtaining new access tokens
-- =====================================================
CREATE TABLE IF NOT EXISTS oauth_refresh_tokens (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  token VARCHAR(500) NOT NULL,
  access_token_id CHAR(36) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_refresh_tokens_token (token),
  CONSTRAINT fk_refresh_tokens_access FOREIGN KEY (access_token_id) REFERENCES oauth_access_tokens(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SESSIONS TABLE
-- User sessions for web application
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  token VARCHAR(500) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_sessions_token (token),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CTFd SSO TOKENS TABLE
-- Tokens for CTFd single sign-on
-- =====================================================
CREATE TABLE IF NOT EXISTS ctfd_sso_tokens (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_ctfd_sso_token (token),
  CONSTRAINT fk_ctfd_sso_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- AUDIT LOG TABLE
-- Track important security events
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_profiles_username ON user_profiles(username);
CREATE INDEX idx_profiles_student_number ON user_profiles(student_number);
CREATE INDEX idx_profiles_user_id ON user_profiles(user_id);

-- =====================================================
-- SEED DATA: Default OAuth Clients
-- =====================================================
INSERT IGNORE INTO oauth_clients (client_id, client_secret, name, description, redirect_uris, allowed_scopes)
VALUES 
  ('moodle_client', 'CHANGE_THIS_SECRET_moodle', 'Moodle LMS', 'Wits Cyber Moodle Integration', 
   '["https://your-moodle-url.com/admin/oauth2callback.php"]', 
   '["openid", "profile", "email"]'),
  ('ctfd_client', 'CHANGE_THIS_SECRET_ctfd', 'CTFd Platform', 'Wits Cyber CTFd Integration',
   '["https://your-ctfd-url.com/oauth/callback"]',
   '["openid", "profile", "email"]');

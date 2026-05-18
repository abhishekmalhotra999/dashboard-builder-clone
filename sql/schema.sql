-- Dashboard Builder - MySQL Schema
-- Run this against your MySQL database (u146181273_dashboard_b)

CREATE TABLE IF NOT EXISTS dashboards (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL DEFAULT 'Untitled Dashboard',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS widgets (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  dashboard_id  INT          NOT NULL,
  type          ENUM('text', 'image', 'chart') NOT NULL,
  x             INT          NOT NULL DEFAULT 0,
  y             INT          NOT NULL DEFAULT 0,
  w             INT          NOT NULL DEFAULT 4,
  h             INT          NOT NULL DEFAULT 4,
  content       JSON,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE
);

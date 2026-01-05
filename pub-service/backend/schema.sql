CREATE DATABASE IF NOT EXISTS social_publications CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE social_publications;

CREATE TABLE IF NOT EXISTS publications (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  text TEXT,
  media_urls JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_publications_user (user_id)
);

CREATE TABLE IF NOT EXISTS reactions (
  id INT NOT NULL AUTO_INCREMENT,
  publication_id INT NOT NULL,
  user_id INT NOT NULL,
  type ENUM('like', 'love', 'haha') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_reaction (publication_id, user_id),
  CONSTRAINT fk_reactions_publication FOREIGN KEY (publication_id) REFERENCES publications(id) ON DELETE CASCADE
);

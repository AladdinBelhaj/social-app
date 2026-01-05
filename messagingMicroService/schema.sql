-- Messaging Microservice Database Schema
-- MySQL Schema for messaging service using social_messaging database
-- Users table is synced with MCSV social_app.users structure

CREATE DATABASE IF NOT EXISTS social_messaging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE social_messaging;

-- Users table (synced with MCSV)
CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Conversations table (represents chat between two users)
CREATE TABLE IF NOT EXISTS conversations (
  id INT NOT NULL AUTO_INCREMENT,
  participant_1_id INT NOT NULL,
  participant_2_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_conversation (participant_1_id, participant_2_id),
  INDEX idx_conversations_participant_1 (participant_1_id),
  INDEX idx_conversations_participant_2 (participant_2_id),
  CONSTRAINT fk_conversations_participant_1 FOREIGN KEY (participant_1_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversations_participant_2 FOREIGN KEY (participant_2_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages table (individual messages in conversations)
CREATE TABLE IF NOT EXISTS messages (
  id INT NOT NULL AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  content LONGTEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'sent',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_messages_conversation (conversation_id),
  INDEX idx_messages_sender (sender_id),
  CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

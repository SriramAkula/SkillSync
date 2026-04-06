-- Migration: V3 - Add Admin Fields for User Blocking/Blocking

ALTER TABLE user_profiles ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE user_profiles ADD COLUMN block_reason VARCHAR(500);
ALTER TABLE user_profiles ADD COLUMN block_date TIMESTAMP NULL;
ALTER TABLE user_profiles ADD COLUMN blocked_by BIGINT NULL;

-- Index for faster queries
CREATE INDEX idx_is_blocked ON user_profiles(is_blocked);
CREATE INDEX idx_block_date ON user_profiles(block_date);
CREATE INDEX idx_user_id_blocked ON user_profiles(user_id, is_blocked);

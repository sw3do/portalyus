-- Fix disk_storage table column types from INTEGER to BIGINT and add missing updated_at column
ALTER TABLE disk_storage 
ALTER COLUMN total_space TYPE BIGINT,
ALTER COLUMN used_space TYPE BIGINT;

ALTER TABLE disk_storage ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
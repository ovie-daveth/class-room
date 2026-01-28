-- Add progress column to enrollments if it doesn't exist
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

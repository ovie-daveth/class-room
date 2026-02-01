-- Make instructor_id nullable to allow courses without assigned instructors
ALTER TABLE courses ALTER COLUMN instructor_id DROP NOT NULL;

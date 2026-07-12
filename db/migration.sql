-- CLASSES (a specific grade+section combo)
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  grade VARCHAR(20) NOT NULL,           -- e.g., "3", "10"
  section VARCHAR(20) NOT NULL DEFAULT 'A',  -- e.g., "A", "B"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_grade_section UNIQUE (grade, section)
);

-- TEACHER-CLASS-SUBJECT ASSIGNMENTS (who teaches what to whom)
CREATE TABLE IF NOT EXISTS teacher_classes (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject VARCHAR(100) NOT NULL,        -- e.g., "Mathematics", "Science"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_teacher_class_subject UNIQUE (teacher_id, class_id, subject)
);

-- UPDATE USERS (Students)
-- Add class_id to users to enforce the "one student, one class" rule
ALTER TABLE users ADD COLUMN IF NOT EXISTS class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL;

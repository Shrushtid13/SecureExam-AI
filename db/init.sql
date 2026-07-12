-- SecureExam AI Database Initialization

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  class_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CLASSES (a specific grade+section combo)
CREATE TABLE classes (
  id SERIAL PRIMARY KEY,
  grade VARCHAR(20) NOT NULL,
  section VARCHAR(20) NOT NULL DEFAULT 'A',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_grade_section UNIQUE (grade, section)
);

-- TEACHER-CLASS-SUBJECT ASSIGNMENTS (who teaches what to whom)
CREATE TABLE teacher_classes (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_teacher_class_subject UNIQUE (teacher_id, class_id, subject)
);

ALTER TABLE users ADD CONSTRAINT fk_user_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS exams (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_exam_times CHECK (start_time < end_time)
);

CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('mcq', 'true_false', 'numeric', 'subjective')),
  question_text TEXT NOT NULL,
  options JSONB, -- For MCQ: Array of options (e.g. ["A", "B", "C", "D"])
  correct_answer TEXT, -- For MCQ/True-False/Numeric: the correct choice key/text
  points INTEGER NOT NULL DEFAULT 1 CHECK (points >= 0)
);

CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_exam_student_enrollment UNIQUE (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb, -- Key-value map (question_id -> student's answer)
  score INTEGER, -- Evaluated grade (filled on submission / teacher grading)
  submitted_at TIMESTAMP WITH TIME ZONE, -- Null indicates exam in progress
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_exam_student_submission UNIQUE (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS proctoring_flags (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL CHECK (source IN ('client_check', 'extension', 'ai_service')),
  flag_type VARCHAR(100) NOT NULL,
  detail TEXT,
  snapshot_key VARCHAR(255), -- Reference key in MinIO
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

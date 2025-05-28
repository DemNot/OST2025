/*
  # Optimized Database Schema for Educational Testing System

  1. New Tables
    - users: Stores user information with role-specific fields
    - groups: Academic groups with teacher assignments
    - tests: Test definitions and settings
    - questions: Test questions with type-specific attributes
    - test_results: Student test completion records
    - test_answers: Individual student answers for each question

  2. Changes
    - All tables follow 3NF
    - No redundant foreign keys
    - Clear one-to-many and many-to-many relationships
    - Proper constraints and checks

  3. Security
    - RLS enabled on all tables
    - Appropriate policies for teachers and students
*/

-- Users table with role-specific attributes
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('teacher', 'student')),
  institution text NOT NULL,
  group_id uuid REFERENCES groups(id), -- Only for students
  photo_url text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_user_role CHECK (
    (role = 'student' AND group_id IS NOT NULL) OR
    (role = 'teacher' AND group_id IS NULL)
  )
);

-- Groups table
CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_number text NOT NULL,
  specialty text NOT NULL,
  institution text NOT NULL,
  teacher_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE (institution, group_number)
);

-- Tests table
CREATE TABLE tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text NOT NULL,
  description text,
  teacher_id uuid NOT NULL REFERENCES users(id),
  group_id uuid NOT NULL REFERENCES groups(id),
  time_limit integer, -- in minutes
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Questions table with type-specific storage
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES tests(id),
  text text NOT NULL,
  type text NOT NULL CHECK (type IN ('single-choice', 'multiple-choice', 'text')),
  options jsonb, -- Array of options for choice questions
  correct_answer jsonb NOT NULL, -- String for text, string[] for choices
  order_number integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (test_id, order_number),
  CONSTRAINT valid_question_type CHECK (
    (type IN ('single-choice', 'multiple-choice') AND jsonb_typeof(options) = 'array') OR
    (type = 'text' AND options IS NULL)
  )
);

-- Test results table
CREATE TABLE test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES tests(id),
  student_id uuid NOT NULL REFERENCES users(id),
  score integer NOT NULL,
  max_score integer NOT NULL,
  completed_at timestamptz DEFAULT now(),
  UNIQUE (test_id, student_id)
);

-- Student answers table
CREATE TABLE test_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id uuid NOT NULL REFERENCES test_results(id),
  question_id uuid NOT NULL REFERENCES questions(id),
  answer jsonb NOT NULL, -- String for text, string[] for choices
  created_at timestamptz DEFAULT now(),
  UNIQUE (result_id, question_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_answers ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Teachers can read student data in their groups"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.teacher_id = auth.uid()
      AND groups.id = users.group_id
    )
  );

-- Groups policies
CREATE POLICY "Teachers can manage their groups"
  ON groups
  FOR ALL
  USING (teacher_id = auth.uid());

CREATE POLICY "Students can view their group"
  ON groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.group_id = groups.id
    )
  );

-- Tests policies
CREATE POLICY "Teachers can manage their tests"
  ON tests
  FOR ALL
  USING (teacher_id = auth.uid());

CREATE POLICY "Students can view tests assigned to their group"
  ON tests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.group_id = tests.group_id
    )
  );

-- Questions policies
CREATE POLICY "Teachers can manage their test questions"
  ON questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tests
      WHERE tests.id = questions.test_id
      AND tests.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view questions for their tests"
  ON questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tests
      JOIN users ON users.group_id = tests.group_id
      WHERE tests.id = questions.test_id
      AND users.id = auth.uid()
    )
  );

-- Test results policies
CREATE POLICY "Teachers can view results for their tests"
  ON test_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tests
      WHERE tests.id = test_results.test_id
      AND tests.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can manage their own results"
  ON test_results
  FOR ALL
  USING (student_id = auth.uid());

-- Test answers policies
CREATE POLICY "Teachers can view answers for their tests"
  ON test_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_results
      JOIN tests ON tests.id = test_results.test_id
      WHERE test_results.id = test_answers.result_id
      AND tests.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can manage their own answers"
  ON test_answers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM test_results
      WHERE test_results.id = test_answers.result_id
      AND test_results.student_id = auth.uid()
    )
  );
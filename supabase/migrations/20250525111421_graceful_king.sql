/*
  # Update database schema to 3NF

  1. Changes
    - Remove GroupStudents table since students can only be in one group
    - Add group_id directly to Users table for students
    - Create Questions table for storing test questions
    - Update relationships between tables

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies
*/

-- Add group_id to Users table
ALTER TABLE Users ADD COLUMN group_id UNIQUEIDENTIFIER NULL;
ALTER TABLE Users ADD CONSTRAINT fk_users_group FOREIGN KEY (group_id) REFERENCES Groups(id);

-- Drop GroupStudents table since students can only be in one group
DROP TABLE GroupStudents;

-- Create Questions table
CREATE TABLE Questions (
    id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    test_id UNIQUEIDENTIFIER NOT NULL,
    text NVARCHAR(MAX) NOT NULL,
    type NVARCHAR(50) NOT NULL CHECK (type IN ('multiple-choice', 'single-choice', 'text')),
    options NVARCHAR(MAX),
    correct_answer NVARCHAR(MAX) NOT NULL,
    order_number INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (test_id) REFERENCES Tests(id)
);

-- Remove questions column from Tests table since it's now in Questions table
ALTER TABLE Tests DROP COLUMN questions;

-- Enable RLS
ALTER TABLE Questions ENABLE ROW LEVEL SECURITY;

-- Add policies for Questions table
CREATE POLICY "Teachers can manage their own test questions"
ON Questions
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM Tests
        WHERE Tests.id = Questions.test_id
        AND Tests.teacher_id = auth.uid()
    )
);

CREATE POLICY "Students can view questions of assigned tests"
ON Questions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM Tests
        JOIN Groups ON Tests.group_id = Groups.id
        JOIN Users ON Users.group_id = Groups.id
        WHERE Tests.id = Questions.test_id
        AND Users.id = auth.uid()
    )
);
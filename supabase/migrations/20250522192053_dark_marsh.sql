-- Создание таблицы пользователей
CREATE TABLE Users (
    id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    fullName NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL,
    institution NVARCHAR(255) NOT NULL,
    groupNumber NVARCHAR(50),
    photoUrl NVARCHAR(MAX),
    createdAt DATETIME DEFAULT GETDATE()
);

-- Создание таблицы групп
CREATE TABLE Groups (
    id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    groupNumber NVARCHAR(50) NOT NULL,
    specialty NVARCHAR(255) NOT NULL,
    institution NVARCHAR(255) NOT NULL,
    teacherId UNIQUEIDENTIFIER NOT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (teacherId) REFERENCES Users(id)
);

-- Связь между группами и студентами
CREATE TABLE GroupStudents (
    groupId UNIQUEIDENTIFIER NOT NULL,
    studentId UNIQUEIDENTIFIER NOT NULL,
    PRIMARY KEY (groupId, studentId),
    FOREIGN KEY (groupId) REFERENCES Groups(id),
    FOREIGN KEY (studentId) REFERENCES Users(id)
);

-- Создание таблицы тестов
CREATE TABLE Tests (
    id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    subject NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    teacherId UNIQUEIDENTIFIER NOT NULL,
    timeLimit INT,
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    questions NVARCHAR(MAX) NOT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (teacherId) REFERENCES Users(id)
  ALTER TABLE Tests
ADD group_id UNIQUEIDENTIFIER NOT NULL
    FOREIGN KEY REFERENCES Groups(id);
ALTER TABLE Tests ENABLE ROW LEVEL SECURITY;

);

-- Связь между тестами и группами
CREATE TABLE TestGroups (
    testId UNIQUEIDENTIFIER NOT NULL,
    groupId UNIQUEIDENTIFIER NOT NULL,
    PRIMARY KEY (testId, groupId),
    FOREIGN KEY (testId) REFERENCES Tests(id),
    FOREIGN KEY (groupId) REFERENCES Groups(id)
);

-- Создание таблицы результатов тестов
CREATE TABLE TestResults (
    id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    testId UNIQUEIDENTIFIER NOT NULL,
    studentId UNIQUEIDENTIFIER NOT NULL,
    answers NVARCHAR(MAX) NOT NULL,
    score INT NOT NULL,
    maxScore INT NOT NULL,
    completedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (testId) REFERENCES Tests(id),
    FOREIGN KEY (studentId) REFERENCES Users(id)
);
CREATE POLICY "Students can view tests of their group"
ON Tests
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM GroupStudents
    WHERE GroupStudents.studentId = auth.uid()
      AND GroupStudents.groupId = Tests.group_id
  )
);

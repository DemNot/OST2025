export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  institution: string;
  groupNumber?: string;
}

export interface Teacher extends User {
  role: 'teacher';
}

export interface Student extends User {
  role: 'student';
  groups: string[];
  groupNumber: string;
}

export interface Group {
  id: string;
  groupNumber: string;
  specialty: string;
  name: string;
  teacherId: string;
  institution: string;
  students: Array<{
    id: string;
    fullName: string;
  }>;
  createdAt: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'single-choice' | 'text';
  options?: string[];
  correctAnswer: string | string[];
  alternativeAnswers?: string[]; // Added for text questions
  randomizeOptions?: boolean; // Added for choice questions
}

export interface Test {
  id: string;
  title: string;
  subject: string;
  description: string;
  teacherId: string;
  groupIds: string[];
  questions: Question[];
  timeLimit?: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  randomizeQuestions?: boolean; // Added for test settings
}

export interface TestResult {
  id: string;
  testId: string;
  studentId: string;
  answers: Record<string, string | string[]>;
  score: number;
  maxScore: number;
  completedAt: string;
}
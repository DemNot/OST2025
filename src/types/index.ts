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
  alternativeAnswers?: string[];
  randomizeOptions?: boolean;
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
  randomizeQuestions?: boolean;
  maxAttempts?: number;
}
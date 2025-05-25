import React, { createContext, useContext, useState, useEffect } from 'react';
import { Group, Test, TestResult, User } from '../types';
import { useAuth } from './AuthContext';

interface DataContextType {
  groups: Group[];
  tests: Test[];
  results: TestResult[];
  users: User[];
  
  createGroup: (groupNumber: string, specialty: string, institution: string, students: Array<{ id: string; fullName: string }>) => void;
  updateGroup: (group: Group) => void;
  deleteGroup: (groupId: string) => void;
  
  createTest: (test: Omit<Test, 'id' | 'createdAt'>) => void;
  updateTest: (test: Test) => void;
  deleteTest: (testId: string) => void;
  
  submitTestResult: (result: Omit<TestResult, 'id' | 'completedAt'>) => void;
  
  getTestsForStudent: (studentId: string) => Test[];
  getGroupsForTeacher: (teacherId: string) => Group[];
  getResultsForTest: (testId: string) => TestResult[];
  getResultsForStudent: (studentId: string) => TestResult[];
  getStudentsInGroup: (groupId: string) => User[];
  isLoading: boolean;
}

const GROUPS_KEY = 'edutest_groups';
const TESTS_KEY = 'edutest_tests';
const RESULTS_KEY = 'edutest_results';
const USERS_KEY = 'edutest_users';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadedGroups = JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]');
    const loadedTests = JSON.parse(localStorage.getItem(TESTS_KEY) || '[]');
    const loadedResults = JSON.parse(localStorage.getItem(RESULTS_KEY) || '[]');
    const loadedUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    setGroups(loadedGroups);
    setTests(loadedTests);
    setResults(loadedResults);
    setUsers(loadedUsers);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
      localStorage.setItem(TESTS_KEY, JSON.stringify(tests));
      localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  }, [groups, tests, results, users, isLoading]);

  const createGroup = (groupNumber: string, specialty: string, institution: string, students: Array<{ id: string; fullName: string }>) => {
    if (!user || user.role !== 'teacher') return;
    
    const newGroup: Group = {
      id: Date.now().toString(),
      groupNumber,
      specialty,
      institution,
      teacherId: user.id,
      students,
      createdAt: new Date().toISOString(),
    };
    
    setGroups([...groups, newGroup]);
  };

  const updateGroup = (updatedGroup: Group) => {
    if (!user || user.role !== 'teacher' || updatedGroup.teacherId !== user.id) return;
    
    setGroups(groups.map(g => g.id === updatedGroup.id ? updatedGroup : g));
  };

  const deleteGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!user || !group || user.role !== 'teacher' || group.teacherId !== user.id) return;
    
    setGroups(groups.filter(g => g.id !== groupId));
    
    const testsToDelete = tests.filter(t => t.groupIds.includes(groupId));
    if (testsToDelete.length > 0) {
      const testIdsToDelete = testsToDelete.map(t => t.id);
      setTests(tests.filter(t => !testIdsToDelete.includes(t.id)));
      setResults(results.filter(r => !testIdsToDelete.includes(r.testId)));
    }
  };

  const createTest = (testData: Omit<Test, 'id' | 'createdAt'>) => {
    if (!user || user.role !== 'teacher') return;
    
    const newTest: Test = {
      ...testData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    setTests([...tests, newTest]);
  };

  const updateTest = (updatedTest: Test) => {
    if (!user || user.role !== 'teacher' || updatedTest.teacherId !== user.id) return;
    
    setTests(tests.map(t => t.id === updatedTest.id ? updatedTest : t));
  };

  const deleteTest = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!user || !test || user.role !== 'teacher' || test.teacherId !== user.id) return;
    
    setTests(tests.filter(t => t.id !== testId));
    setResults(results.filter(r => r.testId !== testId));
  };

  const submitTestResult = (resultData: Omit<TestResult, 'id' | 'completedAt'>) => {
    if (!user || user.role !== 'student') return;
    
    const newResult: TestResult = {
      ...resultData,
      id: Date.now().toString(),
      completedAt: new Date().toISOString(),
    };
    
    setResults([...results, newResult]);
  };

  const getTestsForStudent = (studentId: string) => {
    const studentUser = users.find(u => u.id === studentId);
    if (!studentUser || studentUser.role !== 'student') return [];

    const studentGroups = groups.filter(group => 
      group.students.some(student => 
        student.fullName.toLowerCase().trim() === studentUser.fullName.toLowerCase().trim() &&
        group.institution.toLowerCase().trim() === studentUser.institution.toLowerCase().trim() &&
        group.groupNumber === studentUser.groupNumber
      )
    );

    const studentGroupIds = studentGroups.map(group => group.id);
    return tests.filter(test => 
      test.groupIds.some(groupId => studentGroupIds.includes(groupId))
    );
  };

  const getGroupsForTeacher = (teacherId: string) => {
    return groups.filter(group => group.teacherId === teacherId);
  };

  const getResultsForTest = (testId: string) => {
    return results.filter(result => result.testId === testId);
  };

  const getResultsForStudent = (studentId: string) => {
    return results.filter(result => result.studentId === studentId);
  };

  const getStudentsInGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group || !Array.isArray(group.students)) return [];
    
    return users.filter(u => 
      u.role === 'student' && 
      group.students.some(student => 
        student.fullName.toLowerCase().trim() === u.fullName.toLowerCase().trim() &&
        u.institution.toLowerCase().trim() === group.institution.toLowerCase().trim() &&
        u.groupNumber === group.groupNumber
      )
    );
  };

  return (
    <DataContext.Provider value={{
      groups,
      tests,
      results,
      users,
      isLoading,
      createGroup,
      updateGroup,
      deleteGroup,
      createTest,
      updateTest,
      deleteTest,
      submitTestResult,
      getTestsForStudent,
      getGroupsForTeacher,
      getResultsForTest,
      getResultsForStudent,
      getStudentsInGroup,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData должен использоваться внутри DataProvider');
  }
  return context;
};
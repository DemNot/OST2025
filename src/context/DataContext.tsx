import React, { createContext, useContext, useEffect, useState } from 'react';
import { Group, Test, TestResult, User } from '../types';
import { useAuth } from './AuthContext';

interface DataContextType {
  groups: Group[];
  tests: Test[];
  results: TestResult[];
  users: User[];
  
  // Group actions
  createGroup: (name: string, studentIds: string[]) => void;
  updateGroup: (group: Group) => void;
  deleteGroup: (groupId: string) => void;
  
  // Test actions
  createTest: (test: Omit<Test, 'id' | 'createdAt'>) => void;
  updateTest: (test: Test) => void;
  deleteTest: (testId: string) => void;
  
  // Result actions
  submitTestResult: (result: Omit<TestResult, 'id' | 'completedAt'>) => void;
  
  // Utility functions
  getTestsForStudent: (studentId: string) => Test[];
  getGroupsForTeacher: (teacherId: string) => Group[];
  getResultsForTest: (testId: string) => TestResult[];
  getResultsForStudent: (studentId: string) => TestResult[];
  getStudentsInGroup: (groupId: string) => User[];
  isLoading: boolean;
}

// Storage keys
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

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      const storedGroups = localStorage.getItem(GROUPS_KEY);
      const storedTests = localStorage.getItem(TESTS_KEY);
      const storedResults = localStorage.getItem(RESULTS_KEY);
      const storedUsers = localStorage.getItem(USERS_KEY);
      
      setGroups(storedGroups ? JSON.parse(storedGroups) : []);
      setTests(storedTests ? JSON.parse(storedTests) : []);
      setResults(storedResults ? JSON.parse(storedResults) : []);
      setUsers(storedUsers ? JSON.parse(storedUsers) : []);
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
      localStorage.setItem(TESTS_KEY, JSON.stringify(tests));
      localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  }, [groups, tests, results, users, isLoading]);

  // Group actions
  const createGroup = (name: string, studentIds: string[]) => {
    if (!user || user.role !== 'teacher') return;
    
    const newGroup: Group = {
      id: Date.now().toString(),
      name,
      teacherId: user.id,
      students: studentIds,
      createdAt: new Date().toISOString(),
    };
    
    setGroups([...groups, newGroup]);
    
    // Update student records to include this group
    const updatedUsers = users.map(u => {
      if (u.role === 'student' && studentIds.includes(u.id)) {
        return {
          ...u,
          groups: [...(u.groups || []), newGroup.id]
        };
      }
      return u;
    });
    
    setUsers(updatedUsers);
  };

  const updateGroup = (updatedGroup: Group) => {
    if (!user || user.role !== 'teacher' || updatedGroup.teacherId !== user.id) return;
    
    setGroups(groups.map(g => g.id === updatedGroup.id ? updatedGroup : g));
    
    // Update student records
    const oldGroup = groups.find(g => g.id === updatedGroup.id);
    if (oldGroup) {
      const removedStudents = oldGroup.students.filter(id => !updatedGroup.students.includes(id));
      const addedStudents = updatedGroup.students.filter(id => !oldGroup.students.includes(id));
      
      const updatedUsers = users.map(u => {
        if (u.role === 'student') {
          if (removedStudents.includes(u.id)) {
            return {
              ...u,
              groups: (u.groups || []).filter(gId => gId !== updatedGroup.id)
            };
          }
          if (addedStudents.includes(u.id)) {
            return {
              ...u,
              groups: [...(u.groups || []), updatedGroup.id]
            };
          }
        }
        return u;
      });
      
      setUsers(updatedUsers);
    }
  };

  const deleteGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!user || !group || user.role !== 'teacher' || group.teacherId !== user.id) return;
    
    setGroups(groups.filter(g => g.id !== groupId));
    
    // Update student records
    const updatedUsers = users.map(u => {
      if (u.role === 'student' && (u.groups || []).includes(groupId)) {
        return {
          ...u,
          groups: (u.groups || []).filter(gId => gId !== groupId)
        };
      }
      return u;
    });
    
    setUsers(updatedUsers);
    
    // Also delete tests associated with this group
    const testsToDelete = tests.filter(t => t.groupIds.includes(groupId));
    if (testsToDelete.length > 0) {
      const testIdsToDelete = testsToDelete.map(t => t.id);
      setTests(tests.filter(t => !testIdsToDelete.includes(t.id)));
      
      // Remove results for those tests
      setResults(results.filter(r => !testIdsToDelete.includes(r.testId)));
    }
  };

  // Test actions
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
    
    // Delete associated results
    setResults(results.filter(r => r.testId !== testId));
  };

  // Result actions
  const submitTestResult = (resultData: Omit<TestResult, 'id' | 'completedAt'>) => {
    if (!user || user.role !== 'student') return;
    
    const newResult: TestResult = {
      ...resultData,
      id: Date.now().toString(),
      completedAt: new Date().toISOString(),
    };
    
    setResults([...results, newResult]);
  };

  // Utility functions
  const getTestsForStudent = (studentId: string) => {
    const studentGroups = users
      .find(u => u.id === studentId && u.role === 'student')
      ?.groups || [];
      
    return tests.filter(test => 
      test.groupIds.some(groupId => studentGroups.includes(groupId))
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
    if (!group) return [];
    
    return users.filter(u => u.role === 'student' && group.students.includes(u.id));
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
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole, institution: string, groupNumber: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// For demo purposes, we'll use localStorage to persist users
const USERS_STORAGE_KEY = 'edutest_users';
const CURRENT_USER_KEY = 'edutest_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load current user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const saveUser = (userData: User) => {
    // Save to users collection
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    
    // Check if user already exists
    const existingUserIndex = users.findIndex((u: User) => u.email === userData.email);
    
    if (existingUserIndex >= 0) {
      users[existingUserIndex] = userData;
    } else {
      users.push(userData);
    }
    
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    // Set as current user
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    
    // In a real app, this would be an API call
    // For demo, we'll check localStorage
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    
    const foundUser = users.find((u: User) => u.email === email && u.role === role);
    
    if (!foundUser) {
      setIsLoading(false);
      throw new Error('Неверные учетные данные или пользователь не найден');
    }
    
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(foundUser));
    setUser(foundUser);
    setIsLoading(false);
  };

  const register = async (name: string, email: string, password: string, role: UserRole, institution: string, groupNumber: string) => {
    setIsLoading(true);
    
    // In a real app, this would be an API call with proper validation
    // For demo, we'll use localStorage
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    
    // Check if user already exists
    const existingUser = users.find((u: User) => u.email === email);
    
    if (existingUser) {
      setIsLoading(false);
      throw new Error('Пользователь с таким email уже существует');
    }
    
    const newUser: User = {
      id: Date.now().toString(),
      fullName: name,
      email,
      role,
      institution,
      ...(role === 'student' ? { groupNumber, groups: [] } : {})
    };
    
    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    // Set as current user
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    setUser(null);
  };

  const updateProfile = (updatedUser: User) => {
    saveUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};
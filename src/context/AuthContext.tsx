import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole, institution: string, groupNumber: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updatedUser: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'edutest_users';
const CURRENT_USER_KEY = 'edutest_current_user';

const hashPassword = (password: string): string => {
  return btoa(password);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      const hashedPassword = hashPassword(password);
      const foundUser = users.find((u: User & { password: string }) => 
        u.email === email && 
        u.password === hashedPassword && 
        u.role === role
      );

      if (!foundUser) {
        throw new Error('Invalid credentials or user not found');
      }

      const { password: _, ...userWithoutPassword } = foundUser;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
      setUser(userWithoutPassword);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole, institution: string, groupNumber: string) => {
    setIsLoading(true);
    try {
      const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      
      if (users.some((u: User) => u.email === email)) {
        throw new Error('User with this email already exists');
      }

      if (role === 'student') {
        const groups = JSON.parse(localStorage.getItem('edutest_groups') || '[]');
        const studentInGroup = groups.some(group => 
          group.students.some(student => 
            student.fullName.toLowerCase().trim() === name.toLowerCase().trim() &&
            group.institution.toLowerCase().trim() === institution.toLowerCase().trim() &&
            group.groupNumber === groupNumber
          )
        );

        if (!studentInGroup) {
          throw new Error('Вы не можете зарегистрироваться, так как преподаватель еще не добавил вас в группу. Пожалуйста, обратитесь к преподавателю.');
        }
      }

      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fullName: name,
        email,
        password: hashPassword(password),
        role,
        institution,
        groupNumber: role === 'student' ? groupNumber : undefined,
        photoUrl: undefined
      };

      users.push(newUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

      const { password: _, ...userWithoutPassword } = newUser;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
      setUser(userWithoutPassword);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    setUser(null);
  };

  const updateProfile = async (updatedUser: User) => {
    try {
      const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      const currentUser = users.find((u: User) => u.id === updatedUser.id);
      
      if (!currentUser) {
        throw new Error('User not found');
      }

      const updatedUsers = users.map((u: User & { password: string }) => 
        u.id === updatedUser.id ? { ...u, ...updatedUser, password: u.password } : u
      );
      
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
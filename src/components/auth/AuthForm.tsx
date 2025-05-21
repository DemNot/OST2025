import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

type AuthMode = 'login' | 'register';

const TEACHER_CODE = 'NEKMK666666';

const AuthForm: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<UserRole>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institution, setInstitution] = useState('');
  const [groupNumber, setGroupNumber] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const validateGroupNumber = (number: string): boolean => {
    // Проверяем что номер группы содержит только цифры
    return /^\d+$/.test(number);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (!validateEmail(email)) {
        throw new Error('Пожалуйста, введите корректный email адрес');
      }

      if (!validatePassword(password)) {
        throw new Error('Пароль должен содержать минимум 6 символов');
      }

      if (role === 'teacher' && teacherCode !== TEACHER_CODE) {
        throw new Error('Неверный код преподавателя');
      }

      if (mode === 'login') {
        await login(email, password, role);
      } else {
        if (!fullName.trim() || fullName.split(' ').length < 3) {
          throw new Error('Пожалуйста, введите полное ФИО (Фамилия Имя Отчество)');
        }
        if (!institution.trim()) {
          throw new Error('Пожалуйста, введите название учебного заведения');
        }
        if (role === 'student') {
          if (!groupNumber.trim()) {
            throw new Error('Пожалуйста, введите номер группы');
          }
          if (!validateGroupNumber(groupNumber)) {
            throw new Error('Номер группы должен содержать только цифры');
          }
        }
        await register(fullName, email, password, role, institution, groupNumber);
      }
    } catch (err) {
      let errorMessage = (err as Error).message;
      
      // Перевод стандартных ошибок на русский
      if (errorMessage === 'Invalid credentials or user not found') {
        errorMessage = 'Неверные учетные данные или пользователь не найден';
      } else if (errorMessage === 'User with this email already exists') {
        errorMessage = 'Пользователь с таким email уже существует';
      }
      
      setError(errorMessage);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 to-blue-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md transition-all duration-300">
        <div>
          <h1 className="text-center text-2xl font-bold text-indigo-600 mb-8">
            Образовательная система тестирования
          </h1>
          <h2 className="text-center text-xl font-bold text-gray-900">
            {mode === 'login' ? 'Вход' : 'Регистрация'}
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-indigo-600"
                  checked={role === 'student'}
                  onChange={() => setRole('student')}
                />
                <span className="ml-2">Студент</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-indigo-600"
                  checked={role === 'teacher'}
                  onChange={() => setRole('teacher')}
                />
                <span className="ml-2">Преподаватель</span>
              </label>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Пароль
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {role === 'teacher' && (
              <div>
                <label htmlFor="teacherCode" className="block text-sm font-medium text-gray-700">
                  Код преподавателя
                </label>
                <div className="mt-1">
                  <input
                    id="teacherCode"
                    type="password"
                    value={teacherCode}
                    onChange={(e) => setTeacherCode(e.target.value)}
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            )}
            
            {mode === 'register' && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    ФИО (полностью)
                  </label>
                  <div className="mt-1">
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Иванов Иван Иванович"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="institution" className="block text-sm font-medium text-gray-700">
                    Учебное заведение
                  </label>
                  <div className="mt-1">
                    <input
                      id="institution"
                      name="institution"
                      type="text"
                      required
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="Название учебного заведения"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                {role === 'student' && (
                  <div>
                    <label htmlFor="groupNumber" className="block text-sm font-medium text-gray-700">
                      Номер группы
                    </label>
                    <div className="mt-1">
                      <input
                        id="groupNumber"
                        name="groupNumber"
                        type="text"
                        required
                        value={groupNumber}
                        onChange={(e) => setGroupNumber(e.target.value)}
                        placeholder="Например 16"
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading
                ? 'Загрузка...'
                : mode === 'login'
                ? 'Войти'
                : 'Зарегистрироваться'}
            </button>
          </div>

          <div className="text-center text-sm">
            <p className="text-gray-600">
              {mode === 'login' ? "Нет аккаунта? " : "Уже есть аккаунт? "}
              <button
                type="button"
                onClick={toggleMode}
                className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
              >
                {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Camera } from 'lucide-react';
import UserProfile from './UserProfile';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  const formatName = (fullName: string) => {
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      const lastName = parts[0];
      const initials = parts.slice(1).map(name => `${name[0]}.`).join('');
      return `${lastName} ${initials}`;
    }
    return fullName;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-indigo-600">Образовательная система тестирования</h1>
              </a>
            </div>
            {user && (
              <div className="flex items-center">
                <button
                  onClick={() => setShowProfile(true)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  {user.photoUrl ? (
                    <img
                      src={user.photoUrl}
                      alt={user.fullName}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User size={20} className="text-indigo-600" />
                    </div>
                  )}
                  <span className="ml-2">
                    {formatName(user.fullName)} ({user.role === 'teacher' ? 'преподаватель' : 'студент'})
                  </span>
                </button>
                <button
                  onClick={logout}
                  className="ml-4 inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                  title="Выйти"
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} />
      )}

      <footer className="bg-white shadow-inner mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 Образовательная система тестирования. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
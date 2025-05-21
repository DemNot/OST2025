import React from 'react';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import AuthForm from './components/auth/AuthForm';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import StudentDashboard from './components/student/StudentDashboard';
import { DataProvider } from './context/DataContext';

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <DataProvider>
      <Layout>
        {user.role === 'teacher' ? (
          <TeacherDashboard />
        ) : (
          <StudentDashboard />
        )}
      </Layout>
    </DataProvider>
  );
}

export default App;
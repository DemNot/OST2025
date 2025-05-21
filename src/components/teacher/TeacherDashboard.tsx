import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import GroupList from './GroupList';
import TestList from './TestList';
import { Plus, Users, FileText } from 'lucide-react';

enum TabType {
  GROUPS = 'groups',
  TESTS = 'tests',
}

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const { getGroupsForTeacher, tests } = useData();
  const [activeTab, setActiveTab] = useState<TabType>(TabType.GROUPS);

  if (!user || user.role !== 'teacher') return null;

  const teacherGroups = getGroupsForTeacher(user.id);
  const teacherTests = tests.filter(test => test.teacherId === user.id);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab(TabType.GROUPS)}
            className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
              activeTab === TabType.GROUPS
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users size={20} className="mr-2" />
            Мои группы ({teacherGroups.length})
          </button>
          <button
            onClick={() => setActiveTab(TabType.TESTS)}
            className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
              activeTab === TabType.TESTS
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText size={20} className="mr-2" />
            Мои тесты ({teacherTests.length})
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === TabType.GROUPS ? (
          <GroupList groups={teacherGroups} />
        ) : (
          <TestList tests={teacherTests} />
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
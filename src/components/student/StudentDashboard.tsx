import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import TestCard from './TestCard';
import TestResults from './TestResults';
import { FileText, CheckSquare } from 'lucide-react';

enum TabType {
  AVAILABLE_TESTS = 'available',
  COMPLETED_TESTS = 'completed',
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { getTestsForStudent, getResultsForStudent, groups } = useData();
  const [activeTab, setActiveTab] = useState<TabType>(TabType.AVAILABLE_TESTS);

  if (!user || user.role !== 'student') return null;

  // Проверяем, состоит ли студент в какой-либо группе
  const studentGroup = groups.find(group => 
    group.students.some(student => 
      student.fullName.toLowerCase() === user.fullName.toLowerCase() &&
      group.institution.toLowerCase() === user.institution.toLowerCase() &&
      group.groupNumber === user.groupNumber
    )
  );

  if (!studentGroup) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Вы не состоите ни в одной группе</h3>
          <p className="mt-1 text-sm text-gray-500">
            Дождитесь, пока преподаватель создаст вашу группу.
          </p>
        </div>
      </div>
    );
  }

  const studentResults = getResultsForStudent(user.id);
  const completedTestIds = studentResults.map(result => result.testId);
  
  const allTests = getTestsForStudent(user.id);
  const availableTests = allTests.filter(test => !completedTestIds.includes(test.id));
  const completedTests = allTests.filter(test => completedTestIds.includes(test.id));

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab(TabType.AVAILABLE_TESTS)}
            className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
              activeTab === TabType.AVAILABLE_TESTS
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText size={20} className="mr-2" />
            Доступные тесты ({availableTests.length})
          </button>
          <button
            onClick={() => setActiveTab(TabType.COMPLETED_TESTS)}
            className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center ${
              activeTab === TabType.COMPLETED_TESTS
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CheckSquare size={20} className="mr-2" />
            Завершенные тесты ({completedTests.length})
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === TabType.AVAILABLE_TESTS ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Доступные тесты</h2>
            
            {availableTests.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <FileText size={48} className="mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Нет доступных тестов</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Преподаватели пока не назначили вам тестов.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {availableTests.map(test => (
                  <TestCard key={test.id} test={test} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Завершенные тесты</h2>
            
            {completedTests.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <CheckSquare size={48} className="mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Нет завершенных тестов</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Вы еще не прошли ни одного теста.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {completedTests.map(test => {
                  const result = studentResults.find(r => r.testId === test.id);
                  if (!result) return null;
                  
                  return (
                    <TestResults key={test.id} test={test} result={result} />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
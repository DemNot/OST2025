import React, { useState } from 'react';
import { Test } from '../../types';
import { useData } from '../../context/DataContext';
import { Plus, Edit, Trash2, FileText, Check, Users } from 'lucide-react';
import TestForm from './TestForm';
import TestResultsView from './TestResultsView';

interface TestListProps {
  tests: Test[];
}

const TestList: React.FC<TestListProps> = ({ tests }) => {
  const { deleteTest, getResultsForTest, groups } = useData();
  const [isCreating, setIsCreating] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [viewingResults, setViewingResults] = useState<Test | null>(null);

  const handleEdit = (test: Test) => {
    setEditingTest(test);
    setIsCreating(false);
    setViewingResults(null);
  };

  const handleDelete = (testId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот тест? Все результаты также будут удалены.')) {
      deleteTest(testId);
    }
  };

  const handleViewResults = (test: Test) => {
    setViewingResults(test);
    setEditingTest(null);
    setIsCreating(false);
  };

  const handleFormClose = () => {
    setIsCreating(false);
    setEditingTest(null);
    setViewingResults(null);
  };

  if (isCreating || editingTest) {
    return <TestForm test={editingTest} onClose={handleFormClose} />;
  }

  if (viewingResults) {
    return <TestResultsView test={viewingResults} onClose={handleFormClose} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Тесты</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus size={16} className="mr-2" />
          Создать тест
        </button>
      </div>

      {tests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText size={48} className="mx-auto text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Тестов пока нет</h3>
          <p className="mt-1 text-sm text-gray-500">
            Создайте свой первый тест для оценки знаний студентов.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus size={16} className="mr-2" />
              Создать тест
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {tests.map((test) => {
              const results = getResultsForTest(test.id);
              const assignedGroups = groups.filter(g => test.groupIds.includes(g.id));
              
              return (
                <li key={test.id}>
                  <div className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-medium text-indigo-600">
                          {test.title}
                        </p>
                        <div className="flex shrink-0 space-x-2">
                          <button
                            onClick={() => handleViewResults(test)}
                            className="inline-flex items-center p-1.5 border border-transparent rounded-md text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                            title="Просмотр результатов"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(test)}
                            className="inline-flex items-center p-1.5 border border-transparent rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            title="Редактировать тест"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(test.id)}
                            className="inline-flex items-center p-1.5 border border-transparent rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            title="Удалить тест"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex flex-col">
                          <p className="text-sm text-gray-500 mb-1">
                            {test.description.length > 100
                              ? test.description.substring(0, 100) + '...'
                              : test.description}
                          </p>
                          <p className="flex items-center text-sm text-gray-500">
                            <Users size={16} className="mr-1.5 text-gray-400" />
                            Назначено группам: {assignedGroups.map(g => g.groupNumber).join(', ')}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            {results.length} {results.length === 1 ? 'результат' : 
                              results.length >= 2 && results.length <= 4 ? 'результата' : 'результатов'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TestList;
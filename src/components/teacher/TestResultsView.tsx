import React from 'react';
import { useData } from '../../context/DataContext';
import { Test, TestResult } from '../../types';
import { ArrowLeft, BarChart2 } from 'lucide-react';

interface TestResultsViewProps {
  test: Test;
  onClose: () => void;
}

const TestResultsView: React.FC<TestResultsViewProps> = ({ test, onClose }) => {
  const { getResultsForTest, users } = useData();
  const results = getResultsForTest(test.id);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Результаты: {test.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50"
          >
            <ArrowLeft size={16} className="mr-1" />
            Назад
          </button>
        </div>
        
        {results.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BarChart2 size={48} className="mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Результатов пока нет</h3>
            <p className="mt-1 text-sm text-gray-500">
              Ни один студент еще не прошел этот тест
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Сводная статистика */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Общая статистика</h4>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="bg-white p-4 rounded-md shadow-sm">
                  <p className="text-sm text-gray-500">Прошли тест</p>
                  <p className="text-2xl font-semibold text-gray-900">{results.length}</p>
                </div>
                <div className="bg-white p-4 rounded-md shadow-sm">
                  <p className="text-sm text-gray-500">Средний балл</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {(results.reduce((acc, r) => acc + (r.score / r.maxScore) * 100, 0) / results.length).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-white p-4 rounded-md shadow-sm">
                  <p className="text-sm text-gray-500">Максимальный балл</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {results.filter(r => r.score === r.maxScore).length}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Таблица результатов */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Индивидуальные результаты</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Студент
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Баллы
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Процент
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата завершения
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((result) => {
                      const student = users.find(u => u.id === result.studentId);
                      const percentage = (result.score / result.maxScore) * 100;
                      const completedDate = new Date(result.completedAt);
                      
                      return (
                        <tr key={result.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {student?.fullName || 'Неизвестный студент'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student?.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {result.score} / {result.maxScore}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              percentage >= 90 ? 'text-green-600' :
                              percentage >= 70 ? 'text-blue-600' :
                              percentage >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {percentage.toFixed(1)}%
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  percentage >= 90 ? 'bg-green-500' :
                                  percentage >= 70 ? 'bg-blue-500' :
                                  percentage >= 60 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`} 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {completedDate.toLocaleDateString('ru-RU')} в {completedDate.toLocaleTimeString('ru-RU')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestResultsView;
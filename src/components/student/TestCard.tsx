import React, { useState } from 'react';
import { Test } from '../../types';
import { Clock, FileText, Calendar } from 'lucide-react';
import TestTaker from './TestTaker';

interface TestCardProps {
  test: Test;
}

const TestCard: React.FC<TestCardProps> = ({ test }) => {
  const [isTaking, setIsTaking] = useState(false);

  if (isTaking) {
    return <TestTaker test={test} onClose={() => setIsTaking(false)} />;
  }

  const now = new Date();
  const startDate = new Date(test.startDate);
  const endDate = new Date(test.endDate);
  const isTestAvailable = now >= startDate && now <= endDate;

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-md">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-indigo-100 p-3 rounded-full">
            <FileText className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">{test.title}</h3>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-500">
            {test.description.length > 100
              ? test.description.substring(0, 100) + '...'
              : test.description}
          </p>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">
              Начало: {new Date(test.startDate).toLocaleString('ru-RU')}
            </span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">
              Окончание: {new Date(test.endDate).toLocaleString('ru-RU')}
            </span>
          </div>
          {test.timeLimit && (
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">
                Ограничение по времени: {test.timeLimit} минут
              </span>
            </div>
          )}
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <span>{test.questions.length} вопросов</span>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        {!isTestAvailable ? (
          <div className="text-sm text-red-600 text-center">
            {now < startDate
              ? 'Тест еще не начался'
              : 'Время прохождения теста истекло'}
          </div>
        ) : (
          <button
            onClick={() => setIsTaking(true)}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Начать тест
          </button>
        )}
      </div>
    </div>
  );
};

export default TestCard;
import React from 'react';
import { Test, TestResult } from '../../types';
import { Calendar, CheckCircle, Award } from 'lucide-react';

interface TestResultsProps {
  test: Test;
  result: TestResult;
}

const TestResults: React.FC<TestResultsProps> = ({ test, result }) => {
  const percentage = (result.score / result.maxScore) * 100;
  const completedDate = new Date(result.completedAt);
  
  let gradeLabel: string;
  let gradeColor: string;
  
  if (percentage >= 90) {
    gradeLabel = 'Отлично';
    gradeColor = 'text-green-600';
  } else if (percentage >= 80) {
    gradeLabel = 'Хорошо';
    gradeColor = 'text-emerald-600';
  } else if (percentage >= 70) {
    gradeLabel = 'Удовлетворительно';
    gradeColor = 'text-blue-600';
  } else if (percentage >= 60) {
    gradeLabel = 'Удовлетворительно';
    gradeColor = 'text-yellow-600';
  } else {
    gradeLabel = 'Неудовлетворительно';
    gradeColor = 'text-red-600';
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{test.title}</h3>
            <p className="text-sm text-gray-500">Предмет: {test.subject}</p>
          </div>
          <div className={`flex items-center font-semibold ${gradeColor}`}>
            {percentage >= 60 ? (
              <CheckCircle size={20} className="mr-1" />
            ) : (
              <Award size={20} className="mr-1" />
            )}
            {gradeLabel}
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar size={16} className="mr-1" />
            Завершено: {completedDate.toLocaleDateString()}
          </div>
          <div className="text-sm font-medium">
            Баллы: {result.score}/{result.maxScore}
          </div>
        </div>
        
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                percentage >= 90 ? 'bg-green-500' :
                percentage >= 80 ? 'bg-emerald-500' :
                percentage >= 70 ? 'bg-blue-500' :
                percentage >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }`} 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="mt-1 text-right text-sm text-gray-500">
            {percentage.toFixed(1)}%
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Детали ответов:</h4>
          <div className="space-y-4">
            {test.questions.map((question, index) => {
              const userAnswer = result.answers[question.id];
              const isCorrect = Array.isArray(question.correctAnswer) 
                ? JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer)
                : userAnswer === question.correctAnswer;

              return (
                <div key={question.id} className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Вопрос {index + 1}: {question.text}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          Ваш ответ: {Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer}
                        </p>
                        <p className="text-sm text-gray-600">
                          Правильный ответ: {Array.isArray(question.correctAnswer) 
                            ? question.correctAnswer.join(', ') 
                            : question.correctAnswer}
                        </p>
                      </div>
                    </div>
                    <div className={`ml-4 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {isCorrect ? <CheckCircle size={20} /> : <Award size={20} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestResults;
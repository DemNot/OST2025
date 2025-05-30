import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Test, Question } from '../../types';
import { ArrowLeft, ArrowRight, Clock, CheckCircle, XCircle } from 'lucide-react';

interface TestTakerProps {
  test: Test;
  onClose: () => void;
}

const TestTaker: React.FC<TestTakerProps> = ({ test, onClose }) => {
  const { user } = useAuth();
  const { submitTestResult } = useData();
  
  // Randomize questions if enabled
  const randomizedQuestions = useMemo(() => {
    const questions = [...test.questions];
    if (test.randomizeQuestions) {
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
    }
    return questions;
  }, [test.questions, test.randomizeQuestions]);

  // Randomize options for each question if enabled
  const questionsWithRandomizedOptions = useMemo(() => {
    return randomizedQuestions.map(question => {
      if (question.type !== 'text' && question.options && question.randomizeOptions) {
        const randomizedOptions = [...question.options];
        for (let i = randomizedOptions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [randomizedOptions[i], randomizedOptions[j]] = [randomizedOptions[j], randomizedOptions[i]];
        }
        return { ...question, options: randomizedOptions };
      }
      return question;
    });
  }, [randomizedQuestions]);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeLeft, setTimeLeft] = useState(test.timeLimit ? test.timeLimit * 60 : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<{ score: number; maxScore: number } | null>(null);
  
  const currentQuestion = questionsWithRandomizedOptions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questionsWithRandomizedOptions.length - 1;
  
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isSubmitted) return;
    
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
      
      if (timeLeft <= 1) {
        handleSubmitTest();
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft, isSubmitted]);
  
  const formatTimeLeft = () => {
    if (timeLeft === null) return 'Без ограничения времени';
    
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmitTest();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const handlePrevious = () => {
    setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
  };
  
  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers({
      ...answers,
      [questionId]: answer,
    });
  };
  
  const handleSingleChoiceChange = (questionId: string, option: string) => {
    handleAnswer(questionId, option);
  };
  
  const handleMultipleChoiceChange = (questionId: string, option: string, checked: boolean) => {
    const currentAnswers = answers[questionId] || [];
    let newAnswers: string[];
    
    if (Array.isArray(currentAnswers)) {
      if (checked) {
        newAnswers = [...currentAnswers, option];
      } else {
        newAnswers = currentAnswers.filter(a => a !== option);
      }
    } else {
      newAnswers = checked ? [option] : [];
    }
    
    handleAnswer(questionId, newAnswers);
  };
  
  const handleTextAnswerChange = (questionId: string, text: string) => {
    handleAnswer(questionId, text);
  };
  
  const calculateScore = (): { score: number; maxScore: number } => {
    let score = 0;
    
    test.questions.forEach(question => {
      const answer = answers[question.id];
      
      if (question.type === 'text') {
        if (typeof answer === 'string') {
          const normalizedAnswer = answer.trim().toLowerCase();
          const correctAnswers = Array.isArray(question.correctAnswer) 
            ? question.correctAnswer 
            : [question.correctAnswer, ...(question.alternativeAnswers || [])];
          
          if (correctAnswers.some(correct => 
            normalizedAnswer === (typeof correct === 'string' ? correct.trim().toLowerCase() : '')
          )) {
            score += 1;
          }
        }
      } else if (question.type === 'single-choice') {
        if (answer === question.correctAnswer) {
          score += 1;
        }
      } else if (question.type === 'multiple-choice') {
        if (Array.isArray(answer) && Array.isArray(question.correctAnswer)) {
          const sortedAnswer = [...answer].sort();
          const sortedCorrect = [...question.correctAnswer].sort();
          
          if (
            sortedAnswer.length === sortedCorrect.length &&
            sortedAnswer.every((a, i) => a === sortedCorrect[i])
          ) {
            score += 1;
          }
        }
      }
    });
    
    return { score, maxScore: test.questions.length };
  };
  
  const handleSubmitTest = () => {
    if (!user || user.role !== 'student' || isSubmitting) return;
    
    setIsSubmitting(true);
    
    const result = calculateScore();
    setScore(result);
    
    submitTestResult({
      testId: test.id,
      studentId: user.id,
      answers,
      score: result.score,
      maxScore: result.maxScore,
    });
    
    setIsSubmitted(true);
    setIsSubmitting(false);
  };
  
  if (isSubmitted && score) {
    const percentage = (score.score / score.maxScore) * 100;
    
    return (
      <div className="fixed inset-0 bg-gray-100 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
                <CheckCircle size={48} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Тест завершен</h3>
              <p className="text-gray-600">Спасибо за прохождение теста!</p>
            </div>
            
            <div className="max-w-md mx-auto bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500">Ваш результат</p>
                <div className="mt-2 text-4xl font-bold text-gray-900">
                  {score.score} / {score.maxScore}
                </div>
                <div 
                  className={`mt-2 inline-block px-3 py-1 text-sm font-medium rounded-full ${
                    percentage >= 90 ? 'bg-green-100 text-green-800' :
                    percentage >= 70 ? 'bg-blue-100 text-blue-800' :
                    percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}
                >
                  {percentage.toFixed(1)}%
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
                <div 
                  className={`h-4 rounded-full ${
                    percentage >= 90 ? 'bg-green-500' :
                    percentage >= 70 ? 'bg-blue-500' :
                    percentage >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              
              <button
                onClick={onClose}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Вернуться к списку тестов
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-gray-100 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium leading-6 text-gray-900">
                {test.title}
              </h3>
              {timeLeft !== null && (
                <div className={`flex items-center ${timeLeft < 60 ? 'text-red-600' : 'text-gray-600'}`}>
                  <Clock size={20} className="mr-2" />
                  <span className="font-mono text-lg">{formatTimeLeft()}</span>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questionsWithRandomizedOptions.length) * 100}%` }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-gray-500 text-right">
                Вопрос {currentQuestionIndex + 1} из {questionsWithRandomizedOptions.length}
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
                <h4 className="text-xl font-medium text-gray-800 mb-6">
                  {currentQuestion.text}
                </h4>
                
                {currentQuestion.type === 'text' ? (
                  <div>
                    <input
                      type="text"
                      value={(answers[currentQuestion.id] as string) || ''}
                      onChange={(e) => handleTextAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="Введите ваш ответ"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full text-lg p-4 border-gray-300 rounded-md"
                    />
                  </div>
                ) : currentQuestion.type === 'single-choice' ? (
                  <div className="space-y-4">
                    {currentQuestion.options?.map((option, index) => (
                      <label key={index} className="flex items-center space-x-3 p-4 rounded-md hover:bg-gray-100">
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          checked={(answers[currentQuestion.id] as string) === option}
                          onChange={() => handleSingleChoiceChange(currentQuestion.id, option)}
                          className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="text-lg text-gray-800">{option}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentQuestion.options?.map((option, index) => (
                      <label key={index} className="flex items-center space-x-3 p-4 rounded-md hover:bg-gray-100">
                        <input
                          type="checkbox"
                          checked={Array.isArray(answers[currentQuestion.id]) && 
                            (answers[currentQuestion.id] as string[]).includes(option)}
                          onChange={(e) => handleMultipleChoiceChange(currentQuestion.id, option, e.target.checked)}
                          className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="text-lg text-gray-800">{option}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className={`inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    currentQuestionIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <ArrowLeft size={20} className="mr-2" />
                  Назад
                </button>
                
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isLastQuestion ? 'Завершить тест' : 'Далее'}
                  {!isLastQuestion && <ArrowRight size={20} className="ml-2" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTaker;
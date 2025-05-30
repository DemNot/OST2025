import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Test, Question } from '../../types';
import { ArrowLeft, Save, Plus, Trash2, HelpCircle, Shuffle } from 'lucide-react';

interface TestFormProps {
  test: Test | null;
  onClose: () => void;
}

const TestForm: React.FC<TestFormProps> = ({ test, onClose }) => {
  const { user } = useAuth();
  const { createTest, updateTest, getGroupsForTeacher } = useData();
  
  const [title, setTitle] = useState(test?.title || '');
  const [subject, setSubject] = useState(test?.subject || '');
  const [description, setDescription] = useState(test?.description || '');
  const [selectedGroups, setSelectedGroups] = useState<string[]>(test?.groupIds || []);
  const [timeLimit, setTimeLimit] = useState<number | undefined>(test?.timeLimit);
  const [maxAttempts, setMaxAttempts] = useState<number | undefined>(test?.maxAttempts);
  const [startDate, setStartDate] = useState(test?.startDate || '');
  const [endDate, setEndDate] = useState(test?.endDate || '');
  const [randomizeQuestions, setRandomizeQuestions] = useState(test?.randomizeQuestions || false);
  const [questions, setQuestions] = useState<Question[]>(
    test?.questions.map(q => ({
      ...q,
      randomizeOptions: q.randomizeOptions || false
    })) || []
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!user || user.role !== 'teacher') return null;
  
  const teacherGroups = getGroupsForTeacher(user.id);

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      text: '',
      type: 'single-choice',
      options: ['', ''],
      correctAnswer: '',
      randomizeOptions: false,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleRemoveQuestion = (questionId: string) => {
    setQuestions(questions.filter((q) => q.id !== questionId));
  };

  const handleQuestionChange = (questionId: string, field: keyof Question, value: any) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          if (field === 'type' && value === 'text') {
            return { 
              ...q, 
              [field]: value,
              options: undefined,
              correctAnswer: '',
              alternativeAnswers: [],
              randomizeOptions: false
            };
          }
          return { ...q, [field]: value };
        }
        return q;
      })
    );
  };

  const handleOptionChange = (questionId: string, index: number, value: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.options) {
          const newOptions = [...q.options];
          newOptions[index] = value;
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  };

  const handleAddOption = (questionId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.options) {
          return { ...q, options: [...q.options, ''] };
        }
        return q;
      })
    );
  };

  const handleRemoveOption = (questionId: string, index: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.options && q.options.length > 2) {
          const newOptions = [...q.options];
          newOptions.splice(index, 1);
          
          let newCorrectAnswer = q.correctAnswer;
          if (Array.isArray(newCorrectAnswer)) {
            newCorrectAnswer = newCorrectAnswer.filter(a => a !== q.options?.[index]);
          } else if (newCorrectAnswer === q.options?.[index]) {
            newCorrectAnswer = '';
          }
          
          return { 
            ...q, 
            options: newOptions,
            correctAnswer: newCorrectAnswer
          };
        }
        return q;
      })
    );
  };

  const handleCorrectAnswerChange = (questionId: string, value: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          return { ...q, correctAnswer: value };
        }
        return q;
      })
    );
  };

  const handleMultipleCorrectAnswerChange = (questionId: string, optionValue: string, checked: boolean) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          const currentAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
          let newCorrectAnswers: string[];
          
          if (checked) {
            newCorrectAnswers = [...currentAnswers, optionValue];
          } else {
            newCorrectAnswers = currentAnswers.filter(a => a !== optionValue);
          }
          
          return { ...q, correctAnswer: newCorrectAnswers };
        }
        return q;
      })
    );
  };

  const handleAddAlternativeAnswer = (questionId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.type === 'text') {
          return {
            ...q,
            alternativeAnswers: [...(q.alternativeAnswers || []), '']
          };
        }
        return q;
      })
    );
  };

  const handleAlternativeAnswerChange = (questionId: string, index: number, value: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.type === 'text' && q.alternativeAnswers) {
          const newAlternativeAnswers = [...q.alternativeAnswers];
          newAlternativeAnswers[index] = value;
          return { ...q, alternativeAnswers: newAlternativeAnswers };
        }
        return q;
      })
    );
  };

  const handleRemoveAlternativeAnswer = (questionId: string, index: number) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.type === 'text' && q.alternativeAnswers) {
          const newAlternativeAnswers = [...q.alternativeAnswers];
          newAlternativeAnswers.splice(index, 1);
          return { ...q, alternativeAnswers: newAlternativeAnswers };
        }
        return q;
      })
    );
  };

  const handleToggleRandomizeOptions = (questionId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.type !== 'text') {
          return { ...q, randomizeOptions: !q.randomizeOptions };
        }
        return q;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (!user || user.role !== 'teacher') return;
    
    if (!startDate || !endDate) {
      alert('Пожалуйста, укажите дату и время начала и окончания теста');
      setIsSubmitting(false);
      return;
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    if (startDateTime >= endDateTime) {
      alert('Дата окончания теста должна быть позже даты начала');
      setIsSubmitting(false);
      return;
    }
    
    const isValid = questions.every(q => {
      if (!q.text.trim()) return false;
      
      if (q.type === 'text') {
        return q.correctAnswer && typeof q.correctAnswer === 'string';
      } else {
        if (!q.options || q.options.some(o => !o.trim())) return false;
        
        if (q.type === 'single-choice') {
          return q.correctAnswer && typeof q.correctAnswer === 'string';
        } else if (q.type === 'multiple-choice') {
          return Array.isArray(q.correctAnswer) && q.correctAnswer.length > 0;
        }
      }
      return true;
    });
    
    if (!isValid) {
      alert('Пожалуйста, заполните все вопросы и варианты ответов');
      setIsSubmitting(false);
      return;
    }
    
    if (test) {
      updateTest({
        ...test,
        title,
        subject,
        description,
        groupIds: selectedGroups,
        questions,
        timeLimit: timeLimit || undefined,
        maxAttempts: maxAttempts || undefined,
        startDate,
        endDate,
        randomizeQuestions,
      });
    } else {
      createTest({
        title,
        subject,
        description,
        teacherId: user.id,
        groupIds: selectedGroups,
        questions,
        timeLimit: timeLimit || undefined,
        maxAttempts: maxAttempts || undefined,
        startDate,
        endDate,
        randomizeQuestions,
      });
    }
    
    setIsSubmitting(false);
    onClose();
  };

  const toggleGroup = (groupId: string) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter(id => id !== groupId));
    } else {
      setSelectedGroups([...selectedGroups, groupId]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {test ? 'Редактировать тест' : 'Создать новый тест'}
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
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Название теста
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Например: Контрольная работа по математике"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Предмет
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Например: Математика"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Описание
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Опишите тест и его цели"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Дата и время начала теста
                </label>
                <div className="mt-1">
                  <input
                    type="datetime-local"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  Дата и время окончания теста
                </label>
                <div className="mt-1">
                  <input
                    type="datetime-local"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700">
                  Ограничение по времени (в минутах)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    id="timeLimit"
                    min="1"
                    value={timeLimit || ''}
                    onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Оставьте пустым, если нет ограничения"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="maxAttempts" className="block text-sm font-medium text-gray-700">
                  Количество попыток
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    id="maxAttempts"
                    min="1"
                    value={maxAttempts || ''}
                    onChange={(e) => setMaxAttempts(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Без ограничения"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Оставьте пустым для неограниченного количества попыток
                  </p>
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Настройки случайного порядка
                  </label>
                </div>
                <div className="mt-2 space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="randomizeQuestions"
                      checked={randomizeQuestions}
                      onChange={(e) => setRandomizeQuestions(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="randomizeQuestions" className="ml-2 block text-sm text-gray-900">
                      Перемешивать порядок вопросов для каждого студента
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Назначить группам
                </label>
                
                {teacherGroups.length === 0 ? (
                  <div className="text-sm text-red-500">
                    Создайте хотя бы одну группу перед созданием теста.
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-md overflow-hidden max-h-40 overflow-y-auto">
                    <ul className="divide-y divide-gray-200">
                      {teacherGroups.map((group) => (
                        <li key={group.id} className="px-4 py-2 hover:bg-gray-50">
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedGroups.includes(group.id)}
                              onChange={() => toggleGroup(group.id)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="text-sm font-medium text-gray-800">
                              Группа {group.groupNumber} - {group.specialty}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-base font-medium text-gray-900">Вопросы</h4>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus size={16} className="mr-1" />
                  Добавить вопрос
                </button>
              </div>
              
              {questions.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <HelpCircle size={32} className="mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Вопросов пока нет. Нажмите "Добавить вопрос", чтобы начать.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, qIndex) => (
                    <div key={question.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="text-sm font-medium text-gray-700">
                          Вопрос {qIndex + 1}
                        </h5>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(question.id)}
                          className="inline-flex items-center p-1 border border-transparent rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          title="Удалить вопрос"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Текст вопроса
                          </label>
                          <input
                            type="text"
                            value={question.text}
                            onChange={(e) => handleQuestionChange(question.id, 'text', e.target.value)}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            required
                            placeholder="Введите текст вопроса"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Тип ответа
                          </label>
                          <select
                            value={question.type}
                            onChange={(e) => handleQuestionChange(question.id, 'type', e.target.value)}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          >
                            <option value="single-choice">Один вариант ответа</option>
                            <option value="multiple-choice">Несколько вариантов ответа</option>
                            <option value="text">Текстовый ответ</option>
                          </select>
                        </div>
                        
                        {question.type !== 'text' && (
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-sm font-medium text-gray-700">
                                Варианты ответов
                              </label>
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleRandomizeOptions(question.id)}
                                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                                    question.randomizeOptions
                                      ? 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'
                                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                                  }`}
                                  title={question.randomizeOptions ? 'Отключить перемешивание' : 'Включить перемешивание'}
                                >
                                  <Shuffle size={14} className="mr-1" />
                                  {question.randomizeOptions ? 'Перемешивать' : 'По порядку'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddOption(question.id)}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-700 hover:text-indigo-800 focus:outline-none"
                                >
                                  <Plus size={14} className="mr-1" />
                                  Добавить вариант
                                </button>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              {question.options?.map((option, oIndex) => (
                                <div key={oIndex} className="flex items-center space-x-2">
                                  {question.type === 'single-choice' ? (
                                    <input
                                      type="radio"
                                      name={`correct-${question.id}`}
                                      checked={question.correctAnswer === option}
                                      onChange={() => handleCorrectAnswerChange(question.id, option)}
                                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                    />
                                  ) : (
                                    <input
                                      type="checkbox"
                                      checked={Array.isArray(question.correctAnswer) && question.correctAnswer.includes(option)}
                                      onChange={(e) => handleMultipleCorrectAnswerChange(question.id, option, e.target.checked)}
                                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                  )}
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleOptionChange(question.id, oIndex, e.target.value)}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    placeholder={`Вариант ответа ${oIndex + 1}`}
                                    required
                                  />
                                  {question.options && question.options.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOption(question.id, oIndex)}
                                      className="text-red-500 hover:text-red-700"
                                      title="Удалить вариант"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {question.type === 'single-choice'
                                ? 'Выберите правильный ответ'
                                : 'Выберите все правильные ответы'}
                            </p>
                          </div>
                        )}
                        
                        {question.type === 'text' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Правильный ответ
                            </label>
                            <input
                              type="text"
                              value={question.correctAnswer as string}
                              onChange={(e) => handleCorrectAnswerChange(question.id, e.target.value)}
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              required
                              placeholder="Введите правильный ответ"
                            />
                            
                            <div className="mt-4">
                              <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  Альтернативные варианты ответа
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleAddAlternativeAnswer(question.id)}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-700 hover:text-indigo-800"
                                >
                                  <Plus size={14} className="mr-1" />
                                  Добавить вариант
                                </button>
                              </div>
                              
                              <div className="space-y-2">
                                {question.alternativeAnswers?.map((answer, index) => (
                                  <div key={index} className="flex items-center space-x-2">
                                    <input
                                      type="text"
                                      value={answer}
                                      onChange={(e) => handleAlternativeAnswerChange(question.id, index, e.target.value)}
                                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                      placeholder={`Альтернативный ответ ${index + 1}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveAlternativeAnswer(question.id, index)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting || 
                  title.trim() === '' || 
                  selectedGroups.length === 0 || 
                  questions.length === 0 ||
                  !startDate ||
                  !endDate
                }
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  (isSubmitting || 
                    title.trim() === '' || 
                    selectedGroups.length === 0 || 
                    questions.length === 0 ||
                    !startDate ||
                    !endDate) ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <Save size={16} className="mr-2" />
                {isSubmitting ? 'Сохранение...' : 'Сохранить тест'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestForm
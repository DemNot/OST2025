import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Group } from '../../types';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';

interface GroupFormProps {
  group: Group | null;
  onClose: () => void;
}

const GroupForm: React.FC<GroupFormProps> = ({ group, onClose }) => {
  const { user } = useAuth();
  const { createGroup, updateGroup } = useData();
  const [groupNumber, setGroupNumber] = useState(group?.groupNumber || '');
  const [specialty, setSpecialty] = useState(group?.specialty || '');
  const [institution, setInstitution] = useState(group?.institution || (user?.institution || ''));
  const [students, setStudents] = useState<Array<{ id: string; fullName: string }>>(
    Array.isArray(group?.students) ? 
      group.students.map(student => {
        if (typeof student === 'object' && student.id && student.fullName) {
          return student;
        }
        return {
          id: typeof student === 'string' ? student : student.id,
          fullName: typeof student === 'string' ? 'Unknown Student' : student.fullName
        };
      }) 
      : []
  );
  const [newStudentName, setNewStudentName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddStudent = () => {
    if (!newStudentName.trim() || newStudentName.split(' ').length < 3) {
      setError('Пожалуйста, введите полное ФИО студента');
      return;
    }

    setStudents([
      ...students,
      { id: Date.now().toString(), fullName: newStudentName.trim() }
    ]);
    setNewStudentName('');
    setError(null);
  };

  const handleRemoveStudent = (studentId: string) => {
    setStudents(students.filter(s => s.id !== studentId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    if (!user || user.role !== 'teacher') return;
    
    if (students.length === 0) {
      setError('Добавьте хотя бы одного студента');
      setIsSubmitting(false);
      return;
    }

    try {
      if (group) {
        updateGroup({
          ...group,
          groupNumber,
          specialty,
          institution,
          students,
        });
      } else {
        createGroup(groupNumber, specialty, institution, students);
      }
      
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {group ? 'Редактировать группу' : 'Создать новую группу'}
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
        
        {error && (
          <div className="mb-4 bg-red-50 text-red-500 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="institution" className="block text-sm font-medium text-gray-700">
                Учебное заведение
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="institution"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Название учебного заведения"
                />
              </div>
            </div>

            <div>
              <label htmlFor="groupNumber" className="block text-sm font-medium text-gray-700">
                Номер группы
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="groupNumber"
                  value={groupNumber}
                  onChange={(e) => setGroupNumber(e.target.value)}
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="например, ИС-41"
                />
              </div>
            </div>

            <div>
              <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">
                Специальность
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="specialty"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="например, Информационные системы"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Студенты ({students.length})
              </label>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Введите ФИО студента"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={handleAddStudent}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <UserPlus size={16} className="mr-2" />
                    Добавить
                  </button>
                </div>

                {students.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <UserPlus size={32} className="mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Добавьте студентов в группу
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                      {students.map((student, index) => (
                        <li key={student.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                          <span className="text-sm text-gray-900">
                            {index + 1}. {student.fullName}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(student.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Удалить
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
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
                disabled={isSubmitting || !groupNumber.trim() || !specialty.trim() || !institution.trim() || students.length === 0}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  (isSubmitting || !groupNumber.trim() || !specialty.trim() || !institution.trim() || students.length === 0) ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <Save size={16} className="mr-2" />
                {isSubmitting ? 'Сохранение...' : 'Сохранить группу'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupForm;
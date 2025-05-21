import React, { useState } from 'react';
import { Group } from '../../types';
import { useData } from '../../context/DataContext';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import GroupForm from './GroupForm';

interface GroupListProps {
  groups: Group[];
}

const GroupList: React.FC<GroupListProps> = ({ groups }) => {
  const { deleteGroup, getStudentsInGroup } = useData();
  const [isCreating, setIsCreating] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setIsCreating(false);
  };

  const handleDelete = (groupId: string) => {
    if (confirm('Вы уверены, что хотите удалить эту группу? Это действие нельзя отменить.')) {
      deleteGroup(groupId);
    }
  };

  const handleFormClose = () => {
    setIsCreating(false);
    setEditingGroup(null);
  };

  if (isCreating || editingGroup) {
    return (
      <GroupForm
        group={editingGroup}
        onClose={handleFormClose}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Группы студентов</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus size={16} className="mr-2" />
          Создать группу
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users size={48} className="mx-auto text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Групп пока нет</h3>
          <p className="mt-1 text-sm text-gray-500">
            Создайте свою первую группу студентов, чтобы начать работу.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus size={16} className="mr-2" />
              Создать группу
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden bg-white shadow sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {groups.map((group) => {
              const students = getStudentsInGroup(group.id);
              return (
                <li key={group.id}>
                  <div className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-sm font-medium text-indigo-600">
                          {group.groupNumber}
                        </p>
                        <div className="flex shrink-0 space-x-2">
                          <button
                            onClick={() => handleEdit(group)}
                            className="inline-flex items-center p-1.5 border border-transparent rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(group.id)}
                            className="inline-flex items-center p-1.5 border border-transparent rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <Users size={16} className="mr-1.5 text-gray-400" />
                            {students.length} {students.length === 1 ? 'студент' : students.length >= 2 && students.length <= 4 ? 'студента' : 'студентов'}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            Создано: {new Date(group.createdAt).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Специальность: {group.specialty}
                        </p>
                        <p className="text-sm text-gray-500">
                          Учебное заведение: {group.institution}
                        </p>
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

export default GroupList;
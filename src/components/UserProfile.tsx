import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, X, Save } from 'lucide-react';

interface UserProfileProps {
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { user, updateProfile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    institution: user?.institution || '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatName = (fullName: string) => {
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      const lastName = parts[0];
      const initials = parts.slice(1).map(name => `${name[0]}.`).join('');
      return `${lastName} ${initials}`;
    }
    return fullName;
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (user) {
          updateProfile({ ...user, photoUrl: reader.result as string });
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setIsUploading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    try {
      await updateProfile({
        ...user,
        ...editedData
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">Профиль пользователя</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.fullName}
                  className="h-32 w-32 rounded-full object-cover"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Camera size={40} className="text-indigo-600" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50"
                disabled={isUploading}
              >
                <Camera size={20} className="text-gray-600" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={isUploading}
              />
            </div>
            
            <div className="mt-6 w-full space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ФИО</label>
                    <input
                      type="text"
                      value={editedData.fullName}
                      onChange={(e) => setEditedData({ ...editedData, fullName: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={editedData.email}
                      onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Учебное заведение</label>
                    <input
                      type="text"
                      value={editedData.institution}
                      onChange={(e) => setEditedData({ ...editedData, institution: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      <Save size={16} className="inline-block mr-2" />
                      Сохранить
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <h3 className="text-xl font-medium text-gray-900">{formatName(user.fullName)}</h3>
                    <p className="mt-1 text-sm font-medium text-indigo-600">
                      {user.role === 'teacher' ? 'Преподаватель' : 'Студент'}
                    </p>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                        <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                      </div>

                      <div>
                        <dt className="text-sm font-medium text-gray-500">Учебное заведение</dt>
                        <dd className="mt-1 text-sm text-gray-900">{user.institution}</dd>
                      </div>

                      {user.role === 'student' && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Номер группы</dt>
                          <dd className="mt-1 text-sm text-gray-900">{user.groupNumber}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {user.role === 'teacher' && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setEditedData({
                            fullName: user.fullName,
                            email: user.email,
                            institution: user.institution,
                          });
                          setIsEditing(true);
                        }}
                        className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        Редактировать профиль
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;